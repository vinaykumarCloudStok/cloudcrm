import api from './api';

export const getContacts = (params?: any) => api.get('/contacts', { params });
export const getContact = (id: number) => api.get(`/contacts/${id}`);
export const createContact = (data: any) => api.post('/contacts', data);
export const updateContact = (id: number, data: any) => api.put(`/contacts/${id}`, data);
export const getContactsByAccount = (accountId: number) => api.get(`/contacts`, { params: { accountId } });
