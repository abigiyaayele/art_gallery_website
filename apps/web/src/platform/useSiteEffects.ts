import type { PublicSiteDto } from '@platform/contracts';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { platform } from './api';

/** Applies the artist's branding (colours, fonts, title, description) to the document. */
export function useBranding(site: PublicSiteDto) {
  useEffect(() => {
    const root = document.documentElement.style;
    const { colors, headingFont, bodyFont } = site.branding;
    const set = (name: string, value: string | undefined) => (value ? root.setProperty(name, value) : root.removeProperty(name));
    set('--brand-bg', colors.background);
    set('--brand-text', colors.text);
    set('--brand-accent', colors.accent);
    set('--brand-heading-font', headingFont ? `"${headingFont}", serif` : undefined);
    set('--brand-body-font', bodyFont ? `"${bodyFont}", sans-serif` : undefined);

    const fonts = [headingFont, bodyFont].filter(Boolean);
    let link = document.getElementById('brand-fonts') as HTMLLinkElement | null;
    if (fonts.length) {
      link ??= Object.assign(document.createElement('link'), { id: 'brand-fonts', rel: 'stylesheet' });
      link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f!)}:wght@400;600;700`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }

    document.title = site.seo.title;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    meta ??= Object.assign(document.createElement('meta'), { name: 'description' });
    meta.content = site.seo.description;
    document.head.appendChild(meta);
  }, [site]);
}

/** Counts page views for the artist's overview page; no cookies, no visitor data. */
export function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    void platform.view(location.pathname);
  }, [location.pathname]);
}

export function usePageTitle(site: PublicSiteDto, title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.branding.siteTitle}` : site.seo.title;
  }, [site, title]);
}
