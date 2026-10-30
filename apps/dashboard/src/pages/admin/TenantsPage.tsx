import type { TenantDto } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, ErrorText, Field, PageHeader } from '../../components/ui';
import { api } from '../../lib/api';

const blank = { name: '', slug: '', themeKey: 'minimal', ownerName: '', ownerEmail: '', ownerPassword: '' };

export function TenantsPage() {
  const qc = useQueryClient();
  const tenants = useQuery({ queryKey: ['admin', 'tenants'], queryFn: () => api<TenantDto[]>('/admin/tenants') });
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const onboard = useMutation({
    mutationFn: () =>
      api('/admin/tenants', {
        method: 'POST',
        json: {
          name: form.name,
          slug: form.slug,
          themeKey: form.themeKey,
          owner: { name: form.ownerName, email: form.ownerEmail, password: form.ownerPassword },
        },
      }),
    onSuccess: () => {
      setForm(blank);
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantDto['status'] }) => api(`/admin/tenants/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });

  return (
    <>
      <PageHeader title="Tenants" description="Onboard a new artist: one workspace, one owner account and a subdomain, ready to brand." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tenants.data?.map(t => (
                <tr key={t.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono">{t.slug}</td>
                  <td className="px-4 py-3">
                    <Badge tone={t.status === 'active' ? 'green' : 'red'}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-xs text-stone-500 hover:text-stone-900"
                      onClick={() => setStatus.mutate({ id: t.id, status: t.status === 'active' ? 'suspended' : 'active' })}
                    >
                      {t.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          className="card space-y-3"
          onSubmit={e => {
            e.preventDefault();
            onboard.mutate();
          }}
        >
          <h2 className="font-semibold">Onboard an artist</h2>
          <Field label="Artist or studio name">
            <input className="input" required value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Slug" hint="Becomes the subdomain, e.g. seifu → seifu.yourplatform.com">
            <input className="input font-mono" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={set('slug')} />
          </Field>
          <Field label="Website theme">
            <select className="input" value={form.themeKey} onChange={set('themeKey')}>
              <option value="minimal">Minimal</option>
              <option value="atelier">Atelier</option>
            </select>
          </Field>
          <Field label="Owner name">
            <input className="input" required value={form.ownerName} onChange={set('ownerName')} />
          </Field>
          <Field label="Owner email">
            <input className="input" type="email" required value={form.ownerEmail} onChange={set('ownerEmail')} />
          </Field>
          <Field label="Starting password" hint="Ask the artist to change it after signing in.">
            <input className="input" type="password" minLength={10} required value={form.ownerPassword} onChange={set('ownerPassword')} />
          </Field>
          <ErrorText error={onboard.error} />
          <button className="btn-primary w-full" disabled={onboard.isPending}>
            Create tenant
          </button>
        </form>
      </div>
    </>
  );
}
