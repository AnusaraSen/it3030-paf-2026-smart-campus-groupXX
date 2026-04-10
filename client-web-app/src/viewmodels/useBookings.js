import { useCallback, useEffect, useMemo, useState } from 'react';
import { cancelBooking, getMyBookings } from '../api/bookingApi';

export default function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMyBookings();
      const nextBookings = Array.isArray(response.data) ? response.data : [];
      setBookings(nextBookings);
    } catch (requestError) {
      setBookings([]);
      setError(requestError instanceof Error ? requestError.message : 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, refreshKey]);

  const handleCancel = useCallback(async (bookingId, cancelReason = '') => {
    if (!bookingId) {
      throw new Error('Booking ID is required.');
    }

    await cancelBooking(bookingId, cancelReason || null);
    setRefreshKey((currentValue) => currentValue + 1);
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED').length;

    return {
      total,
      approved,
      pending,
      cancelled,
    };
  }, [bookings]);

  return {
    bookings,
    loading,
    error,
    stats,
    handleCancel,
    refreshBookings: loadBookings,
  };
}
