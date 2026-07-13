import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

// Inject Supabase session token
api.interceptors.request.use(async (config) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (e) {}
  return config;
});

// Repository APIs
export const repoAPI = {
  getAll: () => api.get('/api/repositories'),
  scanAll: () => api.post('/api/repositories/scan'),
  scanOne: (id: string) => api.post(`/api/repositories/${id}/scan`),
  getOne: (id: string) => api.get(`/api/repositories/${id}`),
  updateImportance: (id: string, score: number) => api.put(`/api/repositories/${id}/importance`, { importance_score: score }),
  getHealthStats: () => api.get('/api/repositories/health/stats'),
};

// AI APIs
export const aiAPI = {
  generateDailyPlan: (repoId?: string) => api.post('/api/ai/daily-plan', { repoId }),
  generateTask: (task: any, repoId: string) => api.post('/api/ai/generate-task', { task, repoId }),
  generateCommitMessage: (diff: string, repoName: string, taskDescription?: string) =>
    api.post('/api/ai/commit-message', { diff, repoName, taskDescription }),
  getPortfolioHealth: () => api.get('/api/ai/portfolio-health'),
  getRecommendations: () => api.get('/api/ai/recommendations'),
  getTasks: (params?: { repoId?: string; status?: string }) => api.get('/api/ai/tasks', { params }),
  updateTask: (id: string, status: string) => api.put(`/api/ai/tasks/${id}`, { status }),
  getAIStatus: () => api.get('/api/ai/status'),
};

// Git APIs
export const gitAPI = {
  getStatus: (repoId: string) => api.get('/api/git/status', { params: { repoId } }),
  prepare: (repoId: string, taskDescription?: string) => api.post('/api/git/prepare', { repoId, taskDescription }),
  commit: (repoId: string, commitMessage: string) =>
    api.post('/api/git/commit', { repoId, commitMessage, approved: true }),
  push: (repoId: string) =>
    api.post('/api/git/push', { repoId, approved: true }),
  commitAndPush: (repoId: string, commitMessage: string) =>
    api.post('/api/git/commit-and-push', { repoId, commitMessage, approved: true }),
  getHistory: () => api.get('/api/git/history'),
};

// Feedback APIs
export const feedbackAPI = {
  submit: (data: { repoId: string; action: string; notes?: string; recommendationId?: string }) =>
    api.post('/api/feedback', data),
  getHistory: () => api.get('/api/feedback'),
  getPatterns: () => api.get('/api/feedback/patterns'),
};

// Auth APIs
export const authAPI = {
  getGithubUrl: () => api.get('/api/auth/github-url'),
  connectGithub: (userId: string, githubToken: string) =>
    api.post('/api/auth/github/connect', { userId, githubToken }),
  getMe: () => api.get('/api/auth/me'),
};

export default api;
