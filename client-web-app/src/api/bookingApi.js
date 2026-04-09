import axios from 'axios';
import { getAuthToken } from './authApi';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE || 'http://localhost:8080') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from session to every request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getMyBookings = () => api.get('/bookings/my');

export const getAllBookings = (status, date) => {
  const params = {};
  if (status && status !== 'ALL') params.status = status;
  if (date) params.date = date;
  return api.get('/bookings', { params });
};

export const createBooking = (data) => api.post('/bookings', data);

export const approveBooking = (id) => api.patch(`/bookings/${id}/approve`);

export const rejectBooking = (id, rejectionReason) =>
  api.patch(`/bookings/${id}/reject`, { rejectionReason });

export const cancelBooking = (id, cancelReason) =>
  api.patch(`/bookings/${id}/cancel`, { cancelReason });

export const deleteBooking = (id) => api.delete(`/bookings/${id}`);
