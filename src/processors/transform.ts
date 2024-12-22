import sharp from 'sharp';

/**
 * Class for performing transformations on images.
 */
export class ImageTransform {
  /**
   * Rotates the input image by a given angle.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {number} angle - The angle (in degrees) to rotate the image.
   * @returns {Promise<Buffer>} A Buffer containing the rotated image.
   */
  static async rotate(input: Buffer, angle: number): Promise<Buffer> {
    return sharp(input)
      .rotate(angle)
      .toBuffer();
  }

  /**
   * Flips the input image horizontally.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<Buffer>} A Buffer containing the horizontally flipped image.
   */
  static async flip(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .flip()
      .toBuffer();
  }

  /**
   * Flops the input image vertically.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<Buffer>} A Buffer containing the vertically flopped image.
   */
  static async flop(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .flop()
      .toBuffer();
  }

  /**
   * Crops the input image to the specified dimensions.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {number} left - The left position to start cropping.
   * @param {number} top - The top position to start cropping.
   * @param {number} width - The width of the cropped area.
   * @param {number} height - The height of the cropped area.
   * @returns {Promise<Buffer>} A Buffer containing the cropped image.
   */
  static async crop(
    input: Buffer,
    left: number,
    top: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    return sharp(input)
      .extract({ left, top, width, height })
      .toBuffer();
  }

  /**
   * Trims the input image by removing borders with a similar color.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {number} [threshold] - The threshold value to determine border color similarity (optional).
   * @returns {Promise<Buffer>} A Buffer containing the trimmed image.
   */
  static async trim(input: Buffer, threshold?: number): Promise<Buffer> {
    return sharp(input)
      .trim(threshold !== undefined ? { threshold } : undefined)
      .toBuffer();
  }
}
