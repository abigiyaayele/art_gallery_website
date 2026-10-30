import type { DomainDto, Member } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge, ErrorText, Field, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useAuth, useWorkspace } from '../lib/auth';

export function SettingsPage() {
  const { isOwner } = useWorkspace();
  return (
    <>
      <PageHeader title="Settings" description="Your account, the people in this workspace, and your website's domains." />
      <div className="grid gap-6 lg:grid-cols-2">
        <PasswordCard />
        <MembersCard canManage={isOwner} />
        <DomainsCard canManage={isOwner} />
      </div>
    </>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const change = useMutation({
    mutationFn: () => api('/auth/password', { method: 'POST', json: { currentPassword, newPassword } }),
    onSuccess: () => {
      setCurrent('');
      setNew('');
    },
  });
  return (
    <form
      className="card space-y-3"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        change.mutate();
      }}
    >
      <h2 className="font-semibold">Password</h2>
      <Field label="Current password">
        <input className="input" type="password" required value={currentPassword} onChange={e => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" hint="At least 10 characters. Other devices are signed out.">
        <input className="input" type="password" required minLength={10} value={newPassword} onChange={e => setNew(e.target.value)} />
      </Field>
      <ErrorText error={change.error} />
      {change.isSuccess && <p className="text-sm text-emerald-700">Password changed.</p>}
      <button className="btn-primary" disabled={change.isPending}>
        Change password
      </button>
    </form>
  );
}

function MembersCard({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const members = useQuery({ queryKey: ['members'], queryFn: () => api<Member[]>('/workspace/members') });
  const [form, setForm] = useState({ email: '', name: '', role: 'editor', password: '' });
  const add = useMutation({
    mutationFn: () => api('/workspace/members', { method: 'POST', json: form }),
    onSuccess: () => {
      setForm({ email: '', name: '', role: 'editor', password: '' });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
  const remove = useMutation({
    mutationFn: (userId: string) => api(`/workspace/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Members</h2>
      <ul className="divide-y divide-stone-100">
        {members.data?.map(m => (
          <li key={m.userId} className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-stone-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={m.role === 'owner' ? 'blue' : 'stone'}>{m.role}</Badge>
              {canManage && m.userId !== session?.user.id && (
                <button className="text-stone-400 hover:text-red-600" onClick={() => remove.mutate(m.userId)} aria-label={`Remove ${m.name}`}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ErrorText error={remove.error} />
      {canManage && (
        <form
          className="space-y-3 border-t border-stone-100 pt-4"
          onSubmit={e => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <p className="text-sm font-medium">Add a member</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
            <input
              className="input"
              type="password"
              placeholder="Starting password"
              minLength={10}
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <ErrorText error={add.error} />
          <button className="btn-secondary" disabled={add.isPending}>
            Add member
          </button>
        </form>
      )}
    </div>
  );
}

function DomainsCard({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const domains = useQuery({ queryKey: ['domains'], queryFn: () => api<DomainDto[]>('/workspace/domains') });
  const [hostname, setHostname] = useState('');
  const add = useMutation({
    mutationFn: () => api('/workspace/domains', { method: 'POST', json: { hostname } }),
    onSuccess: () => {
      setHostname('');
      qc.invalidateQueries({ queryKey: ['domains'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/workspace/domains/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  });

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Domains</h2>
      <ul className="space-y-2 text-sm">
        {domains.data?.map(d => (
          <li key={d.id} className="flex items-center justify-between">
            <a className="font-mono hover:underline" href={`http://${d.hostname}`} target="_blank" rel="noreferrer">
              {d.hostname}
            </a>
            <div className="flex items-center gap-2">
              {d.isPrimary && <Badge tone="green">primary</Badge>}
              {d.isPlatformSubdomain ? (
                <Badge>platform</Badge>
              ) : (
                canManage && (
                  <button className="text-stone-400 hover:text-red-600" onClick={() => remove.mutate(d.id)} aria-label={`Remove ${d.hostname}`}>
                    <Trash2 size={16} />
                  </button>
                )
              )}
            </div>
          </li>
        ))}
      </ul>
      {canManage && (
        <form
          className="flex gap-2 border-t border-stone-100 pt-4"
          onSubmit={e => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <input className="input" placeholder="yourname.com" required value={hostname} onChange={e => setHostname(e.target.value)} />
          <button className="btn-secondary" disabled={add.isPending}>
            Connect
          </button>
        </form>
      )}
      <ErrorText error={add.error ?? remove.error} />
      <p className="text-xs text-stone-500">Point your domain's DNS (a CNAME record) at the platform, then connect it here.</p>
    </div>
  );
}
