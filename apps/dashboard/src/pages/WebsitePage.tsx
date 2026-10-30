import { themeKeys, type PageSlug, type SitePageDto, type SitePageInput, type SiteSettingsInput, type ThemeKey } from '@platform/contracts';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BlockEditor } from '../components/BlockEditor';
import { ImagePicker } from '../components/ImagePicker';
import { ErrorText, Field, PageHeader, Spinner } from '../components/ui';
import { useSaveSite, useSitePages, useSiteSettings, useSiteUrl } from '../lib/site';

const themeInfo: Record<ThemeKey, { name: string; text: string; swatch: string[] }> = {
  atelier: { name: 'Atelier', text: 'Dark, full-screen exhibition with a carousel. Bold and gallery-like.', swatch: ['#1a2421', '#4ade80', '#ffffff'] },
  minimal: { name: 'Minimal', text: 'Light, quiet and grid based. Lets the work speak.', swatch: ['#fbfaf8', '#161513', '#b5532c'] },
};

const pageHelp: Record<PageSlug, string> = {
  home: 'The first page visitors see.',
  gallery: 'All your published work. Content blocks appear above the list.',
  offers: 'Discounted work is listed automatically; add a message about the offer.',
  about: 'Your profile is shown first, then these blocks.',
  commission: 'Visitors request a commissioned piece here.',
  contact: 'Your contact details and a message form.',
};

export function WebsitePage() {
  const siteUrl = useSiteUrl();
  const [tab, setTab] = useState<'look' | PageSlug>('look');
  const pages = useSitePages();

  return (
    <>
      <PageHeader
        title="Website"
        description="Choose how your site looks and what each page says. Changes go live within a minute."
        actions={siteUrl && <a className="btn-secondary" href={siteUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View site</a>}
      />
      <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
        {[{ key: 'look' as const, label: 'Theme & branding' }, ...(pages.data ?? []).map(p => ({ key: p.slug, label: p.title || p.slug }))].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm capitalize ${tab === t.key ? 'border-stone-900 font-medium' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'look' ? <LookEditor /> : pages.data && <PageEditor key={tab} page={pages.data.find(p => p.slug === tab)!} />}
    </>
  );
}

function LookEditor() {
  const settings = useSiteSettings();
  const save = useSaveSite<SiteSettingsInput>('/site/settings');
  const [form, setForm] = useState<SiteSettingsInput | null>(null);

  useEffect(() => {
    if (settings.data) {
      const { logoUrl: _logoUrl, ...rest } = settings.data;
      setForm(rest);
    }
  }, [settings.data]);

  if (!form) return settings.error ? <ErrorText error={settings.error} /> : <Spinner />;
  const branding = (patch: Partial<SiteSettingsInput['branding']>) => setForm({ ...form, branding: { ...form.branding, ...patch } });
  const color = (key: 'background' | 'text' | 'accent', value: string | undefined) => {
    const colors = { ...form.branding.colors };
    if (value) colors[key] = value;
    else delete colors[key];
    branding({ colors });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={e => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {themeKeys.map(key => (
          <button
            type="button"
            key={key}
            onClick={() => setForm({ ...form, themeKey: key })}
            className={`card text-left transition ${form.themeKey === key ? 'ring-2 ring-stone-900' : 'hover:border-stone-400'}`}
          >
            <div className="mb-3 flex gap-1">
              {themeInfo[key].swatch.map(c => <span key={c} className="h-6 w-6 rounded-full border border-stone-200" style={{ background: c }} />)}
            </div>
            <p className="font-semibold">{themeInfo[key].name}</p>
            <p className="text-sm text-stone-500">{themeInfo[key].text}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="font-semibold">Branding</h2>
          <Field label="Site title"><input className="input" value={form.branding.siteTitle} onChange={e => branding({ siteTitle: e.target.value })} /></Field>
          <div>
            <span className="label">Logo (optional)</span>
            <ImagePicker kind="site" max={1} value={form.branding.logoAssetId ? [form.branding.logoAssetId] : []} onChange={ids => branding({ logoAssetId: ids[0] ?? null })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['background', 'text', 'accent'] as const).map(key => (
              <Field key={key} label={key[0]!.toUpperCase() + key.slice(1)}>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-9 w-12 rounded border border-stone-300" value={form.branding.colors[key] ?? '#000000'} onChange={e => color(key, e.target.value)} />
                  {form.branding.colors[key] ? (
                    <button type="button" className="text-xs text-stone-500 underline" onClick={() => color(key, undefined)}>Reset</button>
                  ) : (
                    <span className="text-xs text-stone-400">Theme default</span>
                  )}
                </div>
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Heading font" hint="Any Google Fonts name."><input className="input" placeholder="Theme default" value={form.branding.headingFont} onChange={e => branding({ headingFont: e.target.value })} /></Field>
            <Field label="Body font"><input className="input" placeholder="Theme default" value={form.branding.bodyFont} onChange={e => branding({ bodyFont: e.target.value })} /></Field>
          </div>
        </div>
        <div className="card space-y-4">
          <h2 className="font-semibold">Search engines and sharing</h2>
          <Field label="Page title" hint="Up to 70 characters."><input className="input" maxLength={70} value={form.seo.title} onChange={e => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} /></Field>
          <Field label="Description" hint="Up to 170 characters."><textarea className="input" rows={3} maxLength={170} value={form.seo.description} onChange={e => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} /></Field>
        </div>
      </div>
      <ErrorText error={save.error} />
      {save.isSuccess && <p className="text-sm text-emerald-700">Saved.</p>}
      <button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save look'}</button>
    </form>
  );
}

function PageEditor({ page }: { page: SitePageDto }) {
  const save = useSaveSite<SitePageInput>(`/site/pages/${page.slug}`);
  const [form, setForm] = useState<SitePageInput>({ title: page.title, enabled: page.enabled, blocks: page.blocks });

  return (
    <form
      className="space-y-6"
      onSubmit={e => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <div className="card space-y-4">
        <p className="text-sm text-stone-500">{pageHelp[page.slug]}</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-60 flex-1">
            <Field label="Menu title"><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          </div>
          {page.slug !== 'home' && (
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
              Show this page on my site
            </label>
          )}
        </div>
      </div>
      <div className="card">
        <h2 className="mb-4 font-semibold">Content</h2>
        <BlockEditor blocks={form.blocks} onChange={blocks => setForm({ ...form, blocks })} />
      </div>
      <ErrorText error={save.error} />
      {save.isSuccess && <p className="text-sm text-emerald-700">Saved.</p>}
      <button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save page'}</button>
    </form>
  );
}
