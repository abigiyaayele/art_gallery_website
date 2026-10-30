import { aiTones, type AiTone, type ArtworkCopy, type ArtworkDto } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAiUsage, useSuggestions } from '../lib/ai';
import { ErrorText } from './ui';

type Pick = { title: string | null; description: boolean; story: boolean; tags: boolean; seoDescription: boolean };
const nothing: Pick = { title: null, description: false, story: false, tags: false, seoDescription: false };

/**
 * Drafts copy for a saved artwork. The artist ticks what to keep; nothing
 * changes until they press Apply.
 */
export function AiCopyPanel({ artwork }: { artwork: ArtworkDto }) {
  const qc = useQueryClient();
  const usage = useAiUsage();
  const suggestions = useSuggestions({ artworkId: artwork.id, kind: 'artwork_copy' });
  const pending = suggestions.data?.find(s => s.status === 'pending');
  const draft = pending?.output as ArtworkCopy | undefined;
  const [tone, setTone] = useState<AiTone>('warm');
  const [notes, setNotes] = useState('');
  const [pick, setPick] = useState<Pick>(nothing);

  useEffect(() => {
    setPick(draft ? { title: draft.titles[0] ?? null, description: true, story: true, tags: true, seoDescription: true } : nothing);
  }, [pending?.id]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['ai'] });
  const generate = useMutation({ mutationFn: () => api(`/ai/artworks/${artwork.id}/copy`, { method: 'POST', json: { tone, notes } }), onSuccess: refresh });
  const dismiss = useMutation({ mutationFn: (id: string) => api(`/ai/suggestions/${id}/dismiss`, { method: 'POST' }), onSuccess: refresh });
  const apply = useMutation({
    mutationFn: () =>
      api<ArtworkDto>(`/ai/suggestions/${pending!.id}/apply`, {
        method: 'POST',
        json: {
          ...(pick.title ? { title: pick.title } : {}),
          ...(pick.description ? { description: draft!.description } : {}),
          ...(pick.story ? { story: draft!.story } : {}),
          ...(pick.tags ? { tags: draft!.tags } : {}),
          ...(pick.seoDescription ? { seoDescription: draft!.seoDescription } : {}),
        },
      }),
    onSuccess: saved => {
      qc.setQueryData(['artwork', saved.id], saved);
      qc.invalidateQueries({ queryKey: ['artworks'] });
      refresh();
    },
  });

  if (usage.data && !usage.data.configured) {
    return (
      <section className="card space-y-1 text-sm">
        <h2 className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> Write with AI</h2>
        <p className="text-stone-500">The AI assistant is not set up on this platform yet.</p>
      </section>
    );
  }

  const check = (key: Exclude<keyof Pick, 'title'>, label: string, value: string) => (
    <label className="flex gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={pick[key]} onChange={e => setPick({ ...pick, [key]: e.target.checked })} />
      <span>
        <span className="block text-xs font-medium uppercase text-stone-500">{label}</span>
        {value}
      </span>
    </label>
  );

  return (
    <section className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> Write with AI</h2>
      {!draft ? (
        <>
          <p className="text-sm text-stone-500">Get title ideas, a description, a story and tags from the image and details. You choose what to keep.</p>
          <select className="input" value={tone} onChange={e => setTone(e.target.value as AiTone)} aria-label="Tone">
            {aiTones.map(t => <option key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)} tone</option>)}
          </select>
          <textarea className="input" rows={3} placeholder="Optional: what inspired it, materials, a feeling…" value={notes} onChange={e => setNotes(e.target.value)} />
          <button type="button" className="btn-primary w-full" disabled={generate.isPending} onClick={() => generate.mutate()}>
            {generate.isPending ? 'Writing…' : 'Draft copy'}
          </button>
        </>
      ) : (
        <>
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium uppercase text-stone-500">Title</legend>
            {[...draft.titles, null].map(t => (
              <label key={t ?? 'keep'} className="flex items-center gap-2 text-sm">
                <input type="radio" name="ai-title" checked={pick.title === t} onChange={() => setPick({ ...pick, title: t })} />
                {t ?? <span className="text-stone-500">Keep “{artwork.title}”</span>}
              </label>
            ))}
          </fieldset>
          {check('description', 'Description', draft.description)}
          {check('story', 'Story', draft.story)}
          {check('tags', 'Tags', draft.tags.join(', '))}
          {check('seoDescription', 'Search description', draft.seoDescription)}
          <p className="text-xs text-stone-500">Applying saves the ticked fields to this artwork now.</p>
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" disabled={apply.isPending} onClick={() => apply.mutate()}>Apply</button>
            <button type="button" className="btn-secondary" disabled={dismiss.isPending} onClick={() => dismiss.mutate(pending!.id)}>Dismiss</button>
          </div>
        </>
      )}
      <ErrorText error={generate.error ?? apply.error ?? dismiss.error} />
      {usage.data && (
        <p className="text-xs text-stone-400">
          AI this month: {Math.round((usage.data.usedTokens / usage.data.limitTokens) * 100)}% of allowance used
        </p>
      )}
    </section>
  );
}
