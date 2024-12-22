import sharp from 'sharp';

/**
 * Position options for the watermark.
 */
export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

/**
 * Class to handle watermarking operations on images.
 */
export class ImageWatermark {

  /**
   * Adds a text watermark to the image.
   * 
   * @param input - The input image buffer.
   * @param text - The text to overlay on the image.
   * @param options - Optional configuration for font, size, color, opacity, and position.
   * @returns A Promise that resolves to the image buffer with the watermark applied.
   */
  static async addText(
    input: Buffer,
    text: string,
    {
      font = 'Arial',
      size = 24,
      color = 'white',
      opacity = 1,
      position = 'bottom-right' // Default position
    }: {
      font?: string;
      size?: number;
      color?: string;
      opacity?: number;
      position?: WatermarkPosition; // Using the union type for position
    } = {}
  ): Promise<Buffer> {
    const image = sharp(input);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to determine image dimensions. Please check the image input.');
    }

    // Generate the SVG markup for the text watermark
    const svg = this.generateTextSVG(metadata.width, metadata.height, text, font, size, color, opacity, position);

    return image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      }])
      .toBuffer();
  }

  /**
   * Generates the SVG markup for a text watermark.
   * 
   * @param width - The image width.
   * @param height - The image height.
   * @param text - The text for the watermark.
   * @param font - The font of the watermark text.
   * @param size - The font size.
   * @param color - The color of the watermark text.
   * @param opacity - The opacity of the watermark text.
   * @param position - The position of the watermark on the image.
   * @returns The SVG markup as a string.
   */
  private static generateTextSVG(
    width: number,
    height: number,
    text: string,
    font: string,
    size: number,
    color: string,
    opacity: number,
    position: WatermarkPosition // Using the WatermarkPosition type here
  ): string {
    const textWidth = size * text.length / 2; // Approximate text width based on font size and text length
    const xPosition = this.getXPosition(position, width, textWidth);
    const yPosition = this.getYPosition(position, height, size);

    return `
      <svg width="${width}" height="${height}">
        <style>
          .text {
            font-family: ${font};
            font-size: ${size}px;
            fill: ${color};
            fill-opacity: ${opacity};
          }
        </style>
        <text
          x="${xPosition}"
          y="${yPosition}"
          class="text"
        >${text}</text>
      </svg>
    `;
  }

  /**
   * Calculates the X position for the text based on the desired position.
   * 
   * @param position - The position of the watermark (left, right, center).
   * @param width - The width of the image.
   * @param textWidth - The width of the text to be overlayed.
   * @returns The X position of the watermark.
   */
  private static getXPosition(position: WatermarkPosition, width: number, textWidth: number): number {
    if (position.includes('left')) {
      return 10; // 10px from the left edge
    } 
    if (position.includes('right')) {
      return width - textWidth - 10; // 10px from the right edge
    }
    return (width - textWidth) / 2; // Centered horizontally
  }

  /**
   * Calculates the Y position for the text based on the desired position.
   * 
   * @param position - The position of the watermark (top, bottom, center).
   * @param height - The height of the image.
   * @param fontSize - The font size of the text.
   * @returns The Y position of the watermark.
   */
  private static getYPosition(position: WatermarkPosition, height: number, fontSize: number): number {
    if (position.includes('top')) {
      return fontSize + 10; // 10px from the top edge
    }
    if (position.includes('bottom')) {
      return height - 10; // 10px from the bottom edge
    }
    return height / 2; // Centered vertically
  }
}
