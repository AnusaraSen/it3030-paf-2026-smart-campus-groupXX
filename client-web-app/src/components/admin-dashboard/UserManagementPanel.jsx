import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteUserById, fetchAllUsers, getAuthSession, registerUser, updateUserById } from '../../api/authApi';
import {
  getCampusEmailError,
  getConfirmPasswordError,
  getPasswordStrengthChecks,
  getPasswordStrengthError,
  normalizeEmail,
} from '../../utils/authValidation';

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

function getRoleTone(role) {
  if (role === 'ADMIN') {
    return 'bg-[#F17620]/10 text-[#F17620]';
  }

  if (role === 'TECHNICIAN') {
    return 'bg-[#272269]/10 text-[#272269]';
  }

  return 'bg-emerald-100 text-emerald-700';
}

const DEFAULT_EDIT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'USERS',
  password: '',
};

const DEFAULT_ADD_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'USERS',
  password: '',
  confirmPassword: '',
};

function validateEditForm(form) {
  return {
    firstName: form.firstName.trim() ? '' : 'First name is required.',
    lastName: form.lastName.trim() ? '' : 'Last name is required.',
    email: getCampusEmailError(form.email),
    password: form.password.trim() ? getPasswordStrengthError(form.password) : '',
  };
}

function validateAddForm(form) {
  return {
    firstName: form.firstName.trim() ? '' : 'First name is required.',
    lastName: form.lastName.trim() ? '' : 'Last name is required.',
    email: getCampusEmailError(form.email),
    password: getPasswordStrengthError(form.password),
    confirmPassword: getConfirmPasswordError(form.password, form.confirmPassword),
  };
}

