import { create } from 'zustand';
import api from '../services/api';
import { User } from '../utils/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  isManager: () => boolean;
  isAdmin: () => boolean;
   isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('agentcrm_token'),
  loading: false,
 isAuthenticated: !!localStorage.getItem('agentcrm_token'),
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    localStorage.setItem('agentcrm_token', accessToken);
    set({ user, token: accessToken });
  },

  logout: () => {
    localStorage.removeItem('agentcrm_token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  loadUser: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/auth/me');
      set({ user: res.data, loading: false });
    } catch {
      set({ user: null, token: null, loading: false });
      localStorage.removeItem('agentcrm_token');
    }
  },

  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role) : false;
  },

  isManager: () => {
    const user = get().user;
    return user ? ['ADMIN', 'SALES_MANAGER'].includes(user.role) : false;
  },

  isAdmin: () => get().user?.role === 'ADMIN',
}));
