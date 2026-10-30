import type { AssetDto } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { EmptyState, ErrorText, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { uploadFile, useMedia } from '../lib/catalog';

export function MediaPage() {
  const media = useMedia();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<unknown>(null);

  const upload = async (files: FileList) => {
    setError(null);
    setUploading(files.length);
    await Promise.all(
      [...files].map(f =>
        uploadFile(f)
          .catch(setError)
          .finally(() => setUploading(n => n - 1)),
      ),
    );
    qc.invalidateQueries({ queryKey: ['media'] });
  };

  return (
    <>
      <PageHeader
        title="Images"
        description="Every upload is stored privately in your own folder; resized copies are made automatically for the website."
        actions={
          <button className="btn-primary" onClick={() => input.current?.click()} disabled={uploading > 0}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
          </button>
        }
      />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && upload(e.target.files)} />
      <ErrorText error={error} />
      {media.data?.length === 0 ? (
        <EmptyState title="No images yet" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {media.data?.map(a => <AssetCard key={a.id} asset={a} />)}
        </div>
      )}
    </>
  );
}

function AssetCard({ asset }: { asset: AssetDto }) {
  const qc = useQueryClient();
  const [alt, setAlt] = useState(asset.altText);
  const save = useMutation({
    mutationFn: () => api(`/media/${asset.id}`, { method: 'PATCH', json: { altText: alt } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
  const remove = useMutation({
    mutationFn: () => api(`/media/${asset.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white text-xs">
      <div className="flex aspect-square items-center justify-center bg-stone-100">
        {asset.urls.thumb ? (
          <img src={asset.urls.thumb} alt={asset.altText} className="h-full w-full object-cover" loading="lazy" />
        ) : asset.status === 'failed' ? (
          <span className="text-red-600">Processing failed</span>
        ) : (
          <Loader2 className="animate-spin text-stone-400" />
        )}
      </div>
      <div className="space-y-2 p-2">
        <p className="truncate text-stone-600" title={asset.originalName}>
          {asset.originalName} {asset.width ? `· ${asset.width}×${asset.height}` : ''}
        </p>
        <input
          className="input py-1 text-xs"
          placeholder="Describe the image (alt text)"
          value={alt}
          onChange={e => setAlt(e.target.value)}
          onBlur={() => alt !== asset.altText && save.mutate()}
        />
        <button className="flex items-center gap-1 text-stone-500 hover:text-red-600" onClick={() => remove.mutate()}>
          <Trash2 size={12} /> Delete
        </button>
        {remove.error && <p className="text-red-600">{(remove.error as Error).message}</p>}
      </div>
    </div>
  );
}
