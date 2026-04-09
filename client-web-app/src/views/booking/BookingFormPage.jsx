import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createBooking, getAllBookings } from '../../api/bookingApi';

const todayMin = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
};

const inputClass =
  'w-full rounded-xl border border-[#272269]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#272269] shadow-sm outline-none transition focus:border-[#F57923]/60 focus:ring-2 focus:ring-[#F57923]/20 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#272269]/40';

const labelClass = 'mb-1 block text-[11px] font-bold uppercase tracking-widest text-[#272269]/50';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function formatAvailabilityWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return 'No availability set';
  }

  return windows
    .map((window) => `${String(window.dayOfWeek || '').slice(0, 3)} ${window.startTime || ''}-${window.endTime || ''}`.trim())
    .join(', ');
}

function toMinutes(time) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map((value) => Number(value));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function isWithinAvailability(resourceAvailabilityWindows, startDateTime, endDateTime) {
  if (!Array.isArray(resourceAvailabilityWindows) || resourceAvailabilityWindows.length === 0) {
    return 'This resource has no availability windows configured.';
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Please choose a valid booking time.';
  }

  if (start.toDateString() !== end.toDateString()) {
    return 'Booking must start and end on the same day.';
  }

  const dayName = DAY_NAMES[start.getDay()];
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const isMatch = resourceAvailabilityWindows.some((window) => {
    if (window?.dayOfWeek !== dayName) {
      return false;
    }

    const windowStart = toMinutes(window.startTime);
    const windowEnd = toMinutes(window.endTime);
    if (windowStart == null || windowEnd == null) {
      return false;
    }

    return startMinutes >= windowStart && endMinutes <= windowEnd;
  });

  return isMatch ? '' : 'Selected time is outside the resource availability windows.';
}

function formatBookingRange(startDateTime, endDateTime) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Unknown booking range';
  }

  return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function overlapsBookedRange(bookedStart, bookedEnd, selectedStart, selectedEnd) {
  return bookedStart < selectedEnd && bookedEnd > selectedStart;
}

function getBookingOverlapError(bookings, startDateTime, endDateTime) {
  if (!Array.isArray(bookings) || bookings.length === 0 || !startDateTime || !endDateTime) {
    return '';
  }

  const selectedStart = new Date(startDateTime);
  const selectedEnd = new Date(endDateTime);
  if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime())) {
    return '';
  }

  const conflict = bookings.find((booking) => {
    const bookedStart = new Date(booking.startDateTime);
    const bookedEnd = new Date(booking.endDateTime);

    if (Number.isNaN(bookedStart.getTime()) || Number.isNaN(bookedEnd.getTime())) {
      return false;
    }

    return overlapsBookedRange(bookedStart, bookedEnd, selectedStart, selectedEnd);
  });

  if (!conflict) {
    return '';
  }

  return `This time overlaps an approved booking from ${formatBookingRange(conflict.startDateTime, conflict.endDateTime)}.`;
}

