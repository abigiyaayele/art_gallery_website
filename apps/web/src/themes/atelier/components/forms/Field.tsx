import React from 'react';

export const inputClass = "w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors";

/** Label + control wrapper used by the request and contact forms. */
export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-text-muted text-xs tracking-widest uppercase">{label}</span>
      {children}
      {hint && <span className="text-text-muted text-xs">{hint}</span>}
    </label>
  );
}

export type FormStatus = 'idle' | 'sending' | 'saved' | 'error';

/** Hidden field bots fill in and people never see. */
export function Honeypot() {
  return (
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
  );
}

/** Message shown after a form is submitted. */
export function FormStatusMessage({ status, savedText }: { status: FormStatus; savedText: string }) {
  if (status === 'saved') return <p role="status" className="text-accent text-sm">{savedText}</p>;
  if (status === 'error') return <p role="alert" className="text-red-400 text-sm">Something went wrong sending your message. Please try again or email the studio directly.</p>;
  return null;
}
