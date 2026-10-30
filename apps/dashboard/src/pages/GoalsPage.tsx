import type { GoalDto, GoalInput, JournalEntryDto } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, ErrorText, Field, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useAiUsage } from '../lib/ai';
import { date } from '../lib/format';

const blank: GoalInput = { title: '', notes: '', target: null, current: 0, unit: '', dueDate: null, status: 'active' };

export function GoalsPage() {
  return (
    <>
      <PageHeader title="Goals & journal" description="Set goals for your practice, keep short notes on your week, and get a weekly recap." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Goals />
        <Journal />
      </div>
    </>
  );
}

function Goals() {
  const qc = useQueryClient();
  const goals = useQuery({ queryKey: ['goals'], queryFn: () => api<GoalDto[]>('/goals') });
  const [form, setForm] = useState<GoalInput>(blank);
  const refresh = () => qc.invalidateQueries({ queryKey: ['goals'] });
  const create = useMutation({ mutationFn: () => api('/goals', { method: 'POST', json: form }), onSuccess: () => (setForm(blank), refresh()) });
  const update = useMutation({ mutationFn: ({ id, ...g }: GoalDto) => api(`/goals/${id}`, { method: 'PUT', json: g }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api(`/goals/${id}`, { method: 'DELETE' }), onSuccess: refresh });

  return (
    <div className="card space-y-4">
      <h2 className="display text-2xl">Goals</h2>
      <ul className="space-y-3">
        {goals.data?.map(g => {
          const pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : null;
          return (
            <li key={g.id} className="rounded-lg border border-stone-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-medium ${g.status !== 'active' ? 'text-stone-400 line-through' : ''}`}>{g.title}</p>
                  <p className="text-xs text-stone-500">{g.dueDate ? `Due ${date(g.dueDate)}` : 'No due date'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {g.status === 'done' && <Badge tone="green">done</Badge>}
                  <button className="text-stone-400 hover:text-red-600" aria-label="Delete goal" onClick={() => remove.mutate(g.id)}><Trash2 size={16} /></button>
                </div>
              </div>
              {pct !== null && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-accent-500" style={{ width: `${pct}%` }} /></div>
                  <span className="text-xs tabular-nums text-stone-600">{g.current}/{g.target} {g.unit}</span>
                </div>
              )}
              {g.status === 'active' && (
                <div className="mt-2 flex gap-2">
                  {g.target && <button className="btn-secondary px-2 py-1 text-xs" onClick={() => update.mutate({ ...g, current: g.current + 1, status: g.current + 1 >= g.target! ? 'done' : 'active' })}>+1</button>}
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => update.mutate({ ...g, status: 'done' })}>Mark done</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <form
        className="space-y-3 border-t border-stone-100 pt-4"
        onSubmit={e => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="New goal"><input className="input" required placeholder="e.g. Finish the Forest series" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Field label="Target"><input className="input" type="number" min={1} placeholder="10" value={form.target ?? ''} onChange={e => setForm({ ...form, target: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Unit"><input className="input" placeholder="paintings" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></Field>
          <div className="col-span-2 sm:col-span-1"><Field label="Due"><input className="input" type="date" value={form.dueDate ?? ''} onChange={e => setForm({ ...form, dueDate: e.target.value || null })} /></Field></div>
        </div>
        <ErrorText error={create.error ?? update.error ?? remove.error} />
        <button className="btn-primary" disabled={create.isPending}>Add goal</button>
      </form>
    </div>
  );
}

function Journal() {
  const qc = useQueryClient();
  const usage = useAiUsage();
  const entries = useQuery({ queryKey: ['journal'], queryFn: () => api<JournalEntryDto[]>('/journal') });
  const [body, setBody] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['journal'] });
  const add = useMutation({ mutationFn: () => api('/journal', { method: 'POST', json: { body } }), onSuccess: () => (setBody(''), refresh()) });
  const remove = useMutation({ mutationFn: (id: string) => api(`/journal/${id}`, { method: 'DELETE' }), onSuccess: refresh });
  const summary = useMutation({
    mutationFn: () => api('/journal/weekly-summary', { method: 'POST' }),
    onSuccess: () => (refresh(), qc.invalidateQueries({ queryKey: ['ai', 'usage'] })),
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">Journal</h2>
        {usage.data?.configured && (
          <button className="btn-secondary" disabled={summary.isPending} onClick={() => summary.mutate()}>
            <Sparkles size={14} /> {summary.isPending ? 'Writing…' : 'Weekly summary'}
          </button>
        )}
      </div>
      <form
        className="space-y-2"
        onSubmit={e => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <textarea className="input" rows={3} required placeholder="What did you work on today?" value={body} onChange={e => setBody(e.target.value)} />
        <button className="btn-primary" disabled={add.isPending}>Add note</button>
      </form>
      <ErrorText error={add.error ?? summary.error ?? remove.error} />
      <ul className="space-y-3">
        {entries.data?.map(e => (
          <li key={e.id} className={`rounded-lg p-3 text-sm ${e.kind === 'summary' ? 'border border-amber-200 bg-amber-50' : 'border border-stone-200'}`}>
            <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
              <span>{e.kind === 'summary' ? 'Weekly summary · ' : ''}{date(e.createdAt)}</span>
              <button className="hover:text-red-600" aria-label="Delete note" onClick={() => remove.mutate(e.id)}><Trash2 size={14} /></button>
            </div>
            <p className="whitespace-pre-line">{e.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
