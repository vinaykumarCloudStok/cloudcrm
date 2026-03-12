import api from './api';

export const getAccounts = (params?: any) => api.get('/accounts', { params });
export const getAccount = (id: number) => api.get(`/accounts/${id}`);
export const createAccount = (data: any) => api.post('/accounts', data);
export const updateAccount = (id: number, data: any) => api.put(`/accounts/${id}`, data);
export const getAccountTimeline = (id: number, params?: any) => api.get(`/accounts/${id}/timeline`, { params });
