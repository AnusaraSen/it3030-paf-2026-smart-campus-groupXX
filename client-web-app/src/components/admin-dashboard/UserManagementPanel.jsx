import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
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

const DEFAULT_REPORT_FORM = {
  dateFrom: '',
  dateTo: '',
  role: 'ALL',
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

function getDateKey(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatReportDate(value) {
  if (!value) {
    return 'All dates';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 'All dates';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatReportTableDate(value) {
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

function formatReportGeneratedAt(value) {
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildRoleSummary(users) {
  const roles = ['ADMIN', 'TECHNICIAN', 'USERS'];

  return roles.map((role) => ({
    role,
    count: users.filter((user) => user.role === role).length,
  }));
}

function createUserReportPdf({ generatedAt, filters, users }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  const titleColor = [39, 34, 105];
  const accentColor = [241, 118, 32];
  const borderColor = [227, 231, 244];
  const textColor = [31, 35, 53];
  const summaryCardWidth = (contentWidth - 24) / 3;
  const summaryCardHeight = 66;
  const filterCardWidth = (contentWidth - 24) / 3;
  const filterCardHeight = 54;
  const tableColumns = [
    { header: 'Name', width: 150 },
    { header: 'Email', width: 195 },
    { header: 'Role', width: 70 },
    { header: 'Joined', width: contentWidth - 150 - 195 - 70 },
  ];
  const lineHeight = 12;
  let cursorY = margin;

  const drawTextBlock = (lines, x, y, options = {}) => {
    const textLines = Array.isArray(lines) ? lines : String(lines).split('\n');
    textLines.forEach((line, index) => {
      doc.text(String(line), x, y + (index * lineHeight), options);
    });
  };

  const drawTableHeader = () => {
    const headerHeight = 26;
    doc.setFillColor(242, 244, 251);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, cursorY, contentWidth, headerHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...[77, 86, 121]);

    let columnX = margin;
    tableColumns.forEach((column) => {
      doc.text(column.header, columnX + 8, cursorY + 17);
      columnX += column.width;
    });

    cursorY += headerHeight;
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...titleColor);
    doc.text('Campus Access and Roles', margin, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...[93, 100, 132]);
    drawTextBlock(
      'Generated from the full backend user dataset, then filtered by the selected report criteria.',
      margin,
      cursorY + 18,
      { maxWidth: contentWidth * 0.58 },
    );

    const metaLines = [
      `Generated: ${formatReportGeneratedAt(generatedAt)}`,
      `Role filter: ${filters.role === 'ALL' ? 'All roles' : filters.role}`,
      `Date range: ${formatReportDate(filters.dateFrom)} - ${formatReportDate(filters.dateTo)}`,
      `Result count: ${users.length}`,
    ];

    doc.setFontSize(9);
    doc.setTextColor(...[93, 100, 132]);
    metaLines.forEach((line, index) => {
      doc.text(line, pageWidth - margin, cursorY + (index * 14), { align: 'right' });
    });

    cursorY += 72;
    doc.setDrawColor(...borderColor);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 18;
  };

  const drawSummaryCards = () => {
    const roleSummary = buildRoleSummary(users);
    roleSummary.forEach((item, index) => {
      const x = margin + (index * (summaryCardWidth + 12));
      doc.setFillColor(250, 251, 255);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(x, cursorY, summaryCardWidth, summaryCardHeight, 10, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...[107, 114, 140]);
      doc.text(item.role, x + 14, cursorY + 20);
      doc.setFontSize(22);
      doc.setTextColor(...titleColor);
      doc.text(String(item.count), x + 14, cursorY + 46);
    });

    cursorY += summaryCardHeight + 20;
  };

  const drawFilterCards = () => {
    const cards = [
      { label: 'Selected Role', value: filters.role === 'ALL' ? 'All Roles' : filters.role },
      { label: 'From', value: formatReportDate(filters.dateFrom) },
      { label: 'To', value: formatReportDate(filters.dateTo) },
    ];

    cards.forEach((card, index) => {
      const x = margin + (index * (filterCardWidth + 12));
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(x, cursorY, filterCardWidth, filterCardHeight, 10, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...[107, 114, 140]);
      doc.text(card.label, x + 14, cursorY + 19);
      doc.setFontSize(11);
      doc.setTextColor(...titleColor);
      doc.text(card.value, x + 14, cursorY + 38, { maxWidth: filterCardWidth - 28 });
    });

    cursorY += filterCardHeight + 22;
  };

  const drawTableRow = (row, isAlternateRow) => {
    const values = [
      `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unnamed User',
      row.email || 'Unknown',
      row.role || 'USERS',
      formatReportTableDate(row.createdAt),
    ];

    const wrappedCells = values.map((value, index) => doc.splitTextToSize(String(value), tableColumns[index].width - 16));
    const rowHeight = Math.max(...wrappedCells.map((lines) => lines.length)) * lineHeight + 12;

    if (cursorY + rowHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      drawPageHeader();
      drawSummaryCards();
      drawFilterCards();
      drawTableHeader();
    }

    doc.setFillColor(isAlternateRow ? 252 : 255, isAlternateRow ? 252 : 255, isAlternateRow ? 254 : 255);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, cursorY, contentWidth, rowHeight, 'FD');

    let columnX = margin;
    wrappedCells.forEach((lines, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const textY = cursorY + 16;
      lines.forEach((line, lineIndex) => {
        doc.text(String(line), columnX + 8, textY + (lineIndex * lineHeight));
      });
      columnX += tableColumns[index].width;
    });

    cursorY += rowHeight;
  };

  doc.setTextColor(...textColor);
  drawPageHeader();
  drawSummaryCards();
  drawFilterCards();
  drawTableHeader();

  if (users.length === 0) {
    if (cursorY + 40 > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      drawPageHeader();
      drawSummaryCards();
      drawFilterCards();
      drawTableHeader();
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, cursorY, contentWidth, 40, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...[93, 100, 132]);
    doc.text('No users matched the selected filters.', margin + 12, cursorY + 25);
  } else {
    users.forEach((user, index) => {
      drawTableRow(user, index % 2 === 1);
    });
  }

  const generatedFileName = `campus-access-roles-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(generatedFileName);
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
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [addForm, setAddForm] = useState(DEFAULT_ADD_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);
  const [reportForm, setReportForm] = useState(DEFAULT_REPORT_FORM);
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
  const [reportErrorMessage, setReportErrorMessage] = useState('');

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

  const openReportDialog = () => {
    setIsReportDialogOpen(true);
    setReportForm(DEFAULT_REPORT_FORM);
    setReportErrorMessage('');
  };

  const closeReportDialog = () => {
    setIsReportDialogOpen(false);
    setIsGeneratingReport(false);
    setReportErrorMessage('');
    setReportForm(DEFAULT_REPORT_FORM);
  };

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleGenerateReport = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setReportErrorMessage('Administrator access is required to generate this report.');
      return;
    }

    setIsGeneratingReport(true);
    setReportErrorMessage('');

    const reportFilters = { ...reportForm };

    try {
      const response = await fetchAllUsers(authSession?.accessToken || '');
      const allUsers = Array.isArray(response) ? response : [];

      const filteredUsers = allUsers.filter((user) => {
        const userDateKey = getDateKey(user.createdAt);
        const matchesRole = reportFilters.role === 'ALL' || user.role === reportFilters.role;
        const matchesFrom = !reportFilters.dateFrom || (userDateKey && userDateKey >= reportFilters.dateFrom);
        const matchesTo = !reportFilters.dateTo || (userDateKey && userDateKey <= reportFilters.dateTo);

        return matchesRole && matchesFrom && matchesTo;
      });

      createUserReportPdf({
        generatedAt: new Date().toISOString(),
        filters: reportFilters,
        users: filteredUsers,
      });
      closeReportDialog();
    } catch (error) {
      setReportErrorMessage(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
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

  const reportModal = isReportDialogOpen ? (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#272269]/18 px-4 py-6 backdrop-blur-3xl backdrop-saturate-150">
      <div className="relative z-[10000] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-[#272269]/15 bg-white/96 p-8 shadow-2xl shadow-[#272269]/22 ring-1 ring-[#272269]/5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#F17620]/20 bg-[#F17620]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F17620]">
              Report Generator
            </span>
            <h4 className="font-headline text-2xl font-black text-[#272269]">Campus access and roles report</h4>
            <p className="mt-2 text-sm text-[#272269]/70">
              The report queries the full backend user dataset, then applies your filters before generating a printable PDF.
            </p>
          </div>
          <button
            className="rounded-full border border-[#272269]/15 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
            type="button"
            onClick={closeReportDialog}
            disabled={isGeneratingReport}
          >
            Close
          </button>
        </div>

        {reportErrorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {reportErrorMessage}
          </div>
        ) : null}

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleGenerateReport}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">From Date</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="dateFrom"
              type="date"
              value={reportForm.dateFrom}
              onChange={handleReportChange}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">To Date</span>
            <input
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="dateTo"
              type="date"
              value={reportForm.dateTo}
              onChange={handleReportChange}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#272269]/40">Role Filter</span>
            <select
              className="w-full rounded-2xl border border-[#272269]/15 bg-white/95 px-4 py-3 text-sm text-[#272269] outline-none transition-colors focus:border-[#F17620]"
              name="role"
              value={reportForm.role}
              onChange={handleReportChange}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
              <option value="USERS">USERS</option>
            </select>
          </label>

          <div className="md:col-span-2 rounded-2xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-3 text-xs text-[#272269]/60">
            The report uses the complete user list from <span className="font-semibold text-[#272269]">/api/users/all</span> and then filters it by the selected date range and role.
          </div>

          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              className="rounded-full border border-[#272269]/15 bg-white/95 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#272269] transition-colors hover:bg-white"
              type="button"
              onClick={closeReportDialog}
              disabled={isGeneratingReport}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-[#F17620] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c85f10] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? 'Generating...' : 'Generate PDF'}
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
          <button className="uc-button uc-button--secondary uc-button--small" type="button" onClick={openReportDialog}>
            Generate Report
          </button>
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
      {typeof document !== 'undefined' ? createPortal(reportModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(editModal, document.body) : null}
      {typeof document !== 'undefined' ? createPortal(deleteModal, document.body) : null}
    </section>
  );
}