import {
  pageSlugs,
  themeKeySchema,
  type PageSlug,
  type ProfileDto,
  type ProfileInput,
  type PublicSiteDto,
  type SitePageDto,
  type SitePageInput,
  type SiteSettingsDto,
  type SiteSettingsInput,
} from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { NotFoundError, ValidationError } from '../../../shared/errors.js';
import { blockImageIds, defaultPages } from '../domain/defaults.js';
import type { PaymentsStatus, SiteImages, SiteRepository, StoredSettings } from './ports.js';

export const CHECKOUT_HOLD_MINUTES = 15;

class SiteService {
  constructor(
    readonly repo: SiteRepository,
    readonly images: SiteImages,
  ) {}

  async assertOwned(tenantId: string, ids: (string | null | undefined)[]) {
    const wanted = [...new Set(ids.filter((x): x is string => !!x))];
    if ((await this.images.owned(tenantId, wanted)).length !== wanted.length) throw new ValidationError('One or more images were not found');
  }

  async profile(tenantId: string): Promise<ProfileInput> {
    const p = await this.repo.getProfile(tenantId);
    if (!p) throw new NotFoundError('Profile');
    return p;
  }

  async settings(tenantId: string): Promise<StoredSettings> {
    const s = await this.repo.getSettings(tenantId);
    if (!s) throw new NotFoundError('Site settings');
    return s;
  }

  /** Stored pages merged over the defaults, so every page slug always exists. */
  async pages(tenantId: string, siteTitle: string): Promise<SitePageDto[]> {
    const stored = new Map((await this.repo.listPages(tenantId)).map(p => [p.slug, p]));
    const defaults = defaultPages(siteTitle);
    return pageSlugs.map(slug => ({ slug, ...(stored.get(slug) ?? defaults[slug]) }));
  }
}

export function createSiteService(repo: SiteRepository, images: SiteImages) {
  return new SiteService(repo, images);
}
type Svc = SiteService;

export class GetProfile {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor): Promise<ProfileDto> {
    assertCan(actor, 'workspace:read');
    const profile = await this.s.profile(actor.tenantId);
    const images = await this.s.images.describe(actor.tenantId, profile.photoAssetId ? [profile.photoAssetId] : [], true);
    return { ...profile, photoUrl: profile.photoAssetId ? (images[profile.photoAssetId]?.url ?? null) : null };
  }
}

export class UpdateProfile {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, input: ProfileInput) {
    assertCan(actor, 'site:write');
    await this.s.assertOwned(actor.tenantId, [input.photoAssetId]);
    await this.s.repo.saveProfile(actor.tenantId, input);
  }
}

export class GetSiteSettings {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor): Promise<SiteSettingsDto> {
    assertCan(actor, 'workspace:read');
    const settings = await this.s.settings(actor.tenantId);
    const logo = settings.branding.logoAssetId;
    const images = await this.s.images.describe(actor.tenantId, logo ? [logo] : [], true);
    return { ...settings, logoUrl: logo ? (images[logo]?.url ?? null) : null };
  }
}

export class UpdateSiteSettings {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, input: SiteSettingsInput) {
    assertCan(actor, 'site:write');
    await this.s.assertOwned(actor.tenantId, [input.branding.logoAssetId]);
    await this.s.repo.saveSettings(actor.tenantId, input);
  }
}

export class ListPages {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    const settings = await this.s.settings(actor.tenantId);
    const pages = await this.s.pages(actor.tenantId, settings.branding.siteTitle);
    const images = await this.s.images.describe(actor.tenantId, pages.flatMap(p => blockImageIds(p.blocks)), true);
    return { pages, images };
  }
}

export class SavePage {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, slug: PageSlug, input: SitePageInput) {
    assertCan(actor, 'site:write');
    await this.s.assertOwned(actor.tenantId, blockImageIds(input.blocks));
    await this.s.repo.savePage(actor.tenantId, slug, input);
  }
}

/** Everything a tenant's website needs to render, in one cacheable response. */
export class GetPublicSite {
  constructor(
    private readonly s: Svc,
    private readonly payments: PaymentsStatus,
  ) {}

  async execute(tenantId: string): Promise<PublicSiteDto> {
    const [info, profile, settings] = await Promise.all([this.s.repo.tenantInfo(tenantId), this.s.profile(tenantId), this.s.settings(tenantId)]);
    if (!info) throw new NotFoundError('Site');
    const siteTitle = settings.branding.siteTitle || info.name;
    const pages = await this.s.pages(tenantId, siteTitle);
    const ids = [...pages.filter(p => p.enabled).flatMap(p => blockImageIds(p.blocks)), settings.branding.logoAssetId, profile.photoAssetId].filter(
      (x): x is string => !!x,
    );
    const images = await this.s.images.describe(tenantId, ids, false);
    const { photoAssetId, ...publicProfile } = profile;
    const parsedTheme = themeKeySchema.safeParse(settings.themeKey);
    return {
      tenant: { name: info.name, slug: info.slug },
      primaryHost: info.primaryHost,
      themeKey: parsedTheme.success ? parsedTheme.data : 'minimal',
      branding: {
        ...settings.branding,
        siteTitle,
        logoUrl: settings.branding.logoAssetId ? (images[settings.branding.logoAssetId]?.url ?? null) : null,
      },
      seo: { title: settings.seo.title || siteTitle, description: settings.seo.description || profile.tagline },
      profile: { ...publicProfile, photoUrl: photoAssetId ? (images[photoAssetId]?.url ?? null) : null },
      pages: pages.filter(p => p.enabled),
      images,
      shop: { paymentsEnabled: await this.payments.enabled(tenantId), holdMinutes: CHECKOUT_HOLD_MINUTES },
    };
  }
}