export default function UserManagementPanel({ onSessionExpired } = {}) {
  const authSession = getAuthSession();
  const currentUser = authSession?.user || null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [savingUserId, setSavingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [addForm, setAddForm] = useState(DEFAULT_ADD_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);
  const [addTouched, setAddTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [editTouched, setEditTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });

  const loadUsers = async () => {
    if (!isAdmin) {
      setUsers([]);
      setIsLoading(false);
      setErrorMessage('Administrator access is required to load the user list.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    let shouldResetLoading = true;

    try {
      const response = await fetchAllUsers(authSession?.accessToken || '');
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        shouldResetLoading = false;
        onSessionExpired?.();
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      if (shouldResetLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, [authSession?.accessToken, isAdmin]);

  useEffect(() => {
    if (!editingUser && !deleteConfirmUser && !isAddDialogOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingUser, deleteConfirmUser, isAddDialogOpen]);

  const userCountLabel = useMemo(() => {
    if (isLoading) {
      return 'Loading users...';
    }

    return `${users.length} user${users.length === 1 ? '' : 's'} loaded`;
  }, [isLoading, users.length]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch = !normalizedSearch
        || [user.firstName, user.lastName, user.email, user.role]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedSearch));

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm, users]);

  const filteredCountLabel = useMemo(() => {
    if (isLoading) {
      return 'Filtering users...';
    }

    if (filteredUsers.length === users.length) {
      return `${filteredUsers.length} result${filteredUsers.length === 1 ? '' : 's'}`;
    }

    return `${filteredUsers.length} of ${users.length} result${filteredUsers.length === 1 ? '' : 's'}`;
  }, [filteredUsers.length, isLoading, users.length]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (nextRole) => {
    setRoleFilter(nextRole);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'USERS',
      password: '',
    });
    setEditTouched({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
    });
    setErrorMessage('');
    setActionMessage('');
  };

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
    setAddForm(DEFAULT_ADD_FORM);
    setAddTouched({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmPassword: false,
    });
    setErrorMessage('');
    setActionMessage('');
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEditForm(DEFAULT_EDIT_FORM);
    setEditTouched({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
    });
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setAddForm(DEFAULT_ADD_FORM);
    setAddTouched({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmPassword: false,
    });
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (Object.prototype.hasOwnProperty.call(addTouched, name)) {
      setAddTouched((currentTouched) => ({
        ...currentTouched,
        [name]: true,
      }));
    }
  };

  const handleAddBlur = (event) => {
    const { name } = event.target;

    if (Object.prototype.hasOwnProperty.call(addTouched, name)) {
      setAddTouched((currentTouched) => ({
        ...currentTouched,
        [name]: true,
      }));
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (Object.prototype.hasOwnProperty.call(editTouched, name)) {
      setEditTouched((currentTouched) => ({
        ...currentTouched,
        [name]: true,
      }));
    }
  };

  const handleEditBlur = (event) => {
    const { name } = event.target;

    if (Object.prototype.hasOwnProperty.call(editTouched, name)) {
      setEditTouched((currentTouched) => ({
        ...currentTouched,
        [name]: true,
      }));
    }
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateAddForm(addForm);
    setAddTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.values(validationErrors).some(Boolean)) {
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    setIsCreatingUser(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      await registerUser({
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: normalizeEmail(addForm.email),
        password: addForm.password,
        role: addForm.role,
      });
      await loadUsers();
      setActionMessage('User created successfully.');
      closeAddDialog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    const validationErrors = validateEditForm(editForm);
    setEditTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    });

    if (Object.values(validationErrors).some(Boolean)) {
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    setSavingUserId(editingUser.id);
    setErrorMessage('');
    setActionMessage('');

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      email: normalizeEmail(editForm.email),
      role: editForm.role,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    try {
      await updateUserById(editingUser.id, payload, authSession?.accessToken || '');
      await loadUsers();
      setActionMessage('User updated successfully.');
      closeEditDialog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSavingUserId(null);
    }
  };

  const editValidationErrors = editingUser ? validateEditForm(editForm) : null;
  const addValidationErrors = isAddDialogOpen ? validateAddForm(addForm) : null;

  const openDeleteConfirm = (user) => {
    setDeleteConfirmUser(user);
    setErrorMessage('');
    setActionMessage('');
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) {
      return;
    }

    const user = deleteConfirmUser;
    setDeletingUserId(user.id);
    setErrorMessage('');
    setActionMessage('');

    try {
      await deleteUserById(user.id, authSession?.accessToken || '');
      await loadUsers();
      setActionMessage('User deleted successfully.');
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const editModal = editingUser ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Edit User
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Update user details</h4>
            <p className="mt-2 text-sm text-[#272269]/70">Change names, email, role, or set a new password.</p>
          </div>
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeEditDialog}
            disabled={savingUserId === editingUser.id}
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">First Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="firstName"
              value={editForm.firstName}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              required
              aria-invalid={Boolean(editTouched.firstName && editValidationErrors?.firstName)}
              aria-describedby="edit-first-name-error"
            />
          </label>
          {editTouched.firstName && editValidationErrors?.firstName ? (
            <p id="edit-first-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.firstName}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Last Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="lastName"
              value={editForm.lastName}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              required
              aria-invalid={Boolean(editTouched.lastName && editValidationErrors?.lastName)}
              aria-describedby="edit-last-name-error"
            />
          </label>
          {editTouched.lastName && editValidationErrors?.lastName ? (
            <p id="edit-last-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.lastName}
            </p>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Email</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="email"
              type="email"
              value={editForm.email}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              required
              aria-invalid={Boolean(editTouched.email && editValidationErrors?.email)}
              aria-describedby="edit-email-help edit-email-error"
            />
          </label>
          <p id="edit-email-help" className="-mt-2 text-xs text-[#272269]/40 md:col-span-2">
            Use a @campus.com email address.
          </p>
          {editTouched.email && editValidationErrors?.email ? (
            <p id="edit-email-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.email}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Role</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="role"
              value={editForm.role}
              onChange={handleEditChange}
            >
              <option value="USERS">USERS</option>
              <option value="ADMIN">ADMIN</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">New Password</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="password"
              type="password"
              value={editForm.password}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              placeholder="Leave blank to keep current password"
              aria-invalid={Boolean(editTouched.password && editValidationErrors?.password)}
              aria-describedby="edit-password-help edit-password-error"
            />
          </label>
          <div id="edit-password-help" className="space-y-2 md:col-span-2">
            <p className="text-xs text-[#272269]/40">Password requirements for changes:</p>
            <ul className="space-y-1">
              {getPasswordStrengthChecks(editForm.password).map((check) => (
                <li key={check.key} className={`flex items-center gap-2 text-xs ${check.passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">{check.passed ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
          {editTouched.password && editValidationErrors?.password ? (
            <p id="edit-password-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {editValidationErrors.password}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
              type="button"
              onClick={closeEditDialog}
              disabled={savingUserId === editingUser.id}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-[#F17620] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c85f10] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={savingUserId === editingUser.id}
            >
              {savingUserId === editingUser.id ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const deleteModal = deleteConfirmUser ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-lg rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700">
              Delete User
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Confirm deletion</h4>
            <p className="mt-2 text-sm text-[#272269]/70">
              Delete {deleteConfirmUser.firstName} {deleteConfirmUser.lastName}? This action cannot be undone.
            </p>
          </div>
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeDeleteConfirm}
            disabled={deletingUserId === deleteConfirmUser.id}
          >
            Close
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          The user will be removed from the system immediately.
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeDeleteConfirm}
            disabled={deletingUserId === deleteConfirmUser.id}
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-rose-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleDeleteUser}
            disabled={deletingUserId === deleteConfirmUser.id}
          >
            {deletingUserId === deleteConfirmUser.id ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const addModal = isAddDialogOpen ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Add User
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Create a new campus account</h4>
            <p className="mt-2 text-sm text-[#272269]/70">Use the same registration rules and campus email requirements.</p>
          </div>
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeAddDialog}
              disabled={isCreatingUser}
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">First Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="firstName"
              value={addForm.firstName}
              onChange={handleAddChange}
              onBlur={handleAddBlur}
              required
              aria-invalid={Boolean(addTouched.firstName && addValidationErrors?.firstName)}
              aria-describedby="add-first-name-error"
            />
          </label>
          {addTouched.firstName && addValidationErrors?.firstName ? (
            <p id="add-first-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.firstName}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Last Name</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="lastName"
              value={addForm.lastName}
              onChange={handleAddChange}
              onBlur={handleAddBlur}
              required
              aria-invalid={Boolean(addTouched.lastName && addValidationErrors?.lastName)}
              aria-describedby="add-last-name-error"
            />
          </label>
          {addTouched.lastName && addValidationErrors?.lastName ? (
            <p id="add-last-name-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.lastName}
            </p>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Campus Email</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="email"
              type="email"
              value={addForm.email}
              onChange={handleAddChange}
              onBlur={handleAddBlur}
              required
              aria-invalid={Boolean(addTouched.email && addValidationErrors?.email)}
              aria-describedby="add-email-help add-email-error"
            />
          </label>
          <p id="add-email-help" className="-mt-2 text-xs text-[#272269]/40 md:col-span-2">
            Use a @campus.com email address.
          </p>
          {addTouched.email && addValidationErrors?.email ? (
            <p id="add-email-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.email}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Role</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="role"
              value={addForm.role}
              onChange={handleAddChange}
            >
              <option value="USERS">USERS</option>
              <option value="ADMIN">ADMIN</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Password</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="password"
              type="password"
              value={addForm.password}
              onChange={handleAddChange}
              onBlur={handleAddBlur}
              required
              aria-invalid={Boolean(addTouched.password && addValidationErrors?.password)}
              aria-describedby="add-password-help add-password-error"
            />
          </label>
          <div id="add-password-help" className="space-y-2 md:col-span-2">
            <p className="text-xs text-[#272269]/40">Password requirements:</p>
            <ul className="space-y-1">
              {getPasswordStrengthChecks(addForm.password).map((check) => (
                <li key={check.key} className={`flex items-center gap-2 text-xs ${check.passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">{check.passed ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
          {addTouched.password && addValidationErrors?.password ? (
            <p id="add-password-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.password}
            </p>
          ) : null}

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Confirm Password</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="confirmPassword"
              type="password"
              value={addForm.confirmPassword}
              onChange={handleAddChange}
              onBlur={handleAddBlur}
              required
              aria-invalid={Boolean(addTouched.confirmPassword && addValidationErrors?.confirmPassword)}
              aria-describedby="add-confirm-password-error"
            />
          </label>
          {addTouched.confirmPassword && addValidationErrors?.confirmPassword ? (
            <p id="add-confirm-password-error" className="-mt-2 text-xs text-red-600 md:col-span-2">
              {addValidationErrors.confirmPassword}
            </p>
          ) : null}

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
              disabled={isCreatingUser}
            >
              {isCreatingUser ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <section className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm" id="user-management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
            User Management
          </span>
          <h4 className="font-headline text-2xl font-black text-[#272269]">Manage campus access and roles</h4>
          <p className="mt-2 max-w-2xl text-sm text-[#272269]/70">
            Review live user accounts, monitor account details, and keep administrative roles aligned with campus operations.
          </p>
        </div>

        <div className="flex items-start gap-3 self-start md:items-center md:self-auto">
          <span className="rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/50">{userCountLabel}</span>
          <button className="uc-button uc-button--primary uc-button--small" type="button" onClick={openAddDialog}>
            Add User
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-white/50 bg-white/45 p-4 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#272269]/40">
              search
            </span>
            <input
              className="w-full rounded-2xl border-none bg-[#272269]/5 py-3 pl-11 pr-4 text-sm font-body text-[#272269] placeholder:text-[#272269]/30 focus:ring-2 focus:ring-[#F17620]"
              placeholder="Search by name, email, or role..."
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'ALL', label: 'All Users' },
              { key: 'ADMIN', label: 'Admins' },
              { key: 'USERS', label: 'Users' },
              { key: 'TECHNICIAN', label: 'Technicians' },
            ].map((option) => {
              const isActive = roleFilter === option.key;

              return (
                <button
                  key={option.key}
                  className={[
                    'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
                    isActive
                      ? 'border-[#F17620]/30 bg-[#F17620]/10 text-[#F17620]'
                      : 'border-[#272269]/10 bg-white/70 text-[#272269]/60 hover:bg-white hover:text-[#272269]',
                  ].join(' ')}
                  type="button"
                  onClick={() => handleRoleFilterChange(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/60 pt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#272269]/40">
          <span>{filteredCountLabel}</span>
          <button
            className="rounded-full border border-[#272269]/10 bg-white/80 px-3 py-2 text-[10px] text-[#272269]/60 transition-colors hover:bg-white hover:text-[#272269]"
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('ALL');
            }}
          >
            Reset Filters
          </button>
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
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-[#272269]/60" colSpan={5}>
                  Loading users from the server...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-[#272269]/60" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-[#272269]/60" colSpan={5}>
                  No users match the current search or filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-white/60 transition-colors hover:bg-[#272269]/5">
                  <td className="px-6 py-4 font-medium text-[#272269]">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 text-[#272269]/70">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={['rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest', getRoleTone(user.role)].join(' ')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#272269]/70">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-full border border-[#272269]/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-[#272269]/5 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => openEditDialog(user)}
                        disabled={savingUserId === user.id || deletingUserId === user.id}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => openDeleteConfirm(user)}
                        disabled={savingUserId === user.id || deletingUserId === user.id}
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
      {typeof document !== 'undefined' ? createPortal(editModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(deleteModal, document.body) : null}
    </section>
  );
}