const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/ai');
const { RepositoryService } = require('../services/repository');
const supabase = require('../services/supabase');

// POST /api/ai/daily-plan - Generate daily development plan
router.post('/daily-plan', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { repoId } = req.body;

    let repo;
    if (repoId) {
      const { data } = await supabase
        .from('repositories')
        .select('*, repository_metrics(*)')
        .eq('id', repoId)
        .eq('user_id', userId)
        .single();
      repo = data;
    } else {
      repo = await RepositoryService.getTopPriorityRepo(userId);
    }

    if (!repo) return res.status(404).json({ error: 'No repositories found. Please scan your repositories first.' });

    const metrics = {
      repository_name: repo.repo_name,
      language: repo.language,
      description: repo.description,
      days_since_last_commit: repo.repository_metrics?.[0]?.days_since_last_commit || 0,
      open_issues: repo.repository_metrics?.[0]?.open_issues || 0,
      test_files: repo.repository_metrics?.[0]?.test_files || 0,
      documentation_score: repo.repository_metrics?.[0]?.documentation_score || 0,
      stars: repo.stars || 0,
      recent_commits_30d: repo.repository_metrics?.[0]?.recent_commits_30d || 0
    };

    const plan = await aiService.generateDevelopmentPlan(metrics, repo.priority_score);

    // Save recommendation to database
    await supabase.from('ai_recommendations').insert({
      user_id: userId,
      repo_id: repo.id,
      plan_data: plan,
      generated_at: new Date().toISOString()
    });

    res.json({
      repository: {
        id: repo.id,
        name: repo.repo_name,
        priority_score: repo.priority_score,
        language: repo.language
      },
      plan,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AI] Daily plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-task - Generate specific task implementation
router.post('/generate-task', authenticate, async (req, res) => {
  try {
    const { task, repoId } = req.body;
    if (!task || !repoId) return res.status(400).json({ error: 'task and repoId required' });

    const { data: repo } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('id', repoId)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const metrics = {
      repository_name: repo.repo_name,
      language: repo.language,
      description: repo.description
    };

    const implementation = await aiService.generateTaskImplementation(task, metrics);

    // Save task
    await supabase.from('tasks').insert({
      user_id: req.user.id,
      repo_id: repoId,
      title: task.title,
      description: task.description,
      implementation_data: implementation,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    res.json({ task, implementation, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/commit-message - Generate commit message
router.post('/commit-message', authenticate, async (req, res) => {
  try {
    const { diff, repoName, taskDescription } = req.body;
    if (!repoName) return res.status(400).json({ error: 'repoName required' });

    const message = await aiService.generateCommitMessage(diff || '', repoName, taskDescription || '');
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/portfolio-health - Get AI portfolio analysis
router.get('/portfolio-health', authenticate, async (req, res) => {
  try {
    const repos = await RepositoryService.getUserRepos(req.user.id);
    if (!repos || repos.length === 0) {
      return res.status(404).json({ error: 'No repositories found' });
    }

    const repoMetrics = repos.map(r => ({
      repository_name: r.repo_name,
      days_since_last_commit: r.repository_metrics?.[0]?.days_since_last_commit || 0,
      open_issues: r.repository_metrics?.[0]?.open_issues || 0,
      documentation_score: r.repository_metrics?.[0]?.documentation_score || 0,
      stars: r.stars || 0
    }));

    const health = await aiService.generateHealthReport(repoMetrics);
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/recommendations - Get saved recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*, repositories(repo_name, language, priority_score)')
      .eq('user_id', req.user.id)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/tasks - Get all tasks for user
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const { repoId, status } = req.query;
    let query = supabase
      .from('tasks')
      .select('*, repositories(repo_name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (repoId) query = query.eq('repo_id', repoId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/ai/tasks/:id - Update task status
router.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed', 'ignored'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ updated: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/status - Check LM Studio connection
router.get('/status', async (req, res) => {
  try {
    const axios = require('axios');
    const url = process.env.LM_STUDIO_URL || 'http://localhost:1234';
    const response = await axios.get(`${url}/v1/models`, { timeout: 3000 });
    res.json({
      connected: true,
      models: response.data?.data || [],
      url
    });
  } catch (err) {
    res.json({
      connected: false,
      error: 'LM Studio not running. Start LM Studio and load a model.',
      url: process.env.LM_STUDIO_URL || 'http://localhost:1234'
    });
  }
});

module.exports = router;
