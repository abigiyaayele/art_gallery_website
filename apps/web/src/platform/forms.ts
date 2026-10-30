import type { InquiryInput } from '@platform/contracts';
import { platform } from './api';

/** Reads a submitted form's fields as trimmed strings. */
export function readForm(formEl: HTMLFormElement) {
  const form = new FormData(formEl);
  return (key: string) => String(form.get(key) ?? '').trim();
}

/**
 * Sends a contact or commission request to the artist's dashboard inbox.
 * `website` is the hidden honeypot field every atelier form carries.
 */
export async function sendInquiry(input: {
  kind: InquiryInput['kind'];
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  details?: Record<string, string>;
  artworkSlug?: string;
  website?: string;
}) {
  const details = Object.fromEntries(Object.entries(input.details ?? {}).filter(([, v]) => v));
  await platform.inquiry({ ...input, details, artworkSlug: input.artworkSlug || undefined, website: input.website || undefined });
}
