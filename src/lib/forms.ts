import { isStrapiConfigured, strapiClient } from './strapi';
import { site } from '../data/site';

export type SubmitResult = 'saved' | 'emailed';

/**
 * Sends a form submission. With Strapi configured it is saved to the given
 * collection (uploading an optional file first). Without a backend it falls
 * back to opening the visitor's email app with the details filled in.
 */
export async function submitForm(
  collection: string,
  subject: string,
  data: Record<string, string>,
  file?: { field: string; value: File | null },
): Promise<SubmitResult> {
  if (isStrapiConfigured) {
    const payload: Record<string, unknown> = { ...data };
    if (file?.value) {
      payload[file.field] = await strapiClient.uploadFile(file.value);
    }
    await strapiClient.createItem(collection, payload);
    return 'saved';
  }

  const body = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return 'emailed';
}
