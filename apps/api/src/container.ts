import type { Config } from './shared/config.js';
import { SecretBox } from './shared/crypto/secret-box.js';
import * as analytics from './modules/analytics/application/use-cases.js';
import { KyselyAnalyticsRepository } from './modules/analytics/infrastructure/analytics-repository.js';
import type { PaymentProvider } from './modules/commerce/application/ports.js';
import * as commerce from './modules/commerce/application/use-cases.js';
import { ChapaProvider } from './modules/commerce/infrastructure/chapa-provider.js';
import { KyselyOrderRepository, KyselySecretStore } from './modules/commerce/infrastructure/order-repository.js';
import * as inquiries from './modules/inquiries/application/use-cases.js';
import { KyselyArtworkLookup, KyselyInquiryRepository } from './modules/inquiries/infrastructure/repositories.js';
import type { SiteImages } from './modules/site/application/ports.js';
import * as site from './modules/site/application/use-cases.js';
import { KyselySiteRepository } from './modules/site/infrastructure/site-repository.js';
import type { Db } from './shared/db/database.js';
import { InlineJobQueue, PgBossJobQueue, type JobQueue } from './shared/jobs/queue.js';
import type { ImageMap } from '@platform/contracts';
import type { ArtworkImages } from './modules/catalog/application/ports.js';
import { ArtworkPresenter } from './modules/catalog/application/presenter.js';
import * as catalog from './modules/catalog/application/use-cases.js';
import {
  CatalogAssetVisibility,
  KyselyArtworkRepository,
  KyselyCategoryRepository,
} from './modules/catalog/infrastructure/repositories.js';
import { SessionIssuer } from './modules/identity/application/session-issuer.js';
import * as identity from './modules/identity/application/use-cases.js';
import { Argon2Hasher, JoseAccessTokenService } from './modules/identity/infrastructure/crypto.js';
import {
  KyselyMembershipRepository,
  KyselyRefreshTokenRepository,
  KyselyUserRepository,
} from './modules/identity/infrastructure/repositories.js';
import type { AssetVisibility, ObjectStorage } from './modules/media/application/ports.js';
import { AssetUrlSigner } from './modules/media/application/url-signer.js';
import * as media from './modules/media/application/use-cases.js';
import { KyselyAssetRepository } from './modules/media/infrastructure/asset-repository.js';
import { MemoryObjectStorage, S3ObjectStorage } from './modules/media/infrastructure/object-storage.js';
import { SharpImageProcessor } from './modules/media/infrastructure/sharp-image-processor.js';
import * as tenancy from './modules/tenancy/application/use-cases.js';
import { KyselyDomainRepository, KyselyTenantRepository } from './modules/tenancy/infrastructure/repositories.js';

export interface Infrastructure {
  storage: ObjectStorage;
  jobs: JobQueue;
  payments: PaymentProvider;
}

export function defaultInfrastructure(config: Config): Infrastructure {
  return {
    storage:
      config.STORAGE_DRIVER === 'memory'
        ? new MemoryObjectStorage()
        : new S3ObjectStorage({
            endpoint: config.S3_ENDPOINT,
            region: config.S3_REGION,
            accessKeyId: config.S3_ACCESS_KEY,
            secretAccessKey: config.S3_SECRET_KEY,
            bucket: config.S3_BUCKET,
          }),
    jobs: config.JOB_DRIVER === 'inline' ? new InlineJobQueue() : new PgBossJobQueue(config.DATABASE_URL),
    payments: new ChapaProvider(config.CHAPA_API_URL),
  };
}

/**
 * Composition root: the one place that picks concrete adapters for each port
 * and wires use cases. Tests pass in-memory infrastructure.
 */
