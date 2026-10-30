import type { ArtworkDto, ArtworkStatus } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { statusLabel, statusTone, useArtworks, useCategories } from '../lib/catalog';
import { money } from '../lib/format';

export function ArtworksPage() {
  const [status, setStatus] = useState<ArtworkStatus | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const artworks = useArtworks({ status: status || undefined, categoryId: categoryId || undefined, q: q || undefined });
  const categories = useCategories();
  const qc = useQueryClient();

  const bulk = useMutation({
    mutationFn: (action: string) =>
      api<{ updated: number; failed: { id: string; message: string }[] }>('/artworks/bulk', {
        method: 'POST',
        json: { ids: [...selected], action },
      }),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['artworks'] });
    },
  });

  const toggle = (id: string) =>
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader
        title="Artworks"
        description="Everything you publish here appears on your website automatically."
        actions={
          <Link to="/artworks/new" className="btn-primary">
            <Plus size={16} /> New artwork
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search titles" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value as ArtworkStatus | '')}>
          <option value="">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="available">Published</option>
          <option value="sold">Sold</option>
        </select>
        <select className="input w-auto" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-stone-50 shadow-lift">
          <span>{selected.size} selected</span>
          {[
            ['publish', 'Publish'],
            ['unpublish', 'Unpublish'],
            ['mark_sold', 'Mark sold'],
            ['clear_discount', 'Remove discount'],
            ['delete', 'Delete'],
          ].map(([action, label]) => (
            <button
              key={action}
              className="rounded px-2 py-1 hover:bg-stone-700"
              disabled={bulk.isPending}
              onClick={() => (action !== 'delete' || confirm(`Delete ${selected.size} artworks?`)) && bulk.mutate(action)}
            >
              {label}
            </button>
          ))}
          <button className="ml-auto text-stone-300 hover:text-white" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}
      {bulk.data && bulk.data.failed.length > 0 && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {bulk.data.updated} updated. {bulk.data.failed.length} could not change: {bulk.data.failed[0]!.message}
        </p>
      )}
      <ErrorText error={bulk.error ?? artworks.error} />

      {artworks.isLoading ? (
        <Spinner />
      ) : artworks.data?.items.length === 0 ? (
        <EmptyState title="No artworks yet">Upload a painting to get started.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artworks.data?.items.map(a => (
            <ArtworkTile key={a.id} artwork={a} selected={selected.has(a.id)} onToggle={() => toggle(a.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function ArtworkTile({ artwork: a, selected, onToggle }: { artwork: ArtworkDto; selected: boolean; onToggle: () => void }) {
  const cover = a.images[0]?.urls.thumb;
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift ${selected ? 'border-stone-900 ring-2 ring-stone-900' : 'border-stone-200/80'}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="absolute left-2 top-2 z-10 h-4 w-4" aria-label={`Select ${a.title}`} />
      <Link to={`/artworks/${a.id}`}>
        <div className="flex aspect-square items-center justify-center bg-stone-100">
          {cover ? <img src={cover} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <ImageOff className="text-stone-400" />}
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate font-medium">{a.title}</p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
            <span>
              {a.price?.onSale && <span className="mr-1 text-stone-400 line-through">{money(a.price.regularCents, a.currency)}</span>}
              {money(a.price?.effectiveCents, a.currency)}
            </span>
            <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
          </div>
        </div>
      </Link>
    </div>
  );
}
