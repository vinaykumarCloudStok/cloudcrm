import api from './api';

export const getCampaigns = (params?: any) => api.get('/campaigns', { params });
export const getCampaign = (id: number) => api.get(`/campaigns/${id}`);
export const createCampaign = (data: any) => api.post('/campaigns', data);
export const updateCampaign = (id: number, data: any) => api.put(`/campaigns/${id}`, data);
export const deleteCampaign = (id: number) => api.delete(`/campaigns/${id}`);
export const addCampaignStep = (campaignId: number, data: any) => api.post(`/campaigns/${campaignId}/steps`, data);
export const updateCampaignStep = (campaignId: number, stepId: number, data: any) => api.put(`/campaigns/${campaignId}/steps/${stepId}`, data);
export const deleteCampaignStep = (campaignId: number, stepId: number) => api.delete(`/campaigns/${campaignId}/steps/${stepId}`);
export const enrollContact = (campaignId: number, contactId: number) => api.post(`/campaigns/${campaignId}/enroll`, { contactId });
