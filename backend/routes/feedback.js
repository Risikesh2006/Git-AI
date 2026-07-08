const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const supabase = require('../services/supabase');

// POST /api/feedback - Submit feedback on recommendation
router.post('/', authenticate, async (req, res) => {
  try {
    const { repoId, recommendationId, action, notes } = req.body;
    const validActions = ['completed', 'ignored', 'modified', 'in_progress'];

    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: `Action must be one of: ${validActions.join(', ')}` });
    }

    const { data, error } = await supabase.from('feedback').insert({
      user_id: req.user.id,
      repo_id: repoId,
      recommendation_id: recommendationId,
      action,
      notes,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    // Adjust priority based on feedback
    if (repoId && action === 'completed') {
      const { data: repo } = await supabase
        .from('repositories')
        .select('priority_score')
        .eq('id', repoId)
        .single();

      if (repo) {
        const newScore = Math.max(0, repo.priority_score - 20);
        await supabase.from('repositories').update({ priority_score: newScore }).eq('id', repoId);
      }
    }

    res.json({ success: true, feedback: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback - Get user feedback history
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, repositories(repo_name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/patterns - Get learning patterns from feedback
router.get('/patterns', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, repositories(repo_name, language)')
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Analyze patterns
    const actionCounts = data.reduce((acc, f) => {
      acc[f.action] = (acc[f.action] || 0) + 1;
      return acc;
    }, {});

    const completionRate = data.length > 0
      ? Math.round((actionCounts.completed || 0) / data.length * 100)
      : 0;

    const preferredLanguages = data
      .filter(f => f.action === 'completed')
      .map(f => f.repositories?.language)
      .filter(Boolean)
      .reduce((acc, lang) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});

    res.json({
      total_feedback: data.length,
      action_distribution: actionCounts,
      completion_rate: completionRate,
      preferred_languages: preferredLanguages,
      recent_activity: data.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
