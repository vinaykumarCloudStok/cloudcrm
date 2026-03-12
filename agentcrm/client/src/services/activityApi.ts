import api from './api';

export const getActivities = (params?: any) => api.get('/activities', { params });
export const createActivity = (data: any) => api.post('/activities', data);