export function buildContainer(config: Config, db: Db, infra: Infrastructure = defaultInfrastructure(config)) {
  const { storage, jobs, payments } = infra;

  // Identity
  const users = new KyselyUserRepository(db);
  const memberships = new KyselyMembershipRepository(db);
  const refreshTokens = new KyselyRefreshTokenRepository(db);
  const hasher = new Argon2Hasher();
  const tokens = new JoseAccessTokenService(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_SECONDS);
  const issuer = new SessionIssuer(memberships, refreshTokens, tokens, config.ACCESS_TOKEN_TTL_SECONDS, config.REFRESH_TOKEN_TTL_DAYS);

  // Tenancy
  const tenants = new KyselyTenantRepository(db);
  const domains = new KyselyDomainRepository(db);
  const resolver = new tenancy.TenantResolver(domains);

  // Media
  const assets = new KyselyAssetRepository(db);
  const imageProcessor = new SharpImageProcessor();
  const signer = new AssetUrlSigner(config.JWT_SECRET, config.PUBLIC_API_URL);
  const assetPresenter = new media.AssetPresenter(signer);
  const catalogVisibility = new CatalogAssetVisibility(db);
  // Site images (logo, portrait) are public by nature; artwork images only once published.
  const visibility: AssetVisibility = {
    isPublic: async a => a.kind === 'site' || (await catalogVisibility.isPublicArtworkImage(a.id)),
    isInUse: (tenantId, id) => catalogVisibility.isUsedByArtwork(tenantId, id),
  };
  const processAsset = new media.ProcessAsset(assets, storage, imageProcessor);
  jobs.register(media.PROCESS_ASSET_JOB, (data: { assetId: string }) => processAsset.execute(data));
  const readyCounter = new media.ReadyImageCounter(assets);

  // Catalog, reading images through a narrow port onto media
  const artworkImages: ArtworkImages = {
    owned: async (tenantId, ids) => {
      const found = new Set((await assets.findMany(tenantId, ids)).map(a => a.id));
      return ids.filter(id => found.has(id));
    },
    countReady: (tenantId, ids) => readyCounter.count(tenantId, ids),
    describe: async (tenantId, ids, signed) =>
      new Map((await assets.findMany(tenantId, ids)).map(a => [a.id, assetPresenter.toDto(a, signed)])),
  };
  const artworkService = catalog.createArtworkService(
    new KyselyArtworkRepository(db),
    new KyselyCategoryRepository(db),
    artworkImages,
    new ArtworkPresenter(artworkImages),
  );

  // Website content
  const siteImages: SiteImages = {
    owned: artworkImages.owned,
    describe: async (tenantId, ids, signed) => {
      const map: ImageMap = {};
      for (const a of await assets.findMany(tenantId, ids)) {
        const dto = assetPresenter.toDto(a, signed);
        if (dto.urls.large) map[a.id] = { url: dto.urls.large, thumb: dto.urls.thumb ?? dto.urls.large, alt: a.altText, width: a.width, height: a.height };
      }
      return map;
    },
  };
  const paymentCredentials = new commerce.PaymentCredentials(new KyselySecretStore(db), new SecretBox(config.ENCRYPTION_KEY));
  const siteRepo = new KyselySiteRepository(db);
  const siteService = site.createSiteService(siteRepo, siteImages);

  // Commerce: reads prices from the catalog and records sales through it.
  const recordSale = new catalog.RecordArtworkSale(artworkService);
  const orders = new KyselyOrderRepository(db);
  const checkout = commerce.createCheckoutService(
    orders,
    payments,
    paymentCredentials,
    {
      findForSale: async (tenantId, slug) => {
        const a = await artworkService.artworks.findPublicBySlug(tenantId, slug);
        if (!a) return undefined;
        return { id: a.id, title: a.snapshot.title, status: a.status, effectiveCents: a.price?.effectiveCents ?? null, currency: a.snapshot.currency };
      },
      recordSale: (tenantId, id) => recordSale.execute(tenantId, id),
    },
    { info: id => siteRepo.tenantInfo(id) },
    {
      siteUrl: host => config.SITE_URL_TEMPLATE.replace('{host}', host),
      webhookUrl: tenantId => `${config.PUBLIC_API_URL}/payments/webhook/chapa/${tenantId}`,
    },
  );
  const confirmPayment = new commerce.ConfirmPayment(checkout);
  const inquiryRepo = new KyselyInquiryRepository(db);
  const analyticsRepo = new KyselyAnalyticsRepository(db);

  return {
    config,
    jobs,
    storage,
    tokens,
    resolver,
    identity: {
      login: new identity.Login(users, hasher, issuer),
      refresh: new identity.RefreshSession(users, refreshTokens, issuer),
      logout: new identity.Logout(refreshTokens),
      switchTenant: new identity.SwitchTenant(users, memberships, issuer),
      me: new identity.GetSessionUser(users, memberships),
      changePassword: new identity.ChangePassword(users, hasher, refreshTokens),
      listMembers: new identity.ListMembers(memberships),
      addMember: new identity.AddMember(users, memberships, hasher),
      removeMember: new identity.RemoveMember(memberships),
    },
    tenancy: {
      onboard: new tenancy.OnboardTenant(tenants, domains, users, hasher, config.PLATFORM_DOMAIN),
      listTenants: new tenancy.ListTenants(tenants),
      setStatus: new tenancy.SetTenantStatus(tenants, resolver),
      current: new tenancy.GetCurrentTenant(tenants),
      listDomains: new tenancy.ListDomains(domains),
      addDomain: new tenancy.AddDomain(domains, resolver, config.PLATFORM_DOMAIN),
      removeDomain: new tenancy.RemoveDomain(domains, resolver),
    },
    media: {
      upload: new media.UploadAsset(assets, storage, imageProcessor, jobs, assetPresenter),
      list: new media.ListAssets(assets, assetPresenter),
      update: new media.UpdateAsset(assets, assetPresenter),
      remove: new media.DeleteAsset(assets, storage, visibility),
      serve: new media.ServeAsset(assets, storage, visibility, signer),
    },
    catalog: {
      create: new catalog.CreateArtwork(artworkService),
      update: new catalog.UpdateArtwork(artworkService),
      remove: new catalog.DeleteArtwork(artworkService),
      status: new catalog.ChangeArtworkStatus(artworkService),
      bulk: new catalog.BulkUpdateArtworks(artworkService),
      get: new catalog.GetArtwork(artworkService),
      list: new catalog.ListArtworks(artworkService),
      listCategories: new catalog.ListCategories(artworkService.categories),
      saveCategory: new catalog.SaveCategory(artworkService.categories),
      deleteCategory: new catalog.DeleteCategory(artworkService.categories),
      recordSale,
      public: new catalog.PublicCatalog(artworkService),
    },
    site: {
      getProfile: new site.GetProfile(siteService),
      updateProfile: new site.UpdateProfile(siteService),
      getSettings: new site.GetSiteSettings(siteService),
      updateSettings: new site.UpdateSiteSettings(siteService),
      listPages: new site.ListPages(siteService),
      savePage: new site.SavePage(siteService),
      publicSite: new site.GetPublicSite(siteService, paymentCredentials),
    },
    commerce: {
      checkout: new commerce.StartArtworkCheckout(checkout),
      deposit: new commerce.StartDepositCheckout(checkout),
      confirm: confirmPayment,
      webhook: new commerce.HandlePaymentWebhook(checkout, confirmPayment),
      publicStatus: new commerce.GetPublicOrderStatus(confirmPayment),
      listOrders: new commerce.ListOrders(orders),
      updateOrder: new commerce.UpdateOrder(orders),
      getPaymentSettings: new commerce.GetPaymentSettings(paymentCredentials, checkout.urls),
      savePaymentSettings: new commerce.SavePaymentSettings(paymentCredentials),
      removePaymentSettings: new commerce.RemovePaymentSettings(paymentCredentials),
    },
    inquiries: {
      submit: new inquiries.SubmitInquiry(inquiryRepo, new KyselyArtworkLookup(db)),
      list: new inquiries.ListInquiries(inquiryRepo),
      update: new inquiries.UpdateInquiry(inquiryRepo),
    },
    analytics: {
      recordView: new analytics.RecordPageView(analyticsRepo),
      overview: new analytics.GetOverview(analyticsRepo),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
