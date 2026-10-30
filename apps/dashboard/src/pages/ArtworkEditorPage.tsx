import type { ArtworkDto, Discount } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImagePicker } from '../components/ImagePicker';
import { Badge, ErrorText, Field, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { AiCopyPanel } from '../components/AiCopyPanel';
import { statusLabel, statusTone, useArtwork, useArtworkAction, useCategories } from '../lib/catalog';
import { fromCents, money, toCents } from '../lib/format';

interface FormState {
  title: string;
  description: string;
  story: string;
  medium: string;
  dimensions: string;
  year: string;
  collection: string;
  categoryId: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  price: string;
  currency: string;
  discountType: '' | Discount['type'];
  discountValue: string;
  featured: boolean;
  imageIds: string[];
}

const empty: FormState = {
  title: '',
  description: '',
  story: '',
  medium: '',
  dimensions: '',
  year: '',
  collection: '',
  categoryId: '',
  tags: '',
  seoTitle: '',
  seoDescription: '',
  price: '',
  currency: 'USD',
  discountType: '',
  discountValue: '',
  featured: false,
  imageIds: [],
};

function fromDto(a: ArtworkDto): FormState {
  return {
    title: a.title,
    description: a.description,
    story: a.story,
    medium: a.medium,
    dimensions: a.dimensions,
    year: a.year ? String(a.year) : '',
    collection: a.collection,
    categoryId: a.categoryId ?? '',
    tags: a.tags.join(', '),
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    price: fromCents(a.priceCents),
    currency: a.currency,
    discountType: a.discount?.type ?? '',
    discountValue: a.discount ? (a.discount.type === 'percent' ? String(a.discount.value) : fromCents(a.discount.value)) : '',
    featured: a.featured,
    imageIds: a.images.map(i => i.id),
  };
}

function toPayload(f: FormState) {
  const discount: Discount | null =
    f.discountType === 'percent' && f.discountValue
      ? { type: 'percent', value: Math.round(Number(f.discountValue)) }
      : f.discountType === 'fixed_price' && toCents(f.discountValue)
        ? { type: 'fixed_price', value: toCents(f.discountValue)! }
        : null;
  return {
    title: f.title,
    description: f.description,
    story: f.story,
    medium: f.medium,
    dimensions: f.dimensions,
    year: f.year ? Number(f.year) : null,
    collection: f.collection,
    categoryId: f.categoryId || null,
    tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
    seoTitle: f.seoTitle,
    seoDescription: f.seoDescription,
    priceCents: toCents(f.price),
    currency: f.currency,
    discount,
    featured: f.featured,
    imageIds: f.imageIds,
  };
}

export function ArtworkEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const artwork = useArtwork(isNew ? undefined : id);
  const categories = useCategories();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const action = useArtworkAction();
  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    if (artwork.data) setForm(fromDto(artwork.data));
  }, [artwork.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));
  const text = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  });

  const save = useMutation({
    mutationFn: () =>
      isNew
        ? api<ArtworkDto>('/artworks', { method: 'POST', json: toPayload(form) })
        : api<ArtworkDto>(`/artworks/${id}`, { method: 'PATCH', json: toPayload(form) }),
    onSuccess: saved => {
      qc.invalidateQueries({ queryKey: ['artworks'] });
      qc.setQueryData(['artwork', saved.id], saved);
      if (isNew) navigate(`/artworks/${saved.id}`, { replace: true });
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/artworks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artworks'] });
      navigate('/artworks');
    },
  });

  if (!isNew && artwork.isLoading) return <Spinner />;
  const current = artwork.data;
  const preview = toPayload(form);
  const effective =
    preview.priceCents && preview.discount
      ? preview.discount.type === 'percent'
        ? Math.round((preview.priceCents * (100 - preview.discount.value)) / 100)
        : preview.discount.value
      : preview.priceCents;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit}>
      <Link to="/artworks" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
        <ArrowLeft size={14} /> Artworks
      </Link>
      <PageHeader
        title={isNew ? 'New artwork' : form.title || 'Untitled'}
        description={current ? undefined : 'Save as a draft first; publish when it is ready to appear on your website.'}
        actions={
          <>
            {current && <Badge tone={statusTone(current.status)}>{statusLabel(current.status)}</Badge>}
            <button className="btn-secondary" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            {current?.status === 'draft' && (
              <button type="button" className="btn-primary" disabled={action.isPending} onClick={() => action.mutate({ id: current.id, action: 'publish' })}>
                Publish
              </button>
            )}
            {current?.status === 'available' && (
              <>
                <button type="button" className="btn-secondary" onClick={() => action.mutate({ id: current.id, action: 'unpublish' })}>
                  Unpublish
                </button>
                <button type="button" className="btn-primary" onClick={() => action.mutate({ id: current.id, action: 'mark-sold' })}>
                  Mark sold
                </button>
              </>
            )}
            {current?.status === 'sold' && (
              <button type="button" className="btn-secondary" onClick={() => action.mutate({ id: current.id, action: 'revert-sold' })}>
                Revert sale
              </button>
            )}
          </>
        }
      />
      <div className="space-y-3">
        <ErrorText error={save.error ?? action.error ?? remove.error} />
        {save.isSuccess && !save.isPending && <p className="text-sm text-emerald-700">Saved.</p>}
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">Images</h2>
            <ImagePicker value={form.imageIds} onChange={ids => set('imageIds', ids)} />
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold">Details</h2>
            <Field label="Title">
              <input className="input" required maxLength={200} {...text('title')} />
            </Field>
            <Field label="Description" hint="Shown under the painting on your website.">
              <textarea className="input min-h-24" maxLength={5000} {...text('description')} />
            </Field>
            <Field label="Story" hint="The longer story behind the painting, for its own page.">
              <textarea className="input min-h-32" maxLength={20000} {...text('story')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Medium">
                <input className="input" placeholder="Oil on canvas" {...text('medium')} />
              </Field>
              <Field label="Dimensions">
                <input className="input" placeholder="80 × 100 cm" {...text('dimensions')} />
              </Field>
              <Field label="Year">
                <input className="input" type="number" min={1000} max={3000} {...text('year')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className="input" {...text('categoryId')}>
                  <option value="">None</option>
                  {categories.data?.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Collection or exhibition">
                <input className="input" {...text('collection')} />
              </Field>
            </div>
            <Field label="Tags" hint="Separate with commas.">
              <input className="input" {...text('tags')} />
            </Field>
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold">Search engines</h2>
            <Field label="SEO title" hint={`${form.seoTitle.length}/70. Leave empty to use the title.`}>
              <input className="input" maxLength={70} {...text('seoTitle')} />
            </Field>
            <Field label="SEO description" hint={`${form.seoDescription.length}/170`}>
              <textarea className="input" maxLength={170} {...text('seoDescription')} />
            </Field>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">Price</h2>
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <Field label="Price">
                <input className="input" inputMode="decimal" placeholder="1200" {...text('price')} />
              </Field>
              <Field label="Currency">
                <select className="input" {...text('currency')}>
                  {['USD', 'ETB', 'EUR', 'GBP'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Discount">
              <select className="input" {...text('discountType')}>
                <option value="">No discount</option>
                <option value="percent">Percentage off</option>
                <option value="fixed_price">Sale price</option>
              </select>
            </Field>
            {form.discountType && (
              <Field label={form.discountType === 'percent' ? 'Percent off (1–90)' : 'Sale price'}>
                <input className="input" inputMode="decimal" {...text('discountValue')} />
              </Field>
            )}
            <div className="rounded-md bg-stone-50 p-3 text-sm">
              Buyers pay{' '}
              <strong>
                {money(effective, form.currency)}
                {effective !== preview.priceCents && preview.priceCents && (
                  <span className="ml-1 font-normal text-stone-400 line-through">{money(preview.priceCents, form.currency)}</span>
                )}
              </strong>
            </div>
          </section>
          <section className="card space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
              Feature on the home page
            </label>
          </section>
          {current && <AiCopyPanel artwork={current} />}
          {current && (
            <button
              type="button"
              className="btn-danger w-full"
              onClick={() => confirm('Delete this artwork? This cannot be undone.') && remove.mutate()}
            >
              <Trash2 size={16} /> Delete artwork
            </button>
          )}
        </aside>
      </div>
    </form>
  );
}
