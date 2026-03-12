import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const loadSampleData = () => api.post('/load-sample');
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData);
};
export const getOverview = () => api.get('/overview');
export const getMonthlySummary = () => api.get('/monthly-summary');
export const getWeeklySummary = (month) => api.get(`/weekly-summary?month=${month}`);
export const getAnomalies = () => api.get('/anomalies');
export const getForecast = () => api.get('/forecast');
export const getSubscriptions = () => api.get('/subscriptions');
export const getAdvice = () => api.post('/advice');
export const getSavingsGoal = (target, months) =>
  api.post('/savings-goal', { target, months });
export const getRecentTransactions = () => api.get('/recent-transactions');

export default api;
