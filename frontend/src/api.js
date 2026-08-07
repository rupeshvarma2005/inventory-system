import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL });

export function getApiError(err) {
  return err?.response?.data?.error || err?.response?.data?.hint || err?.message || 'Request failed';
}

export const api = {
  getProducts: () => client.get('/products').then(r => r.data),
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
};
