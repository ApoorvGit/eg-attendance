'use client';

import { useEffect, useState } from 'react';
import { getAccessCode, setAccessCode } from '@/lib/api';

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    setHasCode(!!getAccessCode());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!hasCode) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="text-xl font-semibold tracking-tight">Attendance</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Enter your access code to continue.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setAccessCode(input.trim());
            setHasCode(true);
          }}
        >
          <label htmlFor="code" className="text-sm font-medium">
            Access code
          </label>
          <input
            id="code"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          <button
            type="submit"
            className="mt-3 w-full cursor-pointer rounded-md bg-action px-4 py-2.5 text-sm font-medium text-action-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  return <>{children}</>;
}
