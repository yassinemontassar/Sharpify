import sharp from 'sharp';
import { ImageCache } from './cache';
import { ImageProcessingError } from './errors';
import { ImageAnalyzer } from './processors/analyze';
import { ImageEffects } from './processors/effects';
import { ImageTransform } from './processors/transform';
import { ImageWatermark } from './processors/watermark';
import { ImageProcessorOptions, ProcessedImage } from './types';

// Define a custom type for the valid image formats
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export class Sharpify  {
  private static readonly cache = new ImageCache();
  private static queue: Array<{
    input: Buffer | string;
    options: ImageProcessorOptions;
    resolve: (result: ProcessedImage) => void;
    reject: (error: Error) => void;
  }> = [];
  private static isProcessing = false;

  // Removed the PRESETS constant and processWithPreset method

  private static validateInput(input: Buffer | string): void {
    if (input instanceof Buffer && input.length === 0) {
      throw new ImageProcessingError('Empty buffer provided');
    }
    if (typeof input === 'string' && !input.trim()) {
      throw new ImageProcessingError('Empty string provided');
    }
  }

  private static getCacheKey(input: Buffer | string, options: ImageProcessorOptions): string {
    const inputHash = typeof input === 'string' ? input : input.toString('base64').slice(0, 32);
    return `${inputHash}-${JSON.stringify(options)}`;
  }

  private static async safeExecute<T>(
    operation: string,
    func: () => Promise<T>
  ): Promise<T> {
    try {
      return await func();
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to ${operation}`,
        error as Error, // Cast error to Error
        operation
      );
    }
  }

  // Convert method with strict type for 'format'
  public static async convert(
    input: Buffer | string,
    format: ImageFormat, // Ensure only valid formats are allowed
    quality: number = 80
  ): Promise<ProcessedImage> {
    return this.safeExecute('convert image', async () => {
      // Validate input (e.g., if it's empty or invalid)
      this.validateInput(input);

      // Process the image with the provided format and quality
      return this.process(input, { format, quality });
    });
  }

  public static async process(
    input: Buffer | string,
    options: ImageProcessorOptions = {}
  ): Promise<ProcessedImage> {
    return this.safeExecute('process image', async () => {
      this.validateInput(input);

      const cacheKey = this.getCacheKey(input, options);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      let pipeline = sharp(input);

      // Apply transformations
      if (options.width || options.height) {
        pipeline = pipeline.resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
          position: options.position,
          background: options.background
        });
      }

      // Apply effects
      if (options.blur) pipeline = pipeline.blur(options.blur);
      if (options.sharpen) pipeline = pipeline.sharpen();
      if (options.grayscale) pipeline = pipeline.grayscale();
      if (options.rotate) pipeline = pipeline.rotate(options.rotate);
      if (options.flip) pipeline = pipeline.flip();
      if (options.flop) pipeline = pipeline.flop();
      if (options.tint) pipeline = pipeline.tint(options.tint);

      // Handle brightness and saturation
      if (options.brightness || options.saturation) {
        pipeline = pipeline.modulate({
          brightness: options.brightness,
          saturation: options.saturation
        });
      }

      // Handle contrast separately
      if (options.contrast) {
        pipeline = pipeline.linear(
          options.contrast,
          -(options.contrast - 1) * 128
        );
      }

      // Add watermark if specified
      if (options.watermark) {
        const watermarked = await ImageWatermark.addText(
          await pipeline.toBuffer(),
          options.watermark.text,
          options.watermark
        );
        pipeline = sharp(watermarked);
      }

      // Apply avatar (circular crop) if specified
      if (options.radius) {
        const metadata = await sharp(input).metadata();
        const size = Math.min(metadata.width!, metadata.height!);  // Get the smaller dimension
        const radius = size / 2;  // Calculate the radius for the circle mask

        const circleMask = Buffer.from(
          `<svg width="${size}" height="${size}">
             <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="white"/>
           </svg>`
        );

        pipeline = pipeline.composite([{ input: circleMask, blend: 'dest-in' }]);
      }

      // Convert format if specified
      if (options.format) {
        pipeline = pipeline.toFormat(options.format, {
          quality: options.quality
        });
      }

      // Process the image
      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
      const metadata = await sharp(data).metadata();

      const result: ProcessedImage = {
        data,
        format: info.format,
        width: info.width,
        height: info.height,
        size: info.size,
        metadata: {
          hasAlpha: metadata.hasAlpha,
          isAnimated: metadata.pages ? metadata.pages > 1 : false,
          pages: metadata.pages,
          compression: metadata.compression,
          colorSpace: metadata.space
        }
      };

      this.cache.set(cacheKey, result);
      return result;
    });
  }

  // Expose individual processors
  public static Effects = ImageEffects;
  public static Transform = ImageTransform;
  public static Watermark = ImageWatermark;
  public static Analyzer = ImageAnalyzer;

  public static async getMetadata(input: Buffer | string) {
    return this.safeExecute('get metadata', async () => {
      const buffer = input instanceof Buffer ? input : await sharp(input).toBuffer(); // Await the promise
      return ImageAnalyzer.getStats(buffer);
    });
  }

  public static async batchProcess(
    inputs: Array<Buffer | string>,
    options: ImageProcessorOptions = {}
  ): Promise<ProcessedImage[]> {
    return Promise.all(inputs.map(input => this.queueProcess(input, options)));
  }

  private static async queueProcess(
    input: Buffer | string,
    options: ImageProcessorOptions
  ): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, options, resolve, reject });
      this.processQueue();
    });
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { input, options, resolve, reject } = this.queue.shift()!;

    try {
      const result = await this.process(input, options);
      resolve(result);
    } catch (error) {
      reject(error as Error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}
