import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createResource, deleteResource, searchResources, updateResource } from '../../api/resourcesApi';

const DEFAULT_RESOURCE_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  status: 'ACTIVE',
};

const RESOURCE_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'EQUIPMENT', label: 'Equipment' },
];

const RESOURCE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const DAY_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

const createAvailabilityEntry = (entry = {}) => ({
  dayOfWeek: entry.dayOfWeek || 'MONDAY',
  startTime: entry.startTime || '',
  endTime: entry.endTime || '',
});

const createAvailabilityTouched = () => ({
  dayOfWeek: false,
  startTime: false,
  endTime: false,
});

const DEFAULT_AVAILABILITY_ENTRIES = [createAvailabilityEntry()];

const DEFAULT_AVAILABILITY_TOUCHED = [createAvailabilityTouched()];

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getStatusTone(status) {
  if (status === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function formatAvailabilityWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return '—';
  }

  return windows
    .map((window) => `${String(window.dayOfWeek || '').slice(0, 3)} ${window.startTime || ''}-${window.endTime || ''}`.trim())
    .join(', ');
}

function isEndAfterStart(startTime, endTime) {
  if (!startTime || !endTime) {
    return false;
  }

  return endTime > startTime;
}

function validateForm(form) {
  return {
    name: form.name.trim() ? '' : 'Resource name is required.',
    type: form.type ? '' : 'Resource type is required.',
    capacity: Number.isInteger(Number(form.capacity)) && Number(form.capacity) > 0 ? '' : 'Capacity must be a positive number.',
    location: form.location.trim() ? '' : 'Location is required.',
    status: form.status ? '' : 'Resource status is required.',
  };
}

function validateAvailabilityEntry(entry) {
  const hasStartTime = Boolean(entry.startTime);
  const hasEndTime = Boolean(entry.endTime);

  return {
    dayOfWeek: entry.dayOfWeek ? '' : 'Day of the week is required.',
    startTime: hasStartTime ? '' : 'Start time is required.',
    endTime: hasEndTime ? '' : 'End time is required.',
    range: hasStartTime && hasEndTime && !isEndAfterStart(entry.startTime, entry.endTime)
      ? 'End time must be after start time.'
      : '',
  };
}

function validateAvailabilityEntries(entries) {
  return entries.map((entry) => validateAvailabilityEntry(entry));
}

