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

export type FormStatus = 'idle' | 'sending' | 'saved' | 'emailed' | 'error';

/** Message shown after a form is submitted. */
export function FormStatusMessage({ status, savedText }: { status: FormStatus; savedText: string }) {
  if (status === 'saved') return <p role="status" className="text-accent text-sm">{savedText}</p>;
  if (status === 'emailed') return <p role="status" className="text-accent text-sm">Your email app should open with the details filled in. Just press send.</p>;
  if (status === 'error') return <p role="alert" className="text-red-400 text-sm">Something went wrong sending your message. Please try again or email us directly.</p>;
  return null;
}
