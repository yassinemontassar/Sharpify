import sharp from 'sharp';
import { ImageStats } from '../types';

/**
 * Class for analyzing image properties and metadata.
 */
export class ImageAnalyzer {
  /**
   * Analyzes the input image and returns its statistics.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<ImageStats>} An object containing the image statistics.
   */
  static async getStats(input: Buffer): Promise<ImageStats> {
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
  }

  /**
   * Extracts the dominant color from the input image.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<string>} The dominant color in `rgb(r, g, b)` format.
   */
  static async getDominantColor(input: Buffer): Promise<string> {
    const { dominant } = await sharp(input).stats();

    return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
  }

  /**
   * Checks if the input image is animated (e.g., an animated GIF).
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<boolean>} True if the image is animated, false otherwise.
   */
  static async isAnimated(input: Buffer): Promise<boolean> {
    const metadata = await sharp(input).metadata();
    return metadata.pages ? metadata.pages > 1 : false;
  }
}
