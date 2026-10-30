import type { InquiryDto, InquiryInput } from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { NotFoundError } from '../../../shared/errors.js';

export interface InquiryRepository {
  create(tenantId: string, i: Omit<InquiryDto, 'id' | 'status' | 'createdAt'>): Promise<void>;
  list(tenantId: string, status?: InquiryDto['status']): Promise<InquiryDto[]>;
  setStatus(tenantId: string, id: string, status: InquiryDto['status']): Promise<boolean>;
}

export interface ArtworkLookup {
  idForSlug(tenantId: string, slug: string): Promise<string | undefined>;
}

/** A website visitor sends a message, commission request or purchase question. */
export class SubmitInquiry {
  constructor(
    private readonly repo: InquiryRepository,
    private readonly artworks: ArtworkLookup,
  ) {}

  async execute(tenantId: string, input: InquiryInput) {
    // Bots fill the hidden field; accept silently so they learn nothing.
    if (input.website) return;
    const artworkId = input.artworkSlug ? ((await this.artworks.idForSlug(tenantId, input.artworkSlug)) ?? null) : null;
    await this.repo.create(tenantId, {
      kind: input.kind,
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      details: input.details,
      artworkId,
    });
  }
}

export class ListInquiries {
  constructor(private readonly repo: InquiryRepository) {}

  async execute(actor: Actor, status?: InquiryDto['status']) {
    assertCan(actor, 'orders:manage');
    return this.repo.list(actor.tenantId, status);
  }
}

export class UpdateInquiry {
  constructor(private readonly repo: InquiryRepository) {}

  async execute(actor: Actor, id: string, status: InquiryDto['status']) {
    assertCan(actor, 'orders:manage');
    if (!(await this.repo.setStatus(actor.tenantId, id, status))) throw new NotFoundError('Inquiry');
  }
}
