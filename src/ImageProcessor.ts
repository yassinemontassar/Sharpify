import sharp from 'sharp';
import { createAvatar } from './avatar';
import { batchProcess } from './batchProcess';
import { ImageCache } from './cache';
import { ImageProcessingError } from './errors';
import { ImageFormat, ImageStats, ProcessedImage, WatermarkPosition } from './types';
import { addWatermark } from './watermark';

export class Sharpify {
  private static imageCache = new ImageCache();

  private constructor() {}

  static async getStats(input: Buffer): Promise<ImageStats> {
    try {
      const metadata = await sharp(input).metadata();
      return {
        size: metadata.size || 0,
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        aspectRatio: (metadata.width || 0) / (metadata.height || 1),
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        channels: metadata.channels || 0,
        compression: metadata.compression,
      };
    } catch (error) {
      throw new ImageProcessingError('Failed to retrieve image metadata', error as Error, 'getStats');
    }
  }

  static async getDominantColor(input: Buffer): Promise<string> {
    try {
      const { dominant } = await sharp(input).stats();
      return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
    } catch (error) {
      throw new ImageProcessingError('Failed to get dominant color', error as Error, 'getDominantColor');
    }
  }

  static async process(
    input: Buffer,
    options: {
      format?: ImageFormat;
      quality?: number;
      width?: number;
      height?: number;
      crop?: { left: number; top: number; width: number; height: number };
      blur?: number;
      sharpen?: boolean;
      grayscale?: boolean;
      rotate?: number;
      flip?: boolean;
      flop?: boolean;
      tint?: string;
      brightness?: number;
      saturation?: number;
      contrast?: number;
      watermark?: {
        text: string;
        font?: string;
        size?: number;
        color?: string;
        opacity?: number;
        position?: WatermarkPosition;
        background?: boolean;
        padding?: number;
      };
      aspectRatio?: number;
    } = {}
  ): Promise<ProcessedImage> {
    try {
      const cacheKey = JSON.stringify({ input, options });
      const cachedImage = this.imageCache.get(cacheKey);
      if (cachedImage) {
        return cachedImage;
      }

      let pipeline = sharp(input);
      pipeline = this.applyProcessingOptions(pipeline, options);

      if (options.watermark) {
        const watermarked = await addWatermark(
          await pipeline.toBuffer(),
          options.watermark.text,
          options.watermark
        );
        pipeline = sharp(watermarked);
      }

      if (options.format) {
        try {
          pipeline = pipeline.toFormat(options.format, { quality: options.quality });
        } catch (error) {
          throw new ImageProcessingError('Invalid image format', error as Error, 'process');
        }
      }

      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
      const metadata = await sharp(data).metadata();

      const processedImage: ProcessedImage = {
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

      this.imageCache.set(cacheKey, processedImage);
      return processedImage;
    } catch (error) {
      throw new ImageProcessingError('Failed to process image', error as Error, 'process');
    }
  }

  private static applyProcessingOptions(
    pipeline: sharp.Sharp,
    options: {
      width?: number;
      height?: number;
      crop?: { left: number; top: number; width: number; height: number };
      blur?: number;
      sharpen?: boolean;
      grayscale?: boolean;
      rotate?: number;
      flip?: boolean;
      flop?: boolean;
      tint?: string;
      brightness?: number;
      saturation?: number;
      contrast?: number;
      aspectRatio?: number;
    }
  ): sharp.Sharp {
    if (options.aspectRatio && options.width) {
      const aspectRatio = options.aspectRatio;
      const width = options.width;
      const height = Math.round(width / aspectRatio);
      pipeline = pipeline.resize(width, height);
    } else {
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height);
      }
    }

    if (options.crop) {
      pipeline = pipeline.extract(options.crop);
    }

    if (options.blur) pipeline = pipeline.blur(options.blur);
    if (options.sharpen) pipeline = pipeline.sharpen();
    if (options.grayscale) pipeline = pipeline.grayscale();
    if (options.tint) pipeline = pipeline.tint(options.tint);

    if (
      typeof options.brightness === 'number' ||
      typeof options.saturation === 'number'
    ) {
      const modulateOptions: { brightness?: number; saturation?: number } = {};
      if (typeof options.brightness === 'number') modulateOptions.brightness = options.brightness;
      if (typeof options.saturation === 'number') modulateOptions.saturation = options.saturation;
      pipeline = pipeline.modulate(modulateOptions);
    }
    if (typeof options.contrast === 'number') {
      pipeline = pipeline.linear(options.contrast, -(options.contrast - 1) * 128);
    }

    if (options.rotate) pipeline = pipeline.rotate(options.rotate);
    if (options.flip) pipeline = pipeline.flip();
    if (options.flop) pipeline = pipeline.flop();

    return pipeline;
  }

  static async createAvatar(input: Buffer, options: { size?: number } = {}): Promise<ProcessedImage> {
    try {
      const avatar = await createAvatar(input, options);
      return avatar;
    } catch (error) {
      throw new ImageProcessingError('Failed to create avatar', error as Error, 'createAvatar');
    }
  }

  static async batchProcess(
    inputs: Buffer[],
    options: Parameters<typeof Sharpify.process>[1] = {}
  ): Promise<ProcessedImage[]> {
    return batchProcess(inputs, options);
  }

}