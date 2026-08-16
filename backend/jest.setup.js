// Ensures every test run has the env vars the app expects, without touching
// real Supabase/GitHub/Anthropic credentials.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || require('crypto').randomBytes(32).toString('base64');
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
