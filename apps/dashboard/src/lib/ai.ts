import type { AiSuggestionDto, AiUsageDto } from '@platform/contracts';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useAiUsage() {
  return useQuery({ queryKey: ['ai', 'usage'], queryFn: () => api<AiUsageDto>('/ai/usage') });
}

export function useSuggestions(filter: { artworkId?: string; kind?: AiSuggestionDto['kind'] }) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v) as [string, string][]).toString();
  return useQuery({ queryKey: ['ai', 'suggestions', filter], queryFn: () => api<AiSuggestionDto[]>(`/ai/suggestions${qs ? `?${qs}` : ''}`) });
}
