import sharp from 'sharp';
import { ImageCache } from './cache';
import { ImageProcessingError } from './errors';
import { ImageStats, ProcessedImage, WatermarkPosition } from './types';

type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

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
    } = {}
  ): Promise<ProcessedImage> {
    try {
      const cacheKey = JSON.stringify({ input, options });
      const cachedImage = this.imageCache.get(cacheKey);
      if (cachedImage) {
        return cachedImage;
      }

      let pipeline = sharp(input);

      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height);
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

      if (options.watermark) {
        const watermarked = await this.addWatermark(
          await pipeline.toBuffer(),
          options.watermark.text,
          options.watermark
        );
        pipeline = sharp(watermarked);
      }

      if (options.format) {
        pipeline = pipeline.toFormat(options.format, {
          quality: options.quality || 80,
        });
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

  private static async addWatermark(
    input: Buffer,
    text: string,
    {
      font = 'system-ui',
      size = 24,
      color = 'white',
      opacity = 1,
      position = 'bottom-right',
      background = true,
      padding = 20
    }: {
      font?: string;
      size?: number;
      color?: string;
      opacity?: number;
      position?: WatermarkPosition;
      background?: boolean;
      padding?: number;
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
        {
          font,
          size,
          color,
          opacity,
          position,
          background,
          padding
        }
      );

      return image
        .composite([{
          input: Buffer.from(svg),
          blend: 'over'
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
    {
      font,
      size,
      color,
      opacity,
      position,
      background,
      padding
    }: {
      font: string;
      size: number;
      color: string;
      opacity: number;
      position: WatermarkPosition;
      background: boolean;
      padding: number;
    }
  ): string {
    const estimatedTextWidth = text.length * (size * 0.6);
    const { x, y } = this.getWatermarkPosition(
      width,
      height,
      estimatedTextWidth,
      size,
      position,
      padding
    );
  
    const textAnchor = position.includes('right') ? 'end' : 
                      position.includes('center') ? 'middle' : 
                      'start';
  
    // Simplified font stack without @font-face
    const fontStack = `${font}, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif`;
  
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <g filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))">
          ${background ? `
            <rect
              x="${x - (textAnchor === 'end' ? estimatedTextWidth : textAnchor === 'middle' ? estimatedTextWidth/2 : 0) - padding/2}"
              y="${y - size - padding/2}"
              width="${estimatedTextWidth + padding}"
              height="${size + padding}"
              fill="rgba(0,0,0,0.3)"
              rx="3"
              ry="3"
            />
          ` : ''}
          <text
            x="${x}"
            y="${y}"
            font-family="${fontStack}"
            font-size="${size}px"
            fill="${color}"
            fill-opacity="${opacity}"
            text-anchor="${textAnchor}"
            dominant-baseline="text-after-edge"
            textLength="${estimatedTextWidth}"
            lengthAdjust="spacingAndGlyphs"
          >${text}</text>
        </g>
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
    let x: number;
    let y: number;

    if (position.includes('top')) {
      y = padding + fontSize;
    } else if (position.includes('bottom')) {
      y = imageHeight - padding;
    } else {
      y = imageHeight / 2;
    }

    if (position.includes('left')) {
      x = padding;
    } else if (position.includes('right')) {
      x = imageWidth - padding;
    } else {
      x = imageWidth / 2;
    }

    return { x, y };
  }

  static async batchProcess(
    inputs: Buffer[],
    options: Parameters<typeof Sharpify.process>[1] = {}
  ): Promise<ProcessedImage[]> {
    try {
      const promises = inputs.map(input => this.process(input, options));
      return Promise.all(promises);
    } catch (error) {
      throw new ImageProcessingError('Batch image processing failed', error as Error, 'batchProcess');
    }
  }
}