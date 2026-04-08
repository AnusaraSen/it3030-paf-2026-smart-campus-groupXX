import React, { useState } from 'react';
import { registerUser } from '../../api/authApi';
import {
  getCampusEmailError,
  getConfirmPasswordError,
  getPasswordStrengthChecks,
  getPasswordStrengthError,
  normalizeEmail,
} from '../../utils/authValidation';

export default function SignupView({ onBack, onSwitchToLogin }) {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: true,
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));
  };

  const firstNameError = formValues.firstName.trim() ? '' : 'First name is required.';
  const lastNameError = formValues.lastName.trim() ? '' : 'Last name is required.';
  const emailError = getCampusEmailError(formValues.email);
  const passwordError = getPasswordStrengthError(formValues.password);
  const confirmPasswordError = getConfirmPasswordError(formValues.password, formValues.confirmPassword);
  const termsError = formValues.terms ? '' : 'You must accept the Terms of Service.';
  const showError = (fieldName, fieldError) => touched[fieldName] || status === 'error' ? fieldError : '';
  const hasClientValidationErrors = Boolean(firstNameError || lastNameError || emailError || passwordError || confirmPasswordError || termsError);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    setStatus('submitting');
    setErrorMessage('');
    setSuccessMessage('');

    if (hasClientValidationErrors) {
      setStatus('error');
      setErrorMessage('Please fix the highlighted fields.');
      return;
    }

    try {
      await registerUser({
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: normalizeEmail(formValues.email),
        password: formValues.password,
      });

      setStatus('success');
      setSuccessMessage('Account created successfully. You can now log in.');
      setFormValues({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: true,
      });
      onSwitchToLogin?.();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account.');
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#F0F4F8_0%,#E2E8F0_100%)] font-body text-primary selection:bg-secondary/20 selection:text-on-primary-container">
      <div className="absolute top-[-10%] left-[-5%] h-[40rem] w-[40rem] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] h-[50rem] w-[50rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] h-[20rem] w-[20rem] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-[480px] px-6 py-8 text-center">
        <header className="mb-10 text-center">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-3 mb-2 mx-auto">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20 bg-[linear-gradient(135deg,#F17620_0%,#fe802a_100%)]">
              <span className="material-symbols-outlined text-white text-3xl [font-variation-settings:'FILL'_1]">school</span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary">UniCore</h1>
          </button>
          <p className="text-primary/60 font-medium tracking-wide">Academic Atheneum Hub</p>
        </header>

        <div className="rounded-[2rem] p-6 sm:p-10 bg-white/70 backdrop-blur-[20px] border border-white/40 shadow-[0px_24px_48px_rgba(39,34,105,0.08)] text-left">
          <div className="mb-8">
            <h2 className="text-primary text-2xl font-semibold mb-2">Create Your Account</h2>
            <p className="text-primary/60 text-sm">Register to access the hub.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-widest ml-1" htmlFor="signup-first-name">
                First Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/40 group-focus-within:text-secondary transition-colors">person</span>
                </div>
                <input
                  className={`block w-full bg-white/50 rounded-xl py-4 pl-12 pr-4 text-primary placeholder:text-primary/30 focus:ring-2 transition-all duration-300 ${showError('firstName', firstNameError) ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-primary/10 focus:ring-secondary/20 focus:border-secondary'}`}
                  id="signup-first-name"
                  name="firstName"
                  placeholder="John"
                  type="text"
                  autoComplete="given-name"
                  value={formValues.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(showError('firstName', firstNameError))}
                  aria-describedby="signup-first-name-error"
                />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-secondary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300" />
              </div>
              {showError('firstName', firstNameError) ? (
                <p id="signup-first-name-error" className="text-xs text-red-600 px-1">{firstNameError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-widest ml-1" htmlFor="signup-last-name">
                Last Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/40 group-focus-within:text-secondary transition-colors">person</span>
                </div>
                <input
                  className={`block w-full bg-white/50 rounded-xl py-4 pl-12 pr-4 text-primary placeholder:text-primary/30 focus:ring-2 transition-all duration-300 ${showError('lastName', lastNameError) ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-primary/10 focus:ring-secondary/20 focus:border-secondary'}`}
                  id="signup-last-name"
                  name="lastName"
                  placeholder="Doe"
                  type="text"
                  autoComplete="family-name"
                  value={formValues.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(showError('lastName', lastNameError))}
                  aria-describedby="signup-last-name-error"
                />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-secondary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300" />
              </div>
              {showError('lastName', lastNameError) ? (
                <p id="signup-last-name-error" className="text-xs text-red-600 px-1">{lastNameError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-widest ml-1" htmlFor="signup-email">
                Campus Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/40 group-focus-within:text-secondary transition-colors">alternate_email</span>
                </div>
                <input
                  className={`block w-full bg-white/50 rounded-xl py-4 pl-12 pr-4 text-primary placeholder:text-primary/30 focus:ring-2 transition-all duration-300 ${showError('email', emailError) ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-primary/10 focus:ring-secondary/20 focus:border-secondary'}`}
                  id="signup-email"
                  name="email"
                  placeholder="name@campus.com"
                  type="email"
                  autoComplete="email"
                  value={formValues.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(showError('email', emailError))}
                  aria-describedby="signup-email-help signup-email-error"
                />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-secondary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300" />
              </div>
              <p id="signup-email-help" className="text-xs text-primary/40 px-1">
                Use your campus email address.
              </p>
              {showError('email', emailError) ? (
                <p id="signup-email-error" className="text-xs text-red-600 px-1">{emailError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-widest ml-1" htmlFor="signup-password">
                Security Key
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/40 group-focus-within:text-secondary transition-colors">lock</span>
                </div>
                <input
                  className={`block w-full bg-white/50 rounded-xl py-4 pl-12 pr-4 text-primary placeholder:text-primary/30 focus:ring-2 transition-all duration-300 ${showError('password', passwordError) ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-primary/10 focus:ring-secondary/20 focus:border-secondary'}`}
                  id="signup-password"
                  name="password"
                  placeholder="••••••••••••"
                  type="password"
                  autoComplete="new-password"
                  value={formValues.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(showError('password', passwordError))}
                  aria-describedby="signup-password-help signup-password-error"
                />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-secondary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300" />
              </div>
              <div id="signup-password-help" className="space-y-2 px-1 pt-1">
                <p className="text-xs text-primary/40">Password requirements:</p>
                <ul className="space-y-1">
                  {getPasswordStrengthChecks(formValues.password).map((check) => (
                    <li key={check.key} className={`flex items-center gap-2 text-xs ${check.passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-sm">
                        {check.passed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {showError('password', passwordError) ? (
                <p id="signup-password-error" className="text-xs text-red-600 px-1">{passwordError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-widest ml-1" htmlFor="signup-confirm-password">
                Confirm Security Key
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/40 group-focus-within:text-secondary transition-colors">lock</span>
                </div>
                <input
                  className={`block w-full bg-white/50 rounded-xl py-4 pl-12 pr-4 text-primary placeholder:text-primary/30 focus:ring-2 transition-all duration-300 ${showError('confirmPassword', confirmPasswordError) ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-primary/10 focus:ring-secondary/20 focus:border-secondary'}`}
                  id="signup-confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  type="password"
                  autoComplete="new-password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(showError('confirmPassword', confirmPasswordError))}
                  aria-describedby="signup-confirm-password-error"
                />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-secondary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300" />
              </div>
              {showError('confirmPassword', confirmPasswordError) ? (
                <p id="signup-confirm-password-error" className="text-xs text-red-600 px-1">{confirmPasswordError}</p>
              ) : null}
            </div>

            <div className="flex items-center space-x-3 px-1">
              <input
                id="signup-terms"
                name="terms"
                type="checkbox"
                className="w-5 h-5 rounded border-primary/20 bg-white text-secondary focus:ring-offset-0 focus:ring-secondary/50 cursor-pointer"
                checked={formValues.terms}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
              />
              <label className="text-sm text-primary/60 cursor-pointer select-none" htmlFor="signup-terms">
                I agree to the Terms of Service
              </label>
            </div>
            {showError('terms', termsError) ? (
              <p className="text-xs text-red-600 px-1">{termsError}</p>
            ) : null}

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-white font-semibold text-lg shadow-xl shadow-secondary/20 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 bg-[linear-gradient(135deg,#F17620_0%,#fe802a_100%)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-primary/5 text-center">
            <p className="text-primary/40 text-sm">
              Already have an account?{' '}
              <button type="button" onClick={onSwitchToLogin} className="text-primary font-medium hover:text-secondary transition-colors underline underline-offset-4 decoration-primary/20">
                Login
              </button>
            </p>
          </div>

          <footer className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
              <a className="text-primary/50 hover:text-primary transition-colors" href="#privacy">
                Privacy Policy
              </a>
              <a className="text-primary/50 hover:text-primary transition-colors" href="#terms">
                Terms of Service
              </a>
              <a className="text-primary/50 hover:text-primary transition-colors" href="#help">
                Help Center
              </a>
            </div>
            <p className="text-primary/30 text-xs font-light">© 2024 UniCore Academic Atheneum. All rights reserved.</p>
          </footer>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply">
        <img alt="" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_WYK3VeY-YHFUZ9P8FnENkM_e7cJo5bwHA7mR9v9D6HYIl3kwF_K5h3G1BdmiDFBy-WkqmoZD3pLFMOXaK3FU1RIFnpIoZps3ddG4TjiUs7Ak74Tz2FqU4q9FAbgbgiSAtarW5eiWd6xLAX0wJI-o-VbP0KzrlmMRHwo8WyOlxBGAqTRM0yFVpWUVXz7RDZg8xKKh3v7M9iiOGMQ2wSwaFSRMyaK6PKV1R3ReGOqYz9_q7253qldv9tZfyMHfpsHjazrxBVsEP78" />
      </div>
    </div>
  );
}