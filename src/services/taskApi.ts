import api from './api';

export const getTasks = (params?: any) => api.get('/tasks', { params });
export const getTask = (id: number) => api.get(`/tasks/${id}`);
export const createTask = (data: any) => api.post('/tasks', data);
export const updateTask = (id: number, data: any) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`);
