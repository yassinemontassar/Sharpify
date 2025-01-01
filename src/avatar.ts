import sharp from 'sharp';
import { ProcessedImage } from './types';

export async function createAvatar(
  input: Buffer,
  options: { size?: number } = {}
): Promise<ProcessedImage> {
  try {
    const size = options.size || 100;
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size / 2}" ry="${size / 2}"/></svg>`
    );

    const pipeline = sharp(input)
      .resize(size, size)
      .composite([{ input: roundedCorners, blend: 'dest-in' }])
      .png({ quality: 100, compressionLevel: 9 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const metadata = await sharp(data).metadata();

    return {
      data,
      format: info.format,
      width: info.width,
      height: info.height,
      size: info.size,
      metadata: {
        hasAlpha: metadata.hasAlpha || false,
        isAnimated: metadata.pages ? metadata.pages > 1 : false,
        pages: metadata.pages,
        compression: metadata.compression,
        colorSpace: metadata.space,
      },
    };
  } catch (error) {
    throw new Error('Failed to create avatar');
  }
}
