const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Supabase JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.supabaseToken = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware]', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };
