import type { ArtworkDto, Discount } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { statusLabel, statusTone, useArtworks } from '../lib/catalog';
import { fromCents, money, toCents } from '../lib/format';

export function PricingPage() {
  const artworks = useArtworks();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState('15');
  const qc = useQueryClient();
  const bulk = useMutation({
    mutationFn: (body: { action: string; discount?: Discount }) =>
      api('/artworks/bulk', {
        method: 'POST',
        json: { ids: [...selected], ...body },
      }),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
  const unsold = artworks.data?.items.filter(a => a.status !== 'sold') ?? [];
  const toggle = (id: string) =>
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <>
      <PageHeader title="Pricing & discounts" description="Change prices inline, or put several paintings on sale at once." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="w-full text-sm text-stone-600 sm:w-auto">{selected.size} selected</span>
        <input className="input w-20" value={percent} onChange={e => setPercent(e.target.value)} inputMode="numeric" aria-label="Percent off" />
        <span className="text-sm">% off</span>
        <button
          className="btn-primary"
          disabled={!selected.size || bulk.isPending}
          onClick={() =>
            bulk.mutate({
              action: 'apply_discount',
              discount: { type: 'percent', value: Number(percent) },
            })
          }
        >
          Apply discount
        </button>
        <button className="btn-secondary" disabled={!selected.size || bulk.isPending} onClick={() => bulk.mutate({ action: 'clear_discount' })}>
          Remove discount
        </button>
      </div>
      <ErrorText error={bulk.error} />
      {artworks.isLoading ? (
        <Spinner />
      ) : (
        <>
          <ul className="card divide-y divide-stone-100 p-0 lg:hidden">
            {unsold.map(a => (
              <PriceRow key={a.id} artwork={a} selected={selected.has(a.id)} onToggle={() => toggle(a.id)} compact />
            ))}
          </ul>
          <div className="card hidden overflow-x-auto p-0 lg:block">
            <table className="w-full text-sm">
              <thead className="eyebrow border-b border-stone-200 bg-stone-50 text-left">
                <tr>
                  <th className="w-8 px-4 py-3" />
                  <th className="px-4 py-3 font-medium">Artwork</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Buyers pay</th>
                </tr>
              </thead>
              <tbody>
                {unsold.map(a => (
                  <PriceRow key={a.id} artwork={a} selected={selected.has(a.id)} onToggle={() => toggle(a.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function PriceRow({ artwork: a, selected, onToggle, compact }: { artwork: ArtworkDto; selected: boolean; onToggle: () => void; compact?: boolean }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(fromCents(a.priceCents));
  const save = useMutation({
    mutationFn: () =>
      api(`/artworks/${a.id}`, {
        method: 'PATCH',
        json: { priceCents: toCents(price) },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artworks'] }),
  });
  const discount = a.discount ? (a.discount.type === 'percent' ? `${a.discount.value}% off` : `Sale ${money(a.discount.value, a.currency)}`) : null;
  const priceInput = (
    <input
      className="input w-28 py-1"
      inputMode="decimal"
      value={price}
      onChange={e => setPrice(e.target.value)}
      onBlur={() => toCents(price) !== a.priceCents && save.mutate()}
      aria-label={`Price of ${a.title}`}
    />
  );
  const saveError = save.error && <p className="text-xs text-red-600">{(save.error as Error).message}</p>;

  if (compact) {
    return (
      <li className="flex gap-3 p-4">
        <input type="checkbox" className="mt-1" checked={selected} onChange={onToggle} aria-label={`Select ${a.title}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <Link to={`/artworks/${a.id}`} className="flex items-center gap-3 hover:underline">
            {a.images[0]?.urls.thumb && <img src={a.images[0].urls.thumb} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />}
            <span className="min-w-0">
              <span className="block truncate font-medium">{a.title}</span>
              <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {priceInput}
            {discount && <span className="text-stone-500">{discount}</span>}
            <span className="ml-auto font-medium">{money(a.price?.effectiveCents, a.currency)}</span>
          </div>
          {saveError}
        </div>
      </li>
    );
  }

  return (
    <tr className="border-b border-stone-100 last:border-0">
      <td className="px-4 py-2">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${a.title}`} />
      </td>
      <td className="px-4 py-2">
        <Link to={`/artworks/${a.id}`} className="flex items-center gap-3 hover:underline">
          {a.images[0]?.urls.thumb && <img src={a.images[0].urls.thumb} alt="" className="h-10 w-10 rounded object-cover" />}
          {a.title}
        </Link>
      </td>
      <td className="px-4 py-2">
        <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
      </td>
      <td className="px-4 py-2">
        {priceInput}
        {saveError}
      </td>
      <td className="px-4 py-2">{discount ?? '—'}</td>
      <td className="px-4 py-2 font-medium">{money(a.price?.effectiveCents, a.currency)}</td>
    </tr>
  );
}
