import { useState, useEffect, useCallback } from 'react';
import { getMyBookings, cancelBooking } from '../api/bookingApi';

const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyBookings();
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (id, cancelReason = '') => {
    try {
      await cancelBooking(id, cancelReason);
      await fetchBookings();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const stats = {
    total: bookings.length,
    approved: bookings.filter((b) => b.status === 'APPROVED').length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
  };

  return { bookings, loading, error, stats, handleCancel, refetch: fetchBookings };
};

export default useBookings;
