const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const GitHubService = require('../services/github');
const { RepositoryService, calculatePriorityScore } = require('../services/repository');
const supabase = require('../services/supabase');

// Helper: get GitHub token for user
async function getGitHubToken(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('github_access_token')
    .eq('id', userId)
    .single();
  if (error || !data?.github_access_token) throw new Error('GitHub not connected. Please connect your GitHub account.');
  return data.github_access_token;
}

// GET /api/repositories - Get all repositories for user
router.get('/', authenticate, async (req, res) => {
  try {
    const repos = await RepositoryService.getUserRepos(req.user.id);
    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repositories/scan - Scan all GitHub repos
router.post('/scan', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = await getGitHubToken(userId);
    const github = new GitHubService(token);

    // Get all repos
    const allRepos = await github.getAllRepositories();
    console.log(`[Scan] Found ${allRepos.length} repositories for user ${userId}`);

    // Update scan started status
    const results = [];

    // Scan repos (with concurrency limit)
    const CONCURRENT = 3;
    for (let i = 0; i < allRepos.length; i += CONCURRENT) {
      const batch = allRepos.slice(i, i + CONCURRENT);
      const batchResults = await Promise.allSettled(
        batch.map(async (repo) => {
          try {
            const [owner, repoName] = [repo.owner.login, repo.name];
            const metrics = await github.scanRepository(owner, repoName);
            const priorityScore = calculatePriorityScore(metrics);
            const saved = await RepositoryService.upsertRepository(userId, metrics, priorityScore);
            return { success: true, name: repoName, priority: priorityScore };
          } catch (e) {
            console.error(`[Scan] Error scanning ${repo.name}:`, e.message);
            return { success: false, name: repo.name, error: e.message };
          }
        })
      );
      results.push(...batchResults.map(r => r.value || r.reason));
    }

    const successful = results.filter(r => r?.success).length;
    res.json({
      scanned: allRepos.length,
      successful,
      failed: allRepos.length - successful,
      results
    });
  } catch (err) {
    console.error('[Scan] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repositories/:id - Get single repository
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repositories/:id/scan - Scan single repository
router.post('/:id/scan', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = await getGitHubToken(userId);

    const { data: repo, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !repo) return res.status(404).json({ error: 'Repository not found' });

    const github = new GitHubService(token);
    const githubUser = await github.getUser();
    const metrics = await github.scanRepository(githubUser.login, repo.repo_name);
    const priorityScore = calculatePriorityScore(metrics);
    const saved = await RepositoryService.upsertRepository(userId, metrics, priorityScore);

    res.json({ ...saved, priority_score: priorityScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/repositories/:id/importance - Update user-defined importance
router.put('/:id/importance', authenticate, async (req, res) => {
  try {
    const { importance_score } = req.body;
    if (importance_score < 0 || importance_score > 100) {
      return res.status(400).json({ error: 'Importance score must be 0-100' });
    }

    // Recalculate priority with importance override
    const { data: repo } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    const metrics = repo?.repository_metrics?.[0] || {};
    const basePriority = calculatePriorityScore(metrics);
    const adjustedPriority = Math.round((basePriority * 0.7) + (importance_score * 0.3));

    await RepositoryService.updatePriority(req.params.id, adjustedPriority, importance_score);

    res.json({ priority_score: adjustedPriority, importance_score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repositories/health/stats - Get portfolio health stats
router.get('/health/stats', authenticate, async (req, res) => {
  try {
    const stats = await RepositoryService.getHealthStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
