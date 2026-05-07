import { api } from './api';

export const postsService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/posts${query ? `?${query}` : ''}`);
  },
  
  getBySlug: (slug) => api.get(`/api/posts/slug/${slug}`),
  
  getCategories: () => api.get('/api/categories'),
  
  getAdminPosts: () => api.get('/api/admin/posts'),
  
  getAdminPost: (id) => api.get(`/api/admin/posts/${id}`),
  
  create: (data) => api.post('/api/admin/posts', data),
  
  update: (id, data) => api.put(`/api/admin/posts/${id}`, data),
  
  delete: (id) => api.delete(`/api/admin/posts/${id}`)
};
