import type { Branding, ImageMap, PageSlug, ProfileInput, SitePageInput, ThemeKey } from '@platform/contracts';

export interface StoredSettings {
  themeKey: ThemeKey;
  branding: Branding;
  seo: { title: string; description: string };
}

export interface SiteRepository {
  getProfile(tenantId: string): Promise<ProfileInput | undefined>;
  saveProfile(tenantId: string, profile: ProfileInput): Promise<void>;
  getSettings(tenantId: string): Promise<StoredSettings | undefined>;
  saveSettings(tenantId: string, settings: StoredSettings): Promise<void>;
  listPages(tenantId: string): Promise<(SitePageInput & { slug: PageSlug })[]>;
  savePage(tenantId: string, slug: PageSlug, page: SitePageInput): Promise<void>;
  tenantInfo(tenantId: string): Promise<{ name: string; slug: string; primaryHost: string } | undefined>;
}

/** Narrow view of the media module for website images. */
export interface SiteImages {
  owned(tenantId: string, ids: string[]): Promise<string[]>;
  describe(tenantId: string, ids: string[], signed: boolean): Promise<ImageMap>;
}

export interface PaymentsStatus {
  enabled(tenantId: string): Promise<boolean>;
}
