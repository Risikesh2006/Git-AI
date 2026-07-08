const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gitService = require('../services/git');
const aiService = require('../services/ai');
const supabase = require('../services/supabase');

async function getGitHubToken(userId) {
  const { data } = await supabase
    .from('users')
    .select('github_access_token, github_username, name, email')
    .eq('id', userId)
    .single();
  if (!data?.github_access_token) throw new Error('GitHub not connected');
  return data;
}

// GET /api/git/status - Get git status of a repo
router.get('/status', authenticate, async (req, res) => {
  try {
    const { repoId } = req.query;
    if (!repoId) return res.status(400).json({ error: 'repoId required' });

    const userData = await getGitHubToken(req.user.id);
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const repoPath = await gitService.getRepoPath(
      repo.clone_url,
      repo.repo_name,
      userData.github_access_token
    );

    const status = await gitService.getStatus(repoPath);
    const log = await gitService.getLog(repoPath, 5);

    res.json({ ...status, recent_commits: log, repo_name: repo.repo_name, branch: repo.default_branch });
  } catch (err) {
    console.error('[Git] Status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/prepare - Prepare repo and get diff for review
router.post('/prepare', authenticate, async (req, res) => {
  try {
    const { repoId, taskDescription } = req.body;
    if (!repoId) return res.status(400).json({ error: 'repoId required' });

    const userData = await getGitHubToken(req.user.id);
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const repoPath = await gitService.getRepoPath(
      repo.clone_url,
      repo.repo_name,
      userData.github_access_token
    );

    const status = await gitService.getStatus(repoPath);
    const diff = await gitService.getDiff(repoPath);

    // Generate AI commit message
    let suggestedMessage = '';
    if (status.has_changes) {
      try {
        suggestedMessage = await aiService.generateCommitMessage(diff, repo.repo_name, taskDescription || '');
      } catch (e) {
        suggestedMessage = `chore: update ${repo.repo_name}`;
      }
    }

    res.json({
      repo_name: repo.repo_name,
      branch: status.branch || repo.default_branch,
      status,
      diff: diff.substring(0, 10000), // Limit diff size
      suggested_commit_message: suggestedMessage,
      has_changes: status.has_changes
    });
  } catch (err) {
    console.error('[Git] Prepare error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/commit - Commit changes (requires user approval)
router.post('/commit', authenticate, async (req, res) => {
  try {
    const { repoId, commitMessage, approved } = req.body;

    if (!approved) {
      return res.status(400).json({
        error: 'User approval required',
        message: 'Set approved: true to confirm the commit'
      });
    }

    if (!repoId || !commitMessage) {
      return res.status(400).json({ error: 'repoId and commitMessage required' });
    }

    const userData = await getGitHubToken(req.user.id);
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const repoPath = await gitService.getRepoPath(
      repo.clone_url,
      repo.repo_name,
      userData.github_access_token
    );

    // Stage all changes
    await gitService.stageAll(repoPath);

    // Commit
    const result = await gitService.commit(
      repoPath,
      commitMessage,
      userData.name || userData.github_username,
      userData.email || `${userData.github_username}@users.noreply.github.com`
    );

    // Save to database
    await supabase.from('commits').insert({
      user_id: req.user.id,
      repo_id: repoId,
      commit_hash: result.commit,
      commit_message: commitMessage,
      committed_at: new Date().toISOString()
    });

    res.json({
      success: true,
      commit: result.commit,
      message: commitMessage,
      summary: result.summary
    });
  } catch (err) {
    console.error('[Git] Commit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/push - Push to remote (requires approval)
router.post('/push', authenticate, async (req, res) => {
  try {
    const { repoId, approved } = req.body;

    if (!approved) {
      return res.status(400).json({
        error: 'User approval required',
        message: 'Set approved: true to confirm the push'
      });
    }

    if (!repoId) return res.status(400).json({ error: 'repoId required' });

    const userData = await getGitHubToken(req.user.id);
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const repoPath = await gitService.getRepoPath(
      repo.clone_url,
      repo.repo_name,
      userData.github_access_token
    );

    const result = await gitService.push(repoPath, repo.default_branch || 'main');

    // Update last commit date
    await supabase
      .from('repositories')
      .update({ last_scanned_at: new Date().toISOString() })
      .eq('id', repoId);

    res.json({
      success: true,
      pushed: true,
      branch: repo.default_branch || 'main',
      repo: repo.repo_name
    });
  } catch (err) {
    console.error('[Git] Push error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/commit-and-push - Commit and push in one action (requires approval)
router.post('/commit-and-push', authenticate, async (req, res) => {
  try {
    const { repoId, commitMessage, approved } = req.body;

    if (!approved) {
      return res.status(400).json({
        requiresApproval: true,
        message: 'This action will commit and push changes to GitHub. Set approved: true to confirm.'
      });
    }

    if (!repoId || !commitMessage) {
      return res.status(400).json({ error: 'repoId and commitMessage required' });
    }

    const userData = await getGitHubToken(req.user.id);
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const repoPath = await gitService.getRepoPath(
      repo.clone_url,
      repo.repo_name,
      userData.github_access_token
    );

    await gitService.stageAll(repoPath);

    const commitResult = await gitService.commit(
      repoPath,
      commitMessage,
      userData.name || userData.github_username,
      userData.email || `${userData.github_username}@users.noreply.github.com`
    );

    const pushResult = await gitService.push(repoPath, repo.default_branch || 'main');

    await supabase.from('commits').insert({
      user_id: req.user.id,
      repo_id: repoId,
      commit_hash: commitResult.commit,
      commit_message: commitMessage,
      pushed: true,
      committed_at: new Date().toISOString()
    });

    res.json({
      success: true,
      commit: commitResult.commit,
      message: commitMessage,
      pushed: true,
      branch: repo.default_branch || 'main',
      repo: repo.repo_name
    });
  } catch (err) {
    console.error('[Git] Commit+Push error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/git/history - Get commit history
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
