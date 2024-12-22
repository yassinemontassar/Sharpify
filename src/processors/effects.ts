import sharp from 'sharp';

/**
 * Class for applying various effects to images.
 */
export class ImageEffects {
  /**
   * Applies a blur effect to the input image.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {number} sigma - The sigma value to control the blur intensity.
   * @returns {Promise<Buffer>} A Buffer containing the blurred image.
   */
  static async blur(input: Buffer, sigma: number): Promise<Buffer> {
    return sharp(input)
      .blur(sigma)
      .toBuffer();
  }

  /**
   * Applies a sharpen effect to the input image.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<Buffer>} A Buffer containing the sharpened image.
   */
  static async sharpen(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .sharpen()
      .toBuffer();
  }

  /**
   * Converts the input image to grayscale.
   * @param {Buffer} input - The input image as a Buffer.
   * @returns {Promise<Buffer>} A Buffer containing the grayscale image.
   */
  static async grayscale(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .grayscale()
      .toBuffer();
  }

  /**
   * Applies a tint color to the input image.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {string} color - The color to apply as the tint (e.g., 'red', '#ff0000').
   * @returns {Promise<Buffer>} A Buffer containing the tinted image.
   */
  static async tint(input: Buffer, color: string): Promise<Buffer> {
    return sharp(input)
      .tint(color)
      .toBuffer();
  }

  /**
   * Adjusts the brightness, saturation, and contrast of the input image.
   * @param {Buffer} input - The input image as a Buffer.
   * @param {number} [brightness] - The brightness factor (optional).
   * @param {number} [saturation] - The saturation factor (optional).
   * @param {number} [contrast] - The contrast factor (optional).
   * @returns {Promise<Buffer>} A Buffer containing the adjusted image.
   */
  static async adjust(
    input: Buffer,
    brightness?: number,
    saturation?: number,
    contrast?: number
  ): Promise<Buffer> {
    let pipeline = sharp(input);

    // Apply modulate if brightness or saturation are provided
    if (typeof brightness === 'number' || typeof saturation === 'number') {
      pipeline = pipeline.modulate({
        brightness,
        saturation
      });
    }

    // Apply linear contrast adjustment if contrast is provided
    if (typeof contrast === 'number') {
      pipeline = pipeline.linear(
        contrast, // multiply
        -(contrast - 1) * 128 // offset to maintain middle gray
      );
    }

    return pipeline.toBuffer();
  }
}
