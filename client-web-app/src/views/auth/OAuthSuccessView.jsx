import React, { useEffect, useMemo, useState } from 'react';
import { clearAuthSession, decodeJwtPayload, saveAuthSession } from '../../api/authApi';

function deriveNameFromEmail(email) {
  const localPart = (email || '').split('@')[0].trim();
  if (!localPart) {
    return { firstName: 'Google', lastName: 'User' };
  }

  const cleanedParts = localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (cleanedParts.length === 0) {
    return { firstName: 'Google', lastName: 'User' };
  }

  const [firstName, ...rest] = cleanedParts;
  const normalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const normalizedLastName = rest
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
  };
}

function buildSessionFromToken(token) {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    throw new Error('Unable to read the Google login token.');
  }

  const email = typeof claims.email === 'string' && claims.email.trim() ? claims.email : claims.sub;
  const role = typeof claims.role === 'string' && claims.role.trim() ? claims.role : 'USER';
  const firstName = typeof claims.firstName === 'string' && claims.firstName.trim() ? claims.firstName.trim() : '';
  const lastName = typeof claims.lastName === 'string' && claims.lastName.trim() ? claims.lastName.trim() : '';
  const displayName = typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : '';

  if (!email) {
    throw new Error('Google login did not include an email address.');
  }

  const resolvedName = firstName || lastName ? {
    firstName: firstName || deriveNameFromEmail(email).firstName,
    lastName: lastName || deriveNameFromEmail(email).lastName,
  } : splitFullName(displayName) || deriveNameFromEmail(email);

  return {
    tokenType: 'Bearer',
    accessToken: token,
    expiresInSeconds: 0,
    user: {
      firstName: resolvedName.firstName,
      lastName: resolvedName.lastName,
      email,
      role,
      provider: 'GOOGLE',
    },
  };
}

function splitFullName(fullName) {
  if (!fullName) {
    return null;
  }

  const parts = fullName
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: parts[0],
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export default function OAuthSuccessView({ onAuthenticated, onBackToLogin }) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Completing Google sign-in...');

  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return new URLSearchParams();
    }

    return new URLSearchParams(window.location.search);
  }, []);

  useEffect(() => {
    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const failureMessage = searchParams.get('message');

    if (error) {
      clearAuthSession();
      setStatus('error');
      setMessage(failureMessage || 'Google sign-in was cancelled or failed.');
      return;
    }

    if (!token) {
      clearAuthSession();
      setStatus('error');
      setMessage('Google sign-in did not return a token.');
      return;
    }

    try {
      const authResponse = buildSessionFromToken(token);
      saveAuthSession(authResponse, true);

      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/');
      }

      setStatus('success');
      setMessage('Google sign-in completed successfully.');
      onAuthenticated?.(authResponse);
    } catch (authenticationError) {
      clearAuthSession();
      setStatus('error');
      setMessage(authenticationError instanceof Error ? authenticationError.message : 'Unable to complete Google sign-in.');
    }
  }, [onAuthenticated, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#F0F4F8_0%,#E2E8F0_100%)] px-6 text-center font-body text-primary">
      <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/75 p-8 shadow-[0px_24px_48px_rgba(39,34,105,0.08)] backdrop-blur-[20px]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#F17620_0%,#fe802a_100%)] shadow-lg shadow-secondary/20">
          <span className="material-symbols-outlined text-3xl text-white [font-variation-settings:'FILL'_1]">account_circle</span>
        </div>

        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary">
          {status === 'error' ? 'Google Login Failed' : 'Google Login'}
        </h1>
        <p className="mt-3 text-sm text-primary/60">{message}</p>

        {status === 'loading' ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-secondary">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary/70 [animation-delay:150ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary/40 [animation-delay:300ms]" />
          </div>
        ) : null}

        {status === 'error' ? (
          <button
            className="uc-button uc-button--primary uc-button--large mt-6 w-full"
            type="button"
            onClick={onBackToLogin}
          >
            Back to Login
          </button>
        ) : null}
      </div>
    </div>
  );
}