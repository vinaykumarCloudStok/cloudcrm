import api from './api';

export const getRepDashboard = () => api.get('/dashboard/rep');
export const getManagerDashboard = () => api.get('/dashboard/manager');
