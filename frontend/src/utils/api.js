import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const ordersApi = {
  createCustom: (data) => api.post('/orders/custom', data),
  getAll: () => api.get('/orders/custom'),
  updateStatus: (id, status) => api.patch(`/orders/custom/${id}/status?status=${status}`),
  uploadReference: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/orders/upload-reference', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const adminApi = {
  seed: () => api.post('/admin/seed'),
  getStats: () => api.get('/admin/stats'),
}

export default api
