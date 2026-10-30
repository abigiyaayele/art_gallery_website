import type { ReactNode } from 'react';
import { errorMessage } from '../lib/api';

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-4xl leading-none text-stone-900 sm:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage(error)}</p>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-14 text-center">
      <p className="display text-2xl text-stone-800">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-accent-500" aria-label="Loading" />;
}

export function Badge({ tone = 'stone', children }: { tone?: 'stone' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const tones = {
    stone: 'bg-stone-100 text-stone-600 before:bg-stone-400',
    green: 'bg-emerald-50 text-emerald-800 before:bg-emerald-500',
    amber: 'bg-amber-50 text-amber-800 before:bg-amber-500',
    red: 'bg-red-50 text-red-700 before:bg-red-500',
    blue: 'bg-sky-50 text-sky-800 before:bg-sky-500',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
