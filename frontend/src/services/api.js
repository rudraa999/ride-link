import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ridelink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      // localStorage.removeItem('ridelink_token');
      // localStorage.removeItem('ridelink_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const collegeAPI = {
  getAll: (search) => api.get('/colleges', { params: { search } }),
};

export const availabilityAPI = {
  start: (data) => api.post('/availability/start', data),
  stop: () => api.post('/availability/stop'),
  getCurrent: () => api.get('/availability/current'),
  getMatches: () => api.get('/availability/matches'),
};

export const requestAPI = {
  send: (data) => api.post('/requests/send', data),
  accept: (id) => api.post(`/requests/${id}/accept`),
  reject: (id) => api.post(`/requests/${id}/reject`),
  getIncoming: () => api.get('/requests/incoming'),
};

export const matchAPI = {
  getHistory: (status) => api.get('/matches/history', { params: { status } }),
  getActive: () => api.get('/matches/active'),
  getById: (id) => api.get(`/matches/${id}`),
  updateStatus: (id, status) => api.put(`/matches/${id}/status`, null, { params: { status } }),
};

export const chatAPI = {
  getMessages: (matchId) => api.get(`/chat/matches/${matchId}/messages`),
  sendMessage: (matchId, content) => api.post(`/chat/matches/${matchId}/messages`, { content }),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  updateCampus: (activeCampus) => api.put('/profile/campus', { activeCampus }),
  changePassword: (data) => api.put('/profile/password', data),
  updatePrivacy: (data) => api.put('/profile/privacy', data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/profile/photo', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
  },
};

export const configAPI = {
  getGeoapifyKey: () => api.get('/config/geoapify'),
};

export default api;
