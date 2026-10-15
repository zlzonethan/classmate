'use client';

import { FormEvent, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

async function syncUserProfile(user: User) {
  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName || '',
        email: user.email || '',
        classId: 'default',
        role: 'STUDENT',
      }),
    });

    if (!response.ok) {
      console.warn('User profile sync failed', await response.text());
    }
  } catch (syncError) {
    console.warn('Profile sync encountered an error:', syncError);
  }
}

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getFirebaseAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!auth || !isFirebaseConfigured()) {
      setError('Firebase client configuration is missing. Add your public Firebase credentials to .env.local to enable authentication.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName.trim()) {
          await updateProfile(result.user, { displayName: fullName.trim() });
        }
        await syncUserProfile(result.user);
        setMessage('Account created. You can now sign in.');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(result.user);
        setMessage('Signed in successfully.');
      }
    } catch (submitError) {
      const err = submitError as Error;
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');

    if (!auth || !isFirebaseConfigured()) {
      setError('Firebase client configuration is missing. Add your public Firebase credentials to .env.local to enable authentication.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await syncUserProfile(result.user);
      setMessage('Signed in with Google successfully.');
    } catch (signInError) {
      const err = signInError as Error;
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');

    if (!email) {
      setError('Enter your email first, then request a password reset.');
      return;
    }

    if (!auth || !isFirebaseConfigured()) {
      setError('Firebase is not configured yet. Add your public Firebase settings before resetting a password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (resetError) {
      const err = resetError as Error;
      setError(err.message || 'Failed to send a reset email.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Classmate</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to access class content.' : 'Start using the shared class platform.'}</p>
      </div>

      <div className="mb-5 flex rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
              placeholder="Hana Kim"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            placeholder="student@school.edu"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Processing...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z" />
          <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.54 10.54 0 0 0 12 0 11 11 0 0 0 2.15 7.05l3.69 2.84C6.71 7.29 9.14 4.36 12 4.36Z" />
        </svg>
        {isSubmitting ? 'Processing...' : 'Continue with Google'}
      </button>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-500">
        <button type="button" onClick={handlePasswordReset} className="font-medium text-sky-700 hover:text-sky-800">
          Forgot password?
        </button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-medium text-slate-700 hover:text-slate-900">
          {mode === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
    </div>
  );
}
