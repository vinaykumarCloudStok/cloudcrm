import api from './api';

export const getOpportunities = (params?: any) => api.get('/opportunities', { params });
export const getOpportunity = (id: number) => api.get(`/opportunities/${id}`);
export const createOpportunity = (data: any) => api.post('/opportunities', data);
export const updateOpportunity = (id: number, data: any) => api.put(`/opportunities/${id}`, data);
export const updateOpportunityStage = (id: number, stage: string) => api.patch(`/opportunities/${id}/stage`, { stage });
export const getPipeline = (params?: any) => api.get('/opportunities/pipeline', { params });
export const getForecast = (params?: any) => api.get('/opportunities/forecast', { params });
