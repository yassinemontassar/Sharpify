import sharp from 'sharp';
import { ImageCache } from './cache'; // Import ImageCache class
import { ImageProcessingError } from './errors'; // Import ImageProcessingError class
import { ImageStats, ProcessedImage, WatermarkPosition } from './types';

type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export class Sharpify {
  private static imageCache = new ImageCache(); // Instantiate cache

  private constructor() {} // Prevent instantiation

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
      };
    } = {}
  ): Promise<ProcessedImage> {
    try {
      // Check cache first
      const cacheKey = JSON.stringify({ input, options });
      const cachedImage = this.imageCache.get(cacheKey);
      if (cachedImage) {
        return cachedImage; // Return cached result if available
      }

      let pipeline = sharp(input);

      // Apply resizing or cropping
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height);
      }
      if (options.crop) {
        pipeline = pipeline.extract({
          left: options.crop.left,
          top: options.crop.top,
          width: options.crop.width,
          height: options.crop.height,
        });
      }

      // Apply effects
      if (options.blur) pipeline = pipeline.blur(options.blur);
      if (options.sharpen) pipeline = pipeline.sharpen();
      if (options.grayscale) pipeline = pipeline.grayscale();
      if (options.tint) pipeline = pipeline.tint(options.tint);

      // Adjust brightness, saturation, and contrast
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

      // Transformations
      if (options.rotate) pipeline = pipeline.rotate(options.rotate);
      if (options.flip) pipeline = pipeline.flip();
      if (options.flop) pipeline = pipeline.flop();

      // Add watermark
      if (options.watermark) {
        const watermarked = await this.addWatermark(
          await pipeline.toBuffer(),
          options.watermark.text,
          options.watermark
        );
        pipeline = sharp(watermarked);
      }

      // Change format
      if (options.format) {
        pipeline = pipeline.toFormat(options.format, {
          quality: options.quality || 80,
        });
      }

      // Process the image
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

      // Cache the result before returning
      this.imageCache.set(cacheKey, processedImage);

      return processedImage;
    } catch (error) {
      throw new ImageProcessingError('Failed to process image', error as Error, 'process');
    }
  }

  private static async addWatermark(
    input: Buffer,
    text: string,
    {
      font = 'Arial',
      size = 24,
      color = 'white',
      opacity = 1,
      position = 'bottom-right',
    }: {
      font?: string;
      size?: number;
      color?: string;
      opacity?: number;
      position?: WatermarkPosition;
    }
  ): Promise<Buffer> {
    try {
      const image = sharp(input);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to determine image dimensions');
      }

      const svg = this.generateWatermarkSVG(
        metadata.width,
        metadata.height,
        text,
        font,
        size,
        color,
        opacity,
        position
      );

      return image
        .composite([{
          input: Buffer.from(svg),
          top: 0,
          left: 0,
        }])
        .toBuffer();
    } catch (error) {
      throw new ImageProcessingError('Failed to add watermark to image', error as Error, 'addWatermark');
    }
  }

  private static generateWatermarkSVG(
    width: number,
    height: number,
    text: string,
    font: string,
    size: number,
    color: string,
    opacity: number,
    position: WatermarkPosition
  ): string {
    const padding = 10;
    const { x, y } = this.getWatermarkPosition(
      width,
      height,
      text.length * size / 2,
      size,
      position,
      padding
    );

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .text {
            font-family: ${font};
            font-size: ${size}px;
            fill: ${color};
            fill-opacity: ${opacity};
            dominant-baseline: middle;
            text-anchor: middle;
          }
        </style>
        <text x="${x}" y="${y}" class="text">${text}</text>
      </svg>
    `;
  }

  private static getWatermarkPosition(
    imageWidth: number,
    imageHeight: number,
    textWidth: number,
    fontSize: number,
    position: WatermarkPosition,
    padding: number
  ): { x: number; y: number } {
    let x: number = imageWidth / 2;
    let y: number = imageHeight / 2;

    const effectivePadding = padding + fontSize / 4;

    if (position.includes('top')) {
      y = fontSize + effectivePadding;
    } else if (position.includes('bottom')) {
      y = imageHeight - effectivePadding;
    }

    if (position.includes('left')) {
      x = textWidth / 2 + effectivePadding;
    } else if (position.includes('right')) {
      x = imageWidth - textWidth / 2 - effectivePadding;
    }

    return { x, y };
  }

  static async batchProcess(
    inputs: Buffer[],
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
      };
    } = {}
  ): Promise<ProcessedImage[]> {
    try {
      // Process each image in parallel
      const promises = inputs.map(input => this.process(input, options));
      return Promise.all(promises); // Returns an array of processed images
    } catch (error) {
      throw new ImageProcessingError('Batch image processing failed', error as Error, 'batchProcess');
    }
  }
}