export default function ResourceManagementPanel({ onSessionExpired } = {}) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [availabilityResource, setAvailabilityResource] = useState(null);
  const [addForm, setAddForm] = useState(DEFAULT_RESOURCE_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_RESOURCE_FORM);
  const [availabilityEntries, setAvailabilityEntries] = useState(DEFAULT_AVAILABILITY_ENTRIES);
  const [addTouched, setAddTouched] = useState({
    name: false,
    type: false,
    capacity: false,
    location: false,
    status: false,
  });
  const [availabilityTouched, setAvailabilityTouched] = useState(DEFAULT_AVAILABILITY_TOUCHED);
  const [editTouched, setEditTouched] = useState({
    name: false,
    type: false,
    capacity: false,
    location: false,
    status: false,
  });

  const loadResources = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await searchResources({});
      setResources(Array.isArray(response) ? response : []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setResources([]);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (!isAddDialogOpen && !editingResource && !resourceToDelete && !availabilityResource) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [availabilityResource, editingResource, isAddDialogOpen, resourceToDelete]);

  const resourceTotals = useMemo(() => {
    const total = resources.length;
    const active = resources.filter((resource) => resource.status === 'ACTIVE').length;
    const offline = resources.filter((resource) => resource.status === 'OUT_OF_SERVICE').length;
    const averageCapacity = total === 0 ? 0 : Math.round(resources.reduce((sum, resource) => sum + (resource.capacity || 0), 0) / total);

    return { total, active, offline, averageCapacity };
  }, [resources]);

  const addValidationErrors = useMemo(() => validateForm(addForm), [addForm]);
  const availabilityValidationErrors = useMemo(() => validateAvailabilityEntries(availabilityEntries), [availabilityEntries]);
  const editValidationErrors = useMemo(() => validateForm(editForm), [editForm]);

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddForm((currentForm) => ({ ...currentForm, [name]: value }));
    setAddTouched((currentTouched) => ({ ...currentTouched, [name]: true }));
  };

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
    setEditingResource(null);
    setResourceToDelete(null);
    setAddForm(DEFAULT_RESOURCE_FORM);
    setAddTouched({
      name: false,
      type: false,
      capacity: false,
      location: false,
      status: false,
    });
    setErrorMessage('');
    setActionMessage('');
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setAddForm(DEFAULT_RESOURCE_FORM);
    setAddTouched({
      name: false,
      type: false,
      capacity: false,
      location: false,
      status: false,
    });
  };

  const openEditDialog = (resource) => {
    setIsAddDialogOpen(false);
    setResourceToDelete(null);
    setAvailabilityResource(null);
    setEditingResource(resource);
    setEditForm({
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity?.toString() || '',
      location: resource.location || '',
      status: resource.status || 'ACTIVE',
    });
    setEditTouched({
      name: false,
      type: false,
      capacity: false,
      location: false,
      status: false,
    });
    setErrorMessage('');
    setActionMessage('');
  };

  const closeEditDialog = () => {
    setEditingResource(null);
    setEditForm(DEFAULT_RESOURCE_FORM);
    setEditTouched({
      name: false,
      type: false,
      capacity: false,
      location: false,
      status: false,
    });
  };

  const openDeleteConfirm = (resource) => {
    setIsAddDialogOpen(false);
    setEditingResource(null);
    setAvailabilityResource(null);
    setResourceToDelete(resource);
    setErrorMessage('');
    setActionMessage('');
  };

  const closeDeleteConfirm = () => {
    setResourceToDelete(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({ ...currentForm, [name]: value }));
    setEditTouched((currentTouched) => ({ ...currentTouched, [name]: true }));
  };

  const handleAvailabilityChange = (index, field) => (event) => {
    const { value } = event.target;

    setAvailabilityEntries((currentEntries) => currentEntries.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )));

    setAvailabilityTouched((currentTouched) => currentTouched.map((entryTouched, entryIndex) => (
      entryIndex === index ? { ...entryTouched, [field]: true } : entryTouched
    )));
  };

  const addAvailabilityEntry = () => {
    setAvailabilityEntries((currentEntries) => [...currentEntries, createAvailabilityEntry()]);
    setAvailabilityTouched((currentTouched) => [...currentTouched, createAvailabilityTouched()]);
  };

  const removeAvailabilityEntry = (index) => {
    setAvailabilityEntries((currentEntries) => (
      currentEntries.length <= 1
        ? currentEntries
        : currentEntries.filter((_, entryIndex) => entryIndex !== index)
    ));

    setAvailabilityTouched((currentTouched) => (
      currentTouched.length <= 1
        ? currentTouched
        : currentTouched.filter((_, entryIndex) => entryIndex !== index)
    ));
  };

  const openAvailabilityDialog = (resource) => {
    setIsAddDialogOpen(false);
    setEditingResource(null);
    setResourceToDelete(null);
    setAvailabilityResource(resource);

    const existingEntries = Array.isArray(resource.availabilityWindows) && resource.availabilityWindows.length > 0
      ? resource.availabilityWindows.map((window) => createAvailabilityEntry(window))
      : DEFAULT_AVAILABILITY_ENTRIES;

    setAvailabilityEntries(existingEntries);
    setAvailabilityTouched(existingEntries.map(() => createAvailabilityTouched()));
    setErrorMessage('');
    setActionMessage('');
  };

  const closeAvailabilityDialog = () => {
    setAvailabilityResource(null);
    setAvailabilityEntries(DEFAULT_AVAILABILITY_ENTRIES);
    setAvailabilityTouched(DEFAULT_AVAILABILITY_TOUCHED);
  };

  const submitResourcePayload = (form, availabilityWindows) => ({
    name: form.name.trim(),
    type: form.type,
    capacity: Number(form.capacity),
    location: form.location.trim(),
    status: form.status,
    availabilityWindows,
  });

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault();

    if (!availabilityResource) {
      return;
    }

    setAvailabilityTouched(availabilityEntries.map(() => ({
      dayOfWeek: true,
      startTime: true,
      endTime: true,
    })));

    if (availabilityValidationErrors.some((entryErrors) => Object.values(entryErrors).some(Boolean))) {
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      await updateResource(
        availabilityResource.id,
        submitResourcePayload(availabilityResource, availabilityEntries.map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }))),
      );

      await loadResources();
      setActionMessage('Resource availability updated successfully.');
      closeAvailabilityDialog();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to update availability.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setAddTouched({
      name: true,
      type: true,
      capacity: true,
      location: true,
      status: true,
    });

    if (Object.values(addValidationErrors).some(Boolean)) {
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    setIsCreating(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      await createResource(submitResourcePayload(addForm, []));

      await loadResources();
      setActionMessage('Resource created successfully.');
      closeAddDialog();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to create resource.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingResource) {
      return;
    }

    setEditTouched({
      name: true,
      type: true,
      capacity: true,
      location: true,
      status: true,
    });

    if (Object.values(editValidationErrors).some(Boolean)) {
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      await updateResource(
        editingResource.id,
        submitResourcePayload(
          editForm,
          Array.isArray(editingResource.availabilityWindows) ? editingResource.availabilityWindows : [],
        ),
      );

      await loadResources();
      setActionMessage('Resource updated successfully.');
      closeEditDialog();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to update resource.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) {
      return;
    }

    setDeletingResourceId(resourceToDelete.id);
    setErrorMessage('');
    setActionMessage('');

    try {
      await deleteResource(resourceToDelete.id);
      await loadResources();
      setActionMessage('Resource deleted successfully.');
      closeDeleteConfirm();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        onSessionExpired?.();
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete resource.');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const addModal = isAddDialogOpen ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Add Resource
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Create a new campus resource</h4>
            <p className="mt-2 text-sm text-[#272269]/70">Add the resource details in the same style as user creation.</p>
          </div>

          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeAddDialog}
            disabled={isCreating}
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Resource Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="name"
              value={addForm.name}
              onChange={handleAddChange}
              onBlur={handleAddChange}
              required
              aria-invalid={Boolean(addTouched.name && addValidationErrors.name)}
              aria-describedby="resource-name-error"
              placeholder="e.g., Lecture Hall A1"
            />
          </label>
          {addTouched.name && addValidationErrors.name ? (
            <p id="resource-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.name}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Type</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="type"
              value={addForm.type}
              onChange={handleAddChange}
            >
              {RESOURCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Capacity</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="capacity"
              type="number"
              min="1"
              value={addForm.capacity}
              onChange={handleAddChange}
              onBlur={handleAddChange}
              required
              aria-invalid={Boolean(addTouched.capacity && addValidationErrors.capacity)}
              aria-describedby="resource-capacity-error"
              placeholder="e.g., 40"
            />
          </label>
          {addTouched.capacity && addValidationErrors.capacity ? (
            <p id="resource-capacity-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.capacity}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Location</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="location"
              value={addForm.location}
              onChange={handleAddChange}
              onBlur={handleAddChange}
              required
              aria-invalid={Boolean(addTouched.location && addValidationErrors.location)}
              aria-describedby="resource-location-error"
              placeholder="e.g., Building C, Floor 2"
            />
          </label>
          {addTouched.location && addValidationErrors.location ? (
            <p id="resource-location-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.location}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Status</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="status"
              value={addForm.status}
              onChange={handleAddChange}
            >
              {RESOURCE_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
              type="button"
              onClick={closeAddDialog}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-[#F17620] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c85f10] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const editModal = editingResource ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Edit Resource
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Update resource details</h4>
            <p className="mt-2 text-sm text-[#272269]/70">
              Edit the resource record while keeping the existing availability schedule intact.
            </p>
          </div>

          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeEditDialog}
            disabled={isUpdating}
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Resource Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              onBlur={handleEditChange}
              required
              aria-invalid={Boolean(editTouched.name && editValidationErrors.name)}
              aria-describedby="resource-edit-name-error"
              placeholder="e.g., Lecture Hall A1"
            />
          </label>
          {editTouched.name && editValidationErrors.name ? (
            <p id="resource-edit-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.name}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Type</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="type"
              value={editForm.type}
              onChange={handleEditChange}
            >
              {RESOURCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Capacity</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="capacity"
              type="number"
              min="1"
              value={editForm.capacity}
              onChange={handleEditChange}
              onBlur={handleEditChange}
              required
              aria-invalid={Boolean(editTouched.capacity && editValidationErrors.capacity)}
              aria-describedby="resource-edit-capacity-error"
              placeholder="e.g., 40"
            />
          </label>
          {editTouched.capacity && editValidationErrors.capacity ? (
            <p id="resource-edit-capacity-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.capacity}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Location</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="location"
              value={editForm.location}
              onChange={handleEditChange}
              onBlur={handleEditChange}
              required
              aria-invalid={Boolean(editTouched.location && editValidationErrors.location)}
              aria-describedby="resource-edit-location-error"
              placeholder="e.g., Building C, Floor 2"
            />
          </label>
          {editTouched.location && editValidationErrors.location ? (
            <p id="resource-edit-location-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.location}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Status</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="status"
              value={editForm.status}
              onChange={handleEditChange}
            >
              {RESOURCE_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
              type="button"
              onClick={closeEditDialog}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-[#F17620] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c85f10] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const availabilityModal = availabilityResource ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Availability
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Set resource availability</h4>
            <p className="mt-2 text-sm text-[#272269]/70">
              Update the day of the week and time window for {availabilityResource.name}.
            </p>
          </div>

          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeAvailabilityDialog}
            disabled={isUpdating}
          >
            Close
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-3 text-sm text-[#272269]/70">
          Current availability: {formatAvailabilityWindows(availabilityResource.availabilityWindows)}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAvailabilitySubmit}>
          <div className="space-y-4 md:col-span-2">
            {availabilityEntries.map((entry, index) => {
              const entryErrors = availabilityValidationErrors[index] || {};
              const entryTouched = availabilityTouched[index] || createAvailabilityTouched();

              return (
                <div key={`${index}-${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}`} className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Availability Slot {index + 1}</p>
                      <p className="text-xs text-[#272269]/55">Choose one recurring day and time range.</p>
                    </div>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={() => removeAvailabilityEntry(index)}
                      disabled={availabilityEntries.length === 1 || isUpdating}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2 md:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Day of the Week</span>
                      <select
                        className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
                        name="dayOfWeek"
                        value={entry.dayOfWeek}
                        onChange={handleAvailabilityChange(index, 'dayOfWeek')}
                        onBlur={handleAvailabilityChange(index, 'dayOfWeek')}
                        required
                        aria-invalid={Boolean(entryTouched.dayOfWeek && entryErrors.dayOfWeek)}
                        aria-describedby={`resource-availability-day-error-${index}`}
                      >
                        {DAY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 md:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Start Time</span>
                      <input
                        className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
                        name="startTime"
                        type="time"
                        value={entry.startTime}
                        onChange={handleAvailabilityChange(index, 'startTime')}
                        onBlur={handleAvailabilityChange(index, 'startTime')}
                        required
                        aria-invalid={Boolean(entryTouched.startTime && entryErrors.startTime)}
                        aria-describedby={`resource-availability-start-error-${index}`}
                      />
                    </label>

                    <label className="space-y-2 md:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">End Time</span>
                      <input
                        className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
                        name="endTime"
                        type="time"
                        value={entry.endTime}
                        onChange={handleAvailabilityChange(index, 'endTime')}
                        onBlur={handleAvailabilityChange(index, 'endTime')}
                        required
                        aria-invalid={Boolean(entryTouched.endTime && entryErrors.endTime)}
                        aria-describedby={`resource-availability-end-error-${index} resource-availability-range-error-${index}`}
                      />
                    </label>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {entryTouched.dayOfWeek && entryErrors.dayOfWeek ? (
                      <p id={`resource-availability-day-error-${index}`} className="text-xs text-red-600 md:col-span-1">
                        {entryErrors.dayOfWeek}
                      </p>
                    ) : null}
                    {entryTouched.startTime && entryErrors.startTime ? (
                      <p id={`resource-availability-start-error-${index}`} className="text-xs text-red-600 md:col-span-1">
                        {entryErrors.startTime}
                      </p>
                    ) : null}
                    {entryTouched.endTime && entryErrors.endTime ? (
                      <p id={`resource-availability-end-error-${index}`} className="text-xs text-red-600 md:col-span-1">
                        {entryErrors.endTime}
                      </p>
                    ) : null}
                    {entryTouched.startTime && entryTouched.endTime && entryErrors.range ? (
                      <p id={`resource-availability-range-error-${index}`} className="text-xs text-red-600 md:col-span-3">
                        {entryErrors.range}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <button
              className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
              type="button"
              onClick={addAvailabilityEntry}
              disabled={isUpdating}
            >
              Add Another Slot
            </button>

            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
                type="button"
                onClick={closeAvailabilityDialog}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-[#F17620] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c85f10] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const deleteModal = resourceToDelete ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-lg rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700">
              Delete Resource
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Confirm deletion</h4>
            <p className="mt-2 text-sm text-[#272269]/70">
              Delete {resourceToDelete.name} from {resourceToDelete.location}? This action cannot be undone.
            </p>
          </div>
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeDeleteConfirm}
            disabled={deletingResourceId === resourceToDelete.id}
          >
            Close
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          The resource will be removed from the system immediately.
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeDeleteConfirm}
            disabled={deletingResourceId === resourceToDelete.id}
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-rose-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleDeleteResource}
            disabled={deletingResourceId === resourceToDelete.id}
          >
            {deletingResourceId === resourceToDelete.id ? 'Deleting...' : 'Delete Resource'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm" id="resource-management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
            Resource Management
          </span>
          <h4 className="font-headline text-2xl font-black text-[#272269]">Manage campus resources</h4>
          <p className="mt-2 max-w-2xl text-sm text-[#272269]/70">
            Review live resource records, monitor current status, and create new resources without leaving the table view.
          </p>
        </div>

        <div className="flex items-start gap-3 self-start md:items-center md:self-auto">
          <span className="rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/50">
            {isLoading ? 'Loading...' : `${resources.length} item${resources.length === 1 ? '' : 's'}`}
          </span>
          <button
            className="uc-button uc-button--secondary uc-button--small"
            type="button"
            onClick={loadResources}
            disabled={isLoading || isCreating || isUpdating || deletingResourceId !== null}
          >
            Refresh
          </button>
          <button className="uc-button uc-button--primary uc-button--small" type="button" onClick={openAddDialog}>
            Add Resource
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/50 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Active</p>
          <p className="mt-2 font-headline text-3xl font-black text-emerald-600">{resourceTotals.active}</p>
        </div>
        <div className="rounded-3xl border border-white/50 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Out of Service</p>
          <p className="mt-2 font-headline text-3xl font-black text-rose-600">{resourceTotals.offline}</p>
        </div>
        <div className="rounded-3xl border border-white/50 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Average Capacity</p>
          <p className="mt-2 font-headline text-3xl font-black text-[#F17620]">{resourceTotals.averageCapacity}</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white/60">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-[#272269]/60" colSpan={7}>
                  Loading resources from the server...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-[#272269]/60" colSpan={7}>
                  No resources found.
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr key={resource.id} className="border-t border-white/60 transition-colors hover:bg-[#272269]/5">
                  <td className="px-6 py-4 font-medium text-[#272269]">{resource.name}</td>
                  <td className="px-6 py-4 text-[#272269]/70">{resource.type}</td>
                  <td className="px-6 py-4 text-[#272269]/70">{resource.capacity}</td>
                  <td className="px-6 py-4 text-[#272269]/70">{resource.location}</td>
                  <td className="px-6 py-4">
                    <span className={['rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest', getStatusTone(resource.status)].join(' ')}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#272269]/70">{formatDate(resource.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-full border border-[#272269]/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-[#272269]/5 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => openAvailabilityDialog(resource)}
                        disabled={isCreating || isUpdating || deletingResourceId === resource.id}
                      >
                        Availability
                      </button>
                      <button
                        className="rounded-full border border-[#272269]/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-[#272269]/5 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => openEditDialog(resource)}
                        disabled={isCreating || isUpdating || deletingResourceId === resource.id}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => openDeleteConfirm(resource)}
                        disabled={isCreating || isUpdating || deletingResourceId === resource.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {typeof document !== 'undefined' ? createPortal(addModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(availabilityModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(editModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(deleteModal, document.body) : null}
    </section>
  );
}