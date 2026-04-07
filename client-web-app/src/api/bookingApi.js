import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getMyBookings = () => api.get('/bookings/my');

export const getAllBookings = (page = 0, size = 10) =>
  api.get(`/bookings?page=${page}&size=${size}`);

export const createBooking = (data) => api.post('/bookings', data);

export const approveBooking = (id) => api.patch(`/bookings/${id}/approve`);

export const rejectBooking = (id, rejectionReason) =>
  api.patch(`/bookings/${id}/reject`, { rejectionReason });

export const cancelBooking = (id, cancelReason) =>
  api.patch(`/bookings/${id}/cancel`, { cancelReason });

export const deleteBooking = (id) => api.delete(`/bookings/${id}`);
