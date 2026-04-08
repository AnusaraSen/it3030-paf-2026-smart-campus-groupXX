import { useState } from 'react';
import { createBooking } from '../../api/bookingApi';

const todayMin = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
};

const inputClass =
  'w-full rounded-xl border border-[#272269]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#272269] shadow-sm outline-none transition focus:border-[#F57923]/60 focus:ring-2 focus:ring-[#F57923]/20 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#272269]/40';

const labelClass = 'mb-1 block text-[11px] font-bold uppercase tracking-widest text-[#272269]/50';

export default function BookingFormPage({ resourceId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    resourceId:        resourceId ?? '',
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

  return (
    // ── Overlay ──────────────────────────────────────────────────────────────
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* ── Card ─────────────────────────────────────────────────────────── */}
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
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl font-black tracking-tight text-[#272269]">
              Create Booking Request
            </h2>
            <p className="mt-1 text-sm font-medium text-[#272269]/50">
              {resourceId ? `Resource #${resourceId}` : 'Select a resource below'}
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

        {/* ── Success banner ───────────────────────────────────────────── */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            Booking request submitted! Closing…
          </div>
        )}

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && !success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span className="material-symbols-outlined mt-0.5 text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            {error}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Resource ID */}
            <div>
              <label className={labelClass}>Resource ID</label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.resourceId}
                onChange={set('resourceId')}
                disabled={resourceId != null}
                placeholder="Enter resource ID"
                required
              />
            </div>

            {/* Purpose */}
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

            {/* Start & End date/time — side by side */}
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

            {/* Expected attendees */}
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

            {/* ── Buttons ──────────────────────────────────────────────── */}
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
                disabled={loading}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#F57923' }}
              >
                {loading ? (
                  <>
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
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
}
