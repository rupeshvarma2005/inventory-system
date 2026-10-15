import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (import.meta.env.VITE_AUTH_BYPASS !== 'true' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getApiError(err) {
  return err?.response?.data?.error || err?.response?.data?.hint || err?.message || 'Request failed';
}

export const api = {
  client,
  getProducts: (params = {}) => client.get('/products', { params }).then(r => r.data),
  getProduct: (id) => client.get(`/products/${id}`).then(r => r.data),
  createProduct: (payload) => client.post('/products', payload).then(r => r.data),
  getWarehouses: () => client.get('/warehouses').then(r => r.data),
  getInventory: () => client.get('/inventory').then(r => r.data),
  getAlerts: () => client.get('/inventory/alerts').then(r => r.data),
  adjustStock: (payload) => client.post('/inventory/adjust', payload).then(r => r.data),

  getOrders: () => client.get('/orders').then(r => r.data),
  getOrder: (id) => client.get(`/orders/${id}`).then(r => r.data),
  createOrder: (payload) => client.post('/orders', payload).then(r => r.data),
  shipOrder: (id) => client.post(`/orders/${id}/ship`).then(r => r.data),

  getTopProducts: () => client.get('/analytics/top-products').then(r => r.data),
  getRevenueByCategory: () => client.get('/analytics/revenue-by-category').then(r => r.data),
  getMonthlyGrowth: () => client.get('/analytics/monthly-growth').then(r => r.data),
  getWarehouseUtilization: () => client.get('/analytics/warehouse-utilization').then(r => r.data),
  
  getCart: () => client.get('/cart').then(r => r.data),
  addToCart: (payload) => client.post('/cart', payload).then(r => r.data),
  removeFromCart: (productId) => client.delete(`/cart/${productId}`).then(r => r.data),
};

export default client;
