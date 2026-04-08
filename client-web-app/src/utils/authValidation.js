const CAMPUS_EMAIL_DOMAIN = '@campus.com';

export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

export function getCampusEmailError(value) {
  const email = value.trim();

  if (!email) {
    return 'Campus email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }

  if (!normalizeEmail(email).endsWith(CAMPUS_EMAIL_DOMAIN)) {
    return 'Use a @campus.com email address.';
  }

  return '';
}

export function getLoginPasswordError(value) {
  if (!value.trim()) {
    return 'Password is required.';
  }

  return '';
}

export function getPasswordStrengthChecks(value) {
  return [
    {
      key: 'length',
      label: 'At least 8 characters',
      passed: value.length >= 8,
    },
    {
      key: 'uppercase',
      label: 'At least one uppercase letter',
      passed: /[A-Z]/.test(value),
    },
    {
      key: 'number',
      label: 'At least one number',
      passed: /\d/.test(value),
    },
    {
      key: 'special',
      label: 'At least one special character',
      passed: /[^A-Za-z0-9]/.test(value),
    },
  ];
}

export function getPasswordStrengthError(value) {
  const failedChecks = getPasswordStrengthChecks(value).filter((check) => !check.passed);

  if (failedChecks.length === 0) {
    return '';
  }

  return 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.';
}

export function getConfirmPasswordError(password, confirmPassword) {
  if (!confirmPassword.trim()) {
    return 'Please confirm your password.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return '';
}