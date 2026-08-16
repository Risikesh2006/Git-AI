const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const GitHubCommitService = require('../services/githubCommit');
const aiService = require('../services/ai');
const supabase = require('../services/supabase');
const { decrypt } = require('../services/tokenCrypto');

// GitHub operations run entirely through the GitHub API (Contents + Git Data API) —
// no local clone, no server disk. The backend stays stateless across instances.

async function getGitHubContext(userId, repoId) {
  const { data: userData } = await supabase
    .from('users')
    .select('github_access_token, github_username, name, email')
    .eq('id', userId)
    .single();
  if (!userData?.github_access_token) throw new Error('GitHub not connected');

  const { data: repo } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', repoId)
    .eq('user_id', userId)
    .single();
  if (!repo) throw new Error('Repository not found');

  const token = decrypt(userData.github_access_token);
  const owner = repo.repo_owner || userData.github_username;
  return {
    token,
    owner,
    repoName: repo.repo_name,
    repo,
    author: { name: userData.name || userData.github_username, email: userData.email || `${userData.github_username}@users.noreply.github.com` }
  };
}

// GET /api/git/status - Get current repo status from GitHub (recent commits, default branch)
router.get('/status', authenticate, async (req, res) => {
  try {
    const { repoId } = req.query;
    if (!repoId) return res.status(400).json({ error: 'repoId required' });

    const { token, owner, repoName } = await getGitHubContext(req.user.id, repoId);
    const gitService = new GitHubCommitService(token);
    const status = await gitService.getRepoStatus(owner, repoName);

    res.json({ ...status, repo_name: repoName });
  } catch (err) {
    console.error('[Git] Status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/prepare - Preview an in-memory diff for proposed file changes and draft a commit message
// Body: { repoId, taskDescription, files: [{ path, newContent }] }
router.post('/prepare', authenticate, async (req, res) => {
  try {
    const { repoId, taskDescription, files } = req.body;
    if (!repoId) return res.status(400).json({ error: 'repoId required' });
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files (array of {path, newContent}) required' });
    }

    const { token, owner, repoName, repo } = await getGitHubContext(req.user.id, repoId);
    const gitService = new GitHubCommitService(token);
    const branch = repo.default_branch || (await gitService.getDefaultBranch(owner, repoName));

    const previews = await gitService.previewChanges(owner, repoName, files, branch);
    const combinedDiff = previews.map(p => p.diff).join('\n');
    const hasChanges = previews.some(p => p.has_changes);

    let suggestedMessage = '';
    if (hasChanges) {
      try {
        suggestedMessage = await aiService.generateCommitMessage(combinedDiff, repoName, taskDescription || '', req.user.id);
      } catch (e) {
        suggestedMessage = `chore: update ${previews.length} file(s) in ${repoName}`;
      }
    }

    res.json({
      repo_name: repoName,
      branch,
      files: previews,
      suggested_commit_message: suggestedMessage,
      has_changes: hasChanges
    });
  } catch (err) {
    console.error('[Git] Prepare error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/commit - Commit files to a (new or existing) branch via the Git Data API
// Requires explicit user approval. Body: { repoId, files, commitMessage, approved, branchName? }
router.post('/commit', authenticate, async (req, res) => {
  try {
    const { repoId, files, commitMessage, approved, branchName } = req.body;

    if (!approved) {
      return res.status(400).json({
        error: 'User approval required',
        message: 'Set approved: true to confirm the commit'
      });
    }
    if (!repoId || !commitMessage || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'repoId, commitMessage, and files are required' });
    }

    const { token, owner, repoName, repo, author } = await getGitHubContext(req.user.id, repoId);
    const gitService = new GitHubCommitService(token);
    const defaultBranch = repo.default_branch || (await gitService.getDefaultBranch(owner, repoName));

    // Commits land on a feature branch by default rather than the default branch directly —
    // safer for a multi-user product than pushing straight to main.
    const targetBranch = branchName || `gitai/${Date.now()}`;
    if (targetBranch !== defaultBranch) {
      await gitService.createBranch(owner, repoName, targetBranch, defaultBranch);
    }

    const result = await gitService.commitFiles(owner, repoName, targetBranch, files, commitMessage, author);

    await supabase.from('commits').insert({
      user_id: req.user.id,
      repo_id: repoId,
      commit_hash: result.commit_sha,
      commit_message: commitMessage,
      pushed: true,
      committed_at: new Date().toISOString()
    });

    res.json({
      success: true,
      commit: result.commit_sha,
      message: commitMessage,
      branch: targetBranch,
      is_feature_branch: targetBranch !== defaultBranch
    });
  } catch (err) {
    console.error('[Git] Commit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/pull-request - Open a PR from a feature branch created by /commit
router.post('/pull-request', authenticate, async (req, res) => {
  try {
    const { repoId, branchName, title, body, approved } = req.body;

    if (!approved) {
      return res.status(400).json({ error: 'User approval required', message: 'Set approved: true to confirm' });
    }
    if (!repoId || !branchName || !title) {
      return res.status(400).json({ error: 'repoId, branchName, and title are required' });
    }

    const { token, owner, repoName, repo } = await getGitHubContext(req.user.id, repoId);
    const gitService = new GitHubCommitService(token);
    const pr = await gitService.openPullRequest(owner, repoName, branchName, repo.default_branch, title, body);

    res.json({ success: true, ...pr });
  } catch (err) {
    console.error('[Git] Pull request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/git/history - Get commit history from our own log (not GitHub)
router.get('/history', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commits')
      .select('*, repositories(repo_name)')
      .eq('user_id', req.user.id)
      .order('committed_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
