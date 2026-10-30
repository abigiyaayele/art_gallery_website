import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SiteProvider, useSite } from './platform/SiteProvider';
import { useBranding, usePageViews } from './platform/useSiteEffects';
import { themes } from './themes';

function Status({ error }: { error: Error | null }) {
  const notFound = (error as { status?: number } | null)?.status === 404;
  return (
    <div className="flex h-dvh items-center justify-center bg-bg p-6 text-center text-sm text-text-muted">
      {!error ? 'Loading…' : notFound ? 'There is no artist site at this address.' : 'This site could not be loaded. Please try again in a moment.'}
    </div>
  );
}

function ThemedSite() {
  const { site } = useSite();
  useBranding(site);
  usePageViews();

  useEffect(() => {
    document.documentElement.dataset.theme = site.themeKey;
  }, [site.themeKey]);

  const Theme = themes[site.themeKey] ?? themes.atelier;
  return (
    <Suspense fallback={<Status error={null} />}>
      <Theme />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider fallback={error => <Status error={error} />}>
        <ThemedSite />
      </SiteProvider>
    </BrowserRouter>
  );
}
