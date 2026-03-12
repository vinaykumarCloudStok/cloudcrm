import api from './api';

export const getLeads = (params?: any) => api.get('/leads', { params });
export const getLead = (id: number) => api.get(`/leads/${id}`);
export const createLead = (data: any) => api.post('/leads', data);
export const updateLead = (id: number, data: any) => api.put(`/leads/${id}`, data);
export const updateLeadStage = (id: number, stage: string) => api.patch(`/leads/${id}/stage`, { stage });
export const convertLead = (id: number, data: any) => api.post(`/leads/${id}/convert`, data);
export const scoreLead = (id: number) => api.post(`/agents/lead-score/${id}`);
