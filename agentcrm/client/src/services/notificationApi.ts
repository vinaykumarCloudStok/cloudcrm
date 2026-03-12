import api from './api';

export const getNotifications = (params?: any) => api.get('/notifications', { params });
export const markAsRead = (id: number) => api.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => api.patch('/notifications/read-all');
export const getUnreadCount = () => api.get('/notifications/unread-count');
