import api from './api';

export const getUsers = (params?: any) => api.get('/users', { params });
export const getUser = (id: number) => api.get(`/users/${id}`);
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: number, data: any) => api.put(`/users/${id}`, data);
export const deactivateUser = (id: number) => api.patch(`/users/${id}/deactivate`);
