import { api } from './api';
import { setToken, removeToken } from '../utils/auth';

export const authService = {
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
  
  logout: () => {
    removeToken();
  },
  
  getMe: () => api.get('/auth/me')
};
