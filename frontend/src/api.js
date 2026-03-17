import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  me:       () => api.get('/auth/me'),
};

export const sessionAPI = {
  getAll:   () => api.get('/sessions'),
  getAllAdmin: () => api.get('/sessions/all'),
  create:   (data) => api.post('/sessions', data),
  update:   (id, data) => api.patch(`/sessions/${id}`, data),
  delete:   (id) => api.delete(`/sessions/${id}`),
};

export const questionAPI = {
  getAll:  (params) => api.get('/questions', { params }),
  create:  (data)   => api.post('/questions', data),
  update:  (id, d)  => api.patch(`/questions/${id}`, d),
  delete:  (id)     => api.delete(`/questions/${id}`),
};

export const userAPI = {
  getAll:    () => api.get('/users'),
  getStats:  () => api.get('/users/stats'),
  setRole:   (id, role) => api.patch(`/users/${id}/role`, { role }),
  delete:    (id)       => api.delete(`/users/${id}`),
};

export const evaluateAPI = {
  evaluate: (question, answer) => api.post('/evaluate', { question, answer }),
};

export default api;
