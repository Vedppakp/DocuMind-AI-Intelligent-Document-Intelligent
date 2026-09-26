import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth tokens and custom API keys automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('documind_token');
  const geminiKey = localStorage.getItem('documind_gemini_key');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (geminiKey) {
    config.headers['x-gemini-key'] = geminiKey;
  }

  return config;
});

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API 401] Unauthorized access:', error.response.data?.error);
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/forgot-password') ||
        error.config?.url?.includes('/auth/reset-password');
      if (!isAuthRoute) {
        localStorage.removeItem('documind_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const documentApi = {
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (folder) => api.get('/documents', { params: folder ? { folder } : {} }),
  get: (id) => api.get(`/documents/${id}`),
  getChunks: (id) => api.get(`/documents/${id}/chunks`),
  delete: (id) => api.delete(`/documents/${id}`),
  updateFolder: (id, folder) => api.patch(`/documents/${id}/folder`, { folder }),
  getFolders: () => api.get('/documents/folders/list'),
  getPdfUrl: (id, page) => `/api/documents/${id}/pdf${page ? `#page=${page}` : ''}`,
  loadSample: () => api.post('/documents/load-sample'),
};

export const chatApi = {
  sendMessage: (payload) => api.post('/chat/message', payload),
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data) => api.post('/chat/conversations', data),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId) => api.delete(`/chat/conversations/${conversationId}`),
};

export const toolApi = {
  summarize: (documentId, regenerate = false) =>
    api.post(`/tools/summarize/${documentId}`, { regenerate }),
  quiz: (documentId, count = 5) =>
    api.post(`/tools/quiz/${documentId}`, { count }),
  compare: (docId1, docId2) =>
    api.post('/tools/compare', { docId1, docId2 }),
  getReport: (documentId, conversationId = null) =>
    api.get(`/tools/report/${documentId}`, {
      params: conversationId ? { conversationId } : {},
    }),
};

export const adminApi = {
  getMetrics: () => api.get('/admin/metrics'),
};

export default api;
