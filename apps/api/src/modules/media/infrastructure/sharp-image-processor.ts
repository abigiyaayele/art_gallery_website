import sharp from 'sharp';
import type { ImageProcessor } from '../application/ports.js';

export class SharpImageProcessor implements ImageProcessor {
  async inspect(input: Buffer) {
    try {
      const meta = await sharp(input).metadata();
      // EXIF orientations 5-8 swap width and height once the image is rotated upright.
      const swap = (meta.orientation ?? 1) >= 5;
      return { format: meta.format, width: swap ? meta.height : meta.width, height: swap ? meta.width : meta.height };
    } catch {
      return undefined;
    }
  }

  async variant(input: Buffer, maxEdge: number) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  }
}