export default function BookingFormPage({ resource, resourceId, onClose, onSuccess }) {
  const selectedResourceId = resource?.id ?? resourceId ?? '';
  const resourceStatus = resource?.status || '';
  const availabilityWindows = resource?.availabilityWindows || [];
  const [occupiedBookings, setOccupiedBookings] = useState([]);
  const [loadingOccupiedBookings, setLoadingOccupiedBookings] = useState(false);

  const [form, setForm] = useState({
    resourceId:        selectedResourceId,
    purpose:           '',
    startDateTime:     '',
    endDateTime:       '',
    expectedAttendees: '',
  });

  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const bookingWindowError = useMemo(
    () => isWithinAvailability(availabilityWindows, form.startDateTime, form.endDateTime),
    [availabilityWindows, form.endDateTime, form.startDateTime],
  );

  const bookingOverlapError = useMemo(
    () => getBookingOverlapError(occupiedBookings, form.startDateTime, form.endDateTime),
    [form.endDateTime, form.startDateTime, occupiedBookings],
  );

  useEffect(() => {
    let isMounted = true;

    const loadOccupiedBookings = async () => {
      if (!selectedResourceId) {
        setOccupiedBookings([]);
        return;
      }

      setLoadingOccupiedBookings(true);

      try {
        const response = await getAllBookings('APPROVED');
        if (!isMounted) {
          return;
        }

        const bookings = response.data?.content ?? response.data ?? [];
        setOccupiedBookings(Array.isArray(bookings)
          ? bookings.filter((booking) => Number(booking.resourceId) === Number(selectedResourceId))
          : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOccupiedBookings([]);
      } finally {
        if (isMounted) {
          setLoadingOccupiedBookings(false);
        }
      }
    };

    loadOccupiedBookings();

    return () => {
      isMounted = false;
    };
  }, [selectedResourceId]);

  const validate = () => {
    if (!form.resourceId || !form.purpose.trim() || !form.startDateTime || !form.endDateTime || !form.expectedAttendees) {
      return 'Please fill in all required fields.';
    }
    const start = new Date(form.startDateTime);
    const end   = new Date(form.endDateTime);
    if (end <= start) {
      return 'End date/time must be after start date/time.';
    }
    const diffMinutes = (end - start) / 60000;
    if (diffMinutes < 30) {
      return 'Booking duration must be at least 30 minutes.';
    }
    if (Number(form.expectedAttendees) < 1) {
      return 'Expected attendees must be at least 1.';
    }
    if (resourceStatus && resourceStatus !== 'ACTIVE') {
      return 'This resource is out of service and cannot be booked.';
    }
    if (bookingWindowError) {
      return bookingWindowError;
    }
    if (bookingOverlapError) {
      return bookingOverlapError;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await createBooking({
        resourceId:        Number(form.resourceId),
        startDateTime:     form.startDateTime,
        endDateTime:       form.endDateTime,
        purpose:           form.purpose.trim(),
        expectedAttendees: Number(form.expectedAttendees),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail  ||
        err?.message                 ||
        'Failed to submit booking. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.42)',
        backdropFilter: 'blur(12px) saturate(150%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 24px 64px rgba(39,34,105,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl font-black tracking-tight text-[#272269]">Create Booking Request</h2>
            <p className="mt-1 text-sm font-medium text-[#272269]/50">
              {selectedResourceId ? `Resource #${selectedResourceId}` : 'Select a resource below'}
            </p>
            {resourceStatus && resourceStatus !== 'ACTIVE' ? (
              <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                This resource is out of service and cannot be booked.
              </p>
            ) : null}
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#272269]/40">
              Availability: {formatAvailabilityWindows(availabilityWindows)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#272269]/40">
              {loadingOccupiedBookings ? 'Loading existing bookings...' : `Occupied slots: ${occupiedBookings.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#272269]/10 bg-[#F9FAFB] text-[#272269]/50 transition hover:bg-[#272269]/5 hover:text-[#272269]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            Booking request submitted! Closing…
          </div>
        )}

        {error && !success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span className="material-symbols-outlined mt-0.5 text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {occupiedBookings.length > 0 ? (
              <div className="rounded-2xl border border-[#272269]/10 bg-[#272269]/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#272269]/45">Already booked</p>
                    <p className="mt-1 text-xs font-medium text-[#272269]/60">Approved bookings currently occupying this resource.</p>
                  </div>
                  <span className="text-xs font-semibold text-[#272269]/55">
                    {occupiedBookings.length} slot{occupiedBookings.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {occupiedBookings.map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[#272269] shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">{formatBookingRange(booking.startDateTime, booking.endDateTime)}</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                          {booking.status}
                        </span>
                      </div>
                      {booking.purpose ? <p className="mt-1 text-xs text-[#272269]/60">{booking.purpose}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className={labelClass}>Resource ID</label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.resourceId}
                onChange={set('resourceId')}
                disabled={selectedResourceId != null}
                placeholder="Enter resource ID"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Purpose <span className="text-[#F57923]">*</span></label>
              <input
                type="text"
                className={inputClass}
                value={form.purpose}
                onChange={set('purpose')}
                placeholder="Enter booking purpose"
                maxLength={255}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Start Date &amp; Time <span className="text-[#F57923]">*</span></label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.startDateTime}
                  onChange={set('startDateTime')}
                  min={todayMin()}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>End Date &amp; Time <span className="text-[#F57923]">*</span></label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.endDateTime}
                  onChange={set('endDateTime')}
                  min={form.startDateTime || todayMin()}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Expected Attendees <span className="text-[#F57923]">*</span></label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.expectedAttendees}
                onChange={set('expectedAttendees')}
                placeholder="e.g. 10"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[#272269]/10 bg-[#F3F4F6] px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#E5E7EB] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || (resourceStatus && resourceStatus !== 'ACTIVE')}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#F57923' }}
                title={bookingWindowError || bookingOverlapError || ''}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-base" style={{ animation: 'spin 1s linear infinite' }}>
                      progress_activity
                    </span>
                    Submitting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                    Submit Booking Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
