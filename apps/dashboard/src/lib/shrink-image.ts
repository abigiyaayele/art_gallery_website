/**
 * Hosting platforms cap request bodies (Vercel at 4.5 MB), and phone photos are
 * often bigger. Photos over the limit are scaled down in the browser before
 * upload. The largest size the site ever shows is 2400 px, so nothing visible is lost.
 */
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 3600;

export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= MAX_BYTES || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.92, 0.85, 0.75]) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_BYTES) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  }
  return file;
}
