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
      <div className="mx-auto mt-24 max-w-sm px-4">
        <h1 className="mb-2 text-lg font-semibold">Attendance Planner</h1>
        <p className="mb-4 text-sm text-neutral-500">
          Enter your access code (the same secret configured on the backend).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setAccessCode(input.trim());
            setHasCode(true);
          }}
          className="flex gap-2"
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Access code"
            className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            autoFocus
          />
          <button
            type="submit"
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
