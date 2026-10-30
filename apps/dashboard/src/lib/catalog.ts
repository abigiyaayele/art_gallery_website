import type { ArtworkDto, ArtworkStatus, AssetDto, CategoryDto, Page } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useArtworks(params: { status?: ArtworkStatus; categoryId?: string; onSale?: boolean; q?: string } = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  return useQuery({
    queryKey: ['artworks', params],
    queryFn: () => api<Page<ArtworkDto>>(`/artworks?${search}`),
  });
}

export function useArtwork(id: string | undefined) {
  return useQuery({ queryKey: ['artwork', id], queryFn: () => api<ArtworkDto>(`/artworks/${id}`), enabled: !!id });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api<CategoryDto[]>('/categories') });
}

export function useMedia(kind?: 'artwork' | 'site') {
  return useQuery({
    queryKey: ['media', kind],
    queryFn: () => api<AssetDto[]>(`/media${kind ? `?kind=${kind}` : ''}`),
    // Keep polling while something is still being processed.
    refetchInterval: q => (q.state.data?.some(a => a.status === 'processing') ? 1500 : false),
  });
}

export async function uploadFile(file: File, kind: 'artwork' | 'site' = 'artwork') {
  const form = new FormData();
  form.append('file', file);
  return api<AssetDto>(`/media?kind=${kind}`, { method: 'POST', body: form });
}

export type StatusAction = 'publish' | 'unpublish' | 'mark-sold' | 'revert-sold';

/** Invalidates every artwork view after a change, so lists and the editor stay in step. */
export function useArtworkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: StatusAction }) => api<ArtworkDto>(`/artworks/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artworks'] });
      qc.invalidateQueries({ queryKey: ['artwork'] });
    },
  });
}

export const statusTone = (s: ArtworkStatus) => (s === 'available' ? 'green' : s === 'sold' ? 'red' : 'stone') as 'green' | 'red' | 'stone';
export const statusLabel = (s: ArtworkStatus) => (s === 'available' ? 'Published' : s === 'sold' ? 'Sold' : 'Draft');
