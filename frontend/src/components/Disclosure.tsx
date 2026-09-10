'use client';

import { useId, useState } from 'react';
import { ChevronIcon } from './Icons';

/** Progressive disclosure: keeps secondary detail one tap away instead of on screen. */
export function Disclosure({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center gap-2 py-3 text-left text-sm transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <ChevronIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
        <span className="font-medium">{title}</span>
        {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
      </button>
      {open && (
        <div id={panelId} className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
