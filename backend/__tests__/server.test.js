const request = require('supertest');

process.env.NODE_ENV = 'test';

describe('server routes (no external services required)', () => {
  // server.js only calls app.listen() when run directly (require.main === module),
  // so requiring it here for supertest doesn't also bind a real port.
  const app = require('../server.js');

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/ai/status reports unavailable when neither LM Studio nor a cloud key is configured', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('backend');
    expect(['local', 'cloud', 'unavailable']).toContain(res.body.backend);
  });

  it('protected routes reject requests with no Authorization header', async () => {
    const res = await request(app).get('/api/repositories');
    expect(res.status).toBe(401);
  });
});
