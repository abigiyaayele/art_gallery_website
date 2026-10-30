import type { DomainDto, ImageMap, ProfileDto, SitePageDto, SiteSettingsDto } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useSiteSettings() {
  return useQuery({ queryKey: ['site', 'settings'], queryFn: () => api<SiteSettingsDto>('/site/settings') });
}

export function useSitePages() {
  return useQuery({
    queryKey: ['site', 'pages'],
    queryFn: () => api<{ pages: SitePageDto[]; images: ImageMap }>('/site/pages'),
    select: d => d.pages,
  });
}

export function useProfile() {
  return useQuery({ queryKey: ['site', 'profile'], queryFn: () => api<ProfileDto>('/site/profile') });
}

/** Saves one part of the site and refreshes it. */
export function useSaveSite<T>(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: T) => api(path, { method: 'PUT', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site'] }),
  });
}

/** Address of the artist's live website, from their primary domain. */
export function useSiteUrl() {
  const domains = useQuery({ queryKey: ['domains'], queryFn: () => api<DomainDto[]>('/workspace/domains') });
  const host = domains.data?.find(d => d.isPrimary)?.hostname;
  if (!host) return null;
  const port = import.meta.env.VITE_SITE_PORT as string | undefined;
  return `${window.location.protocol}//${host}${port ? `:${port}` : ''}`;
}
