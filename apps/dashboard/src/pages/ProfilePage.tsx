import type { ProfileDto, ProfileInput } from '@platform/contracts';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { ErrorText, Field, PageHeader, Spinner } from '../components/ui';
import { useProfile, useSaveSite } from '../lib/site';

const toInput = ({ photoUrl: _photoUrl, ...rest }: ProfileDto): ProfileInput => rest;

export function ProfilePage() {
  const profile = useProfile();
  const save = useSaveSite<ProfileInput>('/site/profile');
  const [form, setForm] = useState<ProfileInput | null>(null);

  useEffect(() => {
    if (profile.data) setForm(toInput(profile.data));
  }, [profile.data]);

  if (!form) return profile.error ? <ErrorText error={profile.error} /> : <Spinner />;
  const set = (patch: Partial<ProfileInput>) => setForm({ ...form, ...patch });

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <PageHeader
        title="Profile"
        description="Who you are and how people reach you. Shown on your About and Contact pages."
        actions={<button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</button>}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card space-y-4">
          <Field label="Name shown on your site">
            <input className="input" required value={form.displayName} onChange={e => set({ displayName: e.target.value })} />
          </Field>
          <Field label="Tagline" hint="One line under your name.">
            <input className="input" value={form.tagline} onChange={e => set({ tagline: e.target.value })} />
          </Field>
          <Field label="Biography" hint="Leave a blank line between paragraphs.">
            <textarea className="input" rows={7} value={form.bio} onChange={e => set({ bio: e.target.value })} />
          </Field>
          <Field label="Artist statement (optional)">
            <textarea className="input" rows={4} value={form.statement} onChange={e => set({ statement: e.target.value })} />
          </Field>
        </div>
        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="font-semibold">Photo</h2>
            <ImagePicker kind="site" max={1} value={form.photoAssetId ? [form.photoAssetId] : []} onChange={ids => set({ photoAssetId: ids[0] ?? null })} />
          </div>
          <div className="card space-y-3">
            <h2 className="font-semibold">Contact</h2>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => set({ email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={e => set({ phone: e.target.value })} /></Field>
            <Field label="City or region"><input className="input" value={form.location} onChange={e => set({ location: e.target.value })} /></Field>
            <Field label="Studio address"><textarea className="input" rows={3} value={form.address} onChange={e => set({ address: e.target.value })} /></Field>
            <Field label="Opening hours"><input className="input" value={form.hours} onChange={e => set({ hours: e.target.value })} /></Field>
          </div>
          <div className="card space-y-3">
            <h2 className="font-semibold">Social links</h2>
            {form.socialLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input className="input w-28" placeholder="Label" value={link.label} onChange={e => set({ socialLinks: form.socialLinks.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)) })} />
                <input className="input" placeholder="https://" type="url" value={link.url} onChange={e => set({ socialLinks: form.socialLinks.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)) })} />
                <button type="button" className="text-stone-400 hover:text-red-600" aria-label="Remove link" onClick={() => set({ socialLinks: form.socialLinks.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => set({ socialLinks: [...form.socialLinks, { label: '', url: '' }] })}>
              <Plus size={14} /> Add link
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <ErrorText error={save.error} />
        {save.isSuccess && <p className="text-sm text-emerald-700">Saved. Your site shows the change within a minute.</p>}
      </div>
    </form>
  );
}
