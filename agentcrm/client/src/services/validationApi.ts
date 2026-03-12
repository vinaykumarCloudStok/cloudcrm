import api from './api';

export const getChecklists = (oppId: number) => api.get(`/validation/opportunities/${oppId}/checklists`);
export const updateChecklist = (oppId: number, type: string, items: any) => api.put(`/validation/opportunities/${oppId}/checklists/${type}`, { items });
export const getHandoff = (oppId: number) => api.get(`/validation/opportunities/${oppId}/handoff`);
export const updateHandoff = (oppId: number, data: any) => api.put(`/validation/opportunities/${oppId}/handoff`, data);
