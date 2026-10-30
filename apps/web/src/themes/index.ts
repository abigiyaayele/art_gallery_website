import type { ThemeKey } from '@platform/contracts';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Every website theme, keyed by the value artists pick in the dashboard. A
 * theme is a component that renders its own routes from the site data; add a
 * new one here and to `themeKeys` in the contracts package.
 */
export const themes: Record<ThemeKey, LazyExoticComponent<ComponentType>> = {
  atelier: lazy(() => import('./atelier/AtelierSite')),
  minimal: lazy(() => import('./minimal/MinimalSite')),
};
