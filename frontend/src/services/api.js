import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

if (import.meta.env.DEV) {
  console.log('API Base URL:', API_URL);
}

export const getJobs = async (params) => {
  const { data } = await api.get('/filter', { params });
  return data;
};

export const getCompanies = async () => {
  const { data } = await api.get('/companies');
  return data;
};

export const triggerRefresh = async () => {
  const { data } = await api.post('/refresh');
  return data;
};

// ── Job Alerts ───────────────────────────────────────────────────────────────

export const getAlerts = async () => {
  const { data } = await api.get('/alerts');
  return data;
};

export const createAlert = async (alertData) => {
  const { data } = await api.post('/alerts', alertData);
  return data;
};

export const deleteAlert = async (id) => {
  await api.delete(`/alerts/${id}`);
};

export const toggleAlert = async (id) => {
  const { data } = await api.patch(`/alerts/${id}/toggle`);
  return data;
};

export const markAlertRead = async (id) => {
  const { data } = await api.patch(`/alerts/${id}/read`);
  return data;
};

export const getAlertMatches = async (id) => {
  const { data } = await api.get(`/alerts/${id}/matches`);
  return data;
};

export const getAlertsCount = async () => {
  const { data } = await api.get('/alerts-count');
  return data.count;
};

export default api;
