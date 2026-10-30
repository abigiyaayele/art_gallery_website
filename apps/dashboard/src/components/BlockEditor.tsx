import type { ContentBlock } from '@platform/contracts';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { ImagePicker } from './ImagePicker';
import { Field } from './ui';

type BlockType = ContentBlock['type'];

export const blockLabels: Record<BlockType, string> = {
  hero: 'Big heading',
  text: 'Text',
  features: 'Points (e.g. how you work)',
  artworks: 'Artworks',
  gallery: 'Photo gallery',
  exhibitions: 'Exhibitions list',
  clients: 'Client projects',
  cta: 'Call to action',
};

const empty: { [K in BlockType]: Extract<ContentBlock, { type: K }> } = {
  hero: { type: 'hero', heading: '', subheading: '', imageIds: [] },
  text: { type: 'text', heading: '', body: '' },
  features: { type: 'features', heading: '', items: [{ title: '', text: '' }] },
  artworks: { type: 'artworks', heading: '', mode: 'latest', limit: 4 },
  gallery: { type: 'gallery', heading: '', caption: '', imageIds: [] },
  exhibitions: { type: 'exhibitions', heading: '', items: [] },
  clients: { type: 'clients', heading: '', items: [] },
  cta: { type: 'cta', heading: '', body: '', buttonLabel: '', href: '' },
};

/** Editable list of a page's content blocks; each theme decides how they look. */
export function BlockEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (b: ContentBlock[]) => void }) {
  const update = (i: number, block: ContentBlock) => onChange(blocks.map((b, j) => (j === i ? block : b)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...blocks];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{blockLabels[block.type]}</span>
            <div className="flex gap-2 text-stone-500">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={16} /></button>
              <button type="button" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={16} /></button>
              <button type="button" className="hover:text-red-600" onClick={() => onChange(blocks.filter((_, j) => j !== i))} aria-label="Remove block"><Trash2 size={16} /></button>
            </div>
          </div>
          <BlockFields block={block} onChange={b => update(i, b)} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Plus size={14} className="text-stone-500" />
        {(Object.keys(empty) as BlockType[]).map(t => (
          <button key={t} type="button" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs hover:bg-stone-100" onClick={() => onChange([...blocks, structuredClone(empty[t])])}>
            {blockLabels[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  const heading = (
    <Field label="Heading">
      <input className="input" value={block.heading} onChange={e => onChange({ ...block, heading: e.target.value })} />
    </Field>
  );

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          {heading}
          <Field label="Subheading"><input className="input" value={block.subheading} onChange={e => onChange({ ...block, subheading: e.target.value })} /></Field>
          <ImagePicker kind="site" max={1} value={block.imageIds} onChange={imageIds => onChange({ ...block, imageIds })} />
        </div>
      );
    case 'text':
      return (
        <div className="space-y-3">
          {heading}
          <Field label="Text" hint="Leave a blank line between paragraphs.">
            <textarea className="input" rows={5} value={block.body} onChange={e => onChange({ ...block, body: e.target.value })} />
          </Field>
        </div>
      );
    case 'features':
      return (
        <div className="space-y-3">
          {heading}
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input className="input" placeholder="Title" value={item.title} onChange={e => onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)) })} />
              <input className="input" placeholder="Text" value={item.text} onChange={e => onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, text: e.target.value } : it)) })} />
              <button type="button" className="text-stone-400 hover:text-red-600" aria-label="Remove point" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => onChange({ ...block, items: [...block.items, { title: '', text: '' }] })}>Add point</button>
        </div>
      );
    case 'artworks':
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {heading}
          <Field label="Which works">
            <select className="input" value={block.mode} onChange={e => onChange({ ...block, mode: e.target.value as typeof block.mode })}>
              <option value="latest">Latest available</option>
              <option value="featured">Featured first</option>
              <option value="on_sale">On offer</option>
            </select>
          </Field>
          <Field label="How many">
            <input className="input" type="number" min={1} max={24} value={block.limit} onChange={e => onChange({ ...block, limit: Math.max(1, Math.min(24, Number(e.target.value) || 1)) })} />
          </Field>
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-3">
          {heading}
          <Field label="Caption"><input className="input" value={block.caption} onChange={e => onChange({ ...block, caption: e.target.value })} /></Field>
          <ImagePicker kind="site" value={block.imageIds} onChange={imageIds => onChange({ ...block, imageIds })} />
        </div>
      );
    case 'exhibitions':
      return (
        <div className="space-y-3">
          {heading}
          {block.items.map((item, i) => {
            const set = (patch: Partial<typeof item>) => onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
            return (
              <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                <input className="input" placeholder="Title" value={item.title} onChange={e => set({ title: e.target.value })} />
                <input className="input" placeholder="Kind" value={item.subtitle} onChange={e => set({ subtitle: e.target.value })} />
                <input className="input" placeholder="When" value={item.date} onChange={e => set({ date: e.target.value })} />
                <input className="input" placeholder="Where" value={item.location} onChange={e => set({ location: e.target.value })} />
                <button type="button" className="text-stone-400 hover:text-red-600" aria-label="Remove exhibition" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
              </div>
            );
          })}
          <button type="button" className="btn-secondary" onClick={() => onChange({ ...block, items: [...block.items, { title: '', subtitle: '', date: '', location: '' }] })}>Add exhibition</button>
        </div>
      );
    case 'clients':
      return (
        <div className="space-y-3">
          {heading}
          {block.items.map((item, i) => {
            const set = (patch: Partial<typeof item>) => onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
            return (
              <div key={i} className="space-y-2 rounded-md border border-stone-200 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input className="input" placeholder="Client" value={item.name} onChange={e => set({ name: e.target.value })} />
                  <input className="input" placeholder="Project" value={item.project} onChange={e => set({ project: e.target.value })} />
                  <button type="button" className="text-stone-400 hover:text-red-600" aria-label="Remove project" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
                </div>
                <textarea className="input" rows={2} placeholder="About the project" value={item.text} onChange={e => set({ text: e.target.value })} />
                <ImagePicker kind="site" value={item.imageIds} onChange={imageIds => set({ imageIds })} />
              </div>
            );
          })}
          <button type="button" className="btn-secondary" onClick={() => onChange({ ...block, items: [...block.items, { name: '', project: '', text: '', imageIds: [] }] })}>Add project</button>
        </div>
      );
    case 'cta':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {heading}
          <Field label="Text"><input className="input" value={block.body} onChange={e => onChange({ ...block, body: e.target.value })} /></Field>
          <Field label="Button label"><input className="input" value={block.buttonLabel} onChange={e => onChange({ ...block, buttonLabel: e.target.value })} /></Field>
          <Field label="Button link" hint="e.g. /commission or /contact"><input className="input" value={block.href} onChange={e => onChange({ ...block, href: e.target.value })} /></Field>
        </div>
      );
  }
}
