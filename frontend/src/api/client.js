const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => request('/auth/me'),

  getDashboard: () => request('/dashboard'),
  getUsers: () => request('/users'),
  getUserSummary: (id) => request(`/users/${id}/summary`),

  getTasks: (ownerId) => request(`/tasks${ownerId ? `?owner_id=${ownerId}` : ''}`),
  getMyTasks: () => request('/tasks/mine'),
  createTask: (payload) => request('/tasks', { method: 'POST', body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: 'PATCH', body: payload }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getDailyUpdates: (ownerId) => request(`/daily-updates${ownerId ? `?owner_id=${ownerId}` : ''}`),
  createDailyUpdate: (payload) => request('/daily-updates', { method: 'POST', body: payload }),

  getActivity: () => request('/activity'),
  getNotifications: () => request('/notifications'),
};
