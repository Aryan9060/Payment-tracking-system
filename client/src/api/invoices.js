import api from './client.js';

export const fetchInvoices = async (params = {}) =>
  (await api.get('/invoices', { params })).data;

export const fetchInvoice = async (id) => (await api.get(`/invoices/${id}`)).data;

export const createInvoice = async (payload) => (await api.post('/invoices', payload)).data;

export const updateInvoice = async (id, payload) => (await api.put(`/invoices/${id}`, payload)).data;

export const deleteInvoice = async (id) => (await api.delete(`/invoices/${id}`)).data;

export const recordPayment = async (id, payload) =>
  (await api.post(`/invoices/${id}/payments`, payload)).data;

export const markInvoicePaid = async (id) =>
  (await api.post(`/invoices/${id}/mark-paid`)).data;

export const fetchDashboard = async () => (await api.get('/dashboard')).data;
