import api from './api';

export const generateAccountIntel = (accountId: number) => api.post(`/agents/account-intel/${accountId}`);
export const scoreLead = (leadId: number) => api.post(`/agents/lead-score/${leadId}`);
export const generateBrief = (id: number) => api.post(`/agents/deal-coach/${id}`);
export const generateFollowUp = (opportunityId: number, data?: any) => api.post(`/agents/follow-up/${opportunityId}`, data);
export const scanFollowUps = () => api.post('/agents/follow-up/scan');
