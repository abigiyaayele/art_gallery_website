import type { AssetDto } from '@platform/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { errorMessage } from '../lib/api';
import { uploadFile, useMedia } from '../lib/catalog';

/**
 * Ordered images: for an artwork the first one is the cover. Uploads run in
 * parallel. `kind` picks the library (artwork images or website images) and
 * `max` limits how many can be chosen, e.g. 1 for a logo.
 */
export function ImagePicker({
  value,
  onChange,
  kind = 'artwork',
  max = 24,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  kind?: 'artwork' | 'site';
  max?: number;
}) {
  const media = useMedia(kind);
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const byId = new Map((media.data ?? []).map(a => [a.id, a]));
  const chosen = value.map(id => byId.get(id)).filter((a): a is AssetDto => !!a);

  const upload = async (files: FileList | File[]) => {
    setError(null);
    const list = [...files].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f.name));
    setUploading(n => n + list.length);
    const ids: string[] = [];
    await Promise.all(
      list.map(async f => {
        try {
          ids.push((await uploadFile(f, kind)).id);
        } catch (err) {
          setError(`${f.name}: ${errorMessage(err)}`);
        } finally {
          setUploading(n => n - 1);
        }
      }),
    );
    await qc.invalidateQueries({ queryKey: ['media'] });
    onChange([...value, ...ids].slice(-max));
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    onChange(next);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {chosen.map((a, i) => (
          <div key={a.id} className="group relative overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            {a.urls.thumb ? (
              <img src={a.urls.thumb} alt={a.altText} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs text-stone-500">
                {a.status === 'failed' ? 'Failed' : <Loader2 className="animate-spin" size={18} />}
              </div>
            )}
            {i === 0 && kind === 'artwork' && <span className="absolute left-1 top-1 rounded bg-stone-900/80 px-1.5 text-[10px] text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">
                <ArrowLeft size={14} />
              </button>
              <button type="button" onClick={() => onChange(value.filter(id => id !== a.id))} aria-label="Remove image">
                <X size={14} />
              </button>
              <button type="button" disabled={i === chosen.length - 1} onClick={() => move(i, 1)} aria-label="Move right">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-500 hover:border-stone-500"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
          {uploading ? `Uploading ${uploading}…` : 'Drop or upload'}
        </button>}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={e => e.target.files && upload(e.target.files)} />
      <button type="button" className="text-sm text-stone-600 underline" onClick={() => setShowLibrary(s => !s)}>
        {showLibrary ? 'Hide library' : 'Choose from your image library'}
      </button>
      {showLibrary && (
        <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-stone-200 p-2 sm:grid-cols-8">
          {media.data
            ?.filter(a => a.status === 'ready' && !value.includes(a.id))
            .map(a => (
              <button type="button" key={a.id} onClick={() => onChange([...value, a.id].slice(-max))} className="overflow-hidden rounded">
                <img src={a.urls.thumb} alt={a.altText} className="aspect-square w-full object-cover hover:opacity-80" />
              </button>
            ))}
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
