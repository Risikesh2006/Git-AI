const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/auth/github-url - Get GitHub OAuth URL
router.get('/github-url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL || 'http://localhost:8000/api/auth/callback');
  const scope = encodeURIComponent('read:user user:email repo');
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  res.json({ url });
});

// GET /api/auth/callback - GitHub OAuth callback (used if not using Supabase OAuth)
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/auth?error=no_code`);

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) return res.redirect(`${process.env.FRONTEND_URL}/auth?error=${tokenData.error}`);

    const githubToken = tokenData.access_token;

    // Get GitHub user
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/json' }
    });
    const githubUser = await userRes.json();

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        github_id: String(githubUser.id),
        github_username: githubUser.login,
        name: githubUser.name || githubUser.login,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        github_access_token: githubToken,
        updated_at: new Date().toISOString()
      }, { onConflict: 'github_id' })
      .select()
      .single();

    if (error) {
      console.error('[Auth] Supabase error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=db_error`);
    }

    // Redirect to frontend with user data
    const params = new URLSearchParams({
      userId: user.id,
      username: user.github_username,
      name: user.name || '',
      avatar: user.avatar_url || '',
      token: githubToken
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=server_error`);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, github_username, name, email, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/github/connect - Store GitHub token (for Supabase OAuth flow)
router.post('/github/connect', async (req, res) => {
  try {
    const { userId, githubToken } = req.body;
    if (!userId || !githubToken) {
      return res.status(400).json({ error: 'userId and githubToken required' });
    }

    // Get GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${githubToken}` }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }

    const githubUser = await userRes.json();

    await supabase.from('users').upsert({
      id: userId,
      github_id: String(githubUser.id),
      github_username: githubUser.login,
      name: githubUser.name || githubUser.login,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
      github_access_token: githubToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    res.json({
      connected: true,
      github_username: githubUser.login,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/github/token - Get stored GitHub token for a user
router.get('/github/token', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('github_access_token, github_username')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    if (!data.github_access_token) {
      return res.status(404).json({ error: 'GitHub not connected' });
    }
    res.json({ github_username: data.github_username, connected: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
