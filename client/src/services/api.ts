import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Match endpoints
export const matchAPI = {
  getAll: () => api.get('/matches'),
  getById: (id: string) => api.get(`/matches/${id}`),
  create: (data: {
    matchNumber: number;
    matchDate: string;
    teamA: { name: string; flag: string };
    teamB: { name: string; flag: string };
    predictionStart: string;
    predictionEnd: string;
  }) => api.post('/matches', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/matches/${id}`, data),
  declareResult: (id: string, result: string) =>
    api.post(`/matches/${id}/result`, { result }),
};

// Prediction endpoints
export const predictionAPI = {
  submit: (data: { matchId: string; choice: string }) =>
    api.post('/predictions', data),
  getMy: () => api.get('/predictions/my'),
  getPollResults: (matchId: string) =>
    api.get(`/predictions/poll/${matchId}`),
};

// Leaderboard endpoints
export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
  getDates: () => api.get('/leaderboard/daily'),
  getDaily: (date: string) => api.get('/leaderboard/daily?date=' + date),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  adjustPoints: (data: { userId: string; points: number; reason: string }) =>
    api.post('/admin/points/adjust', data),
  getPointHistory: (userId: string) =>
    api.get(`/admin/points/history/${userId}`),
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),
  updateUserRole: (userId: string, role: 'admin' | 'user') =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  updateScoreAccess: (userId: string, canChangeScores: boolean) =>
    api.patch(`/admin/users/${userId}/score-access`, { canChangeScores }),
  updateFullAccess: (userId: string, isSuperAdmin: boolean) =>
    api.patch(`/admin/users/${userId}/full-access`, { isSuperAdmin }),
};

// Comment endpoints
export const commentsAPI = {
  getGeneral: () => api.get('/comments/general'),
  getMatch: (matchId: string) => api.get(`/comments/match/${matchId}`),
  post: (data: { text: string; type: 'general' | 'match'; matchId?: string }) =>
    api.post('/comments', data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export default api;


