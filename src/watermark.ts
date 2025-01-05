import sharp from 'sharp';
import { ImageProcessingError } from './errors';
import { WatermarkPosition } from './types';

export async function addWatermark(
  input: Buffer,
  text: string,
  {
    font = 'system-ui',
    size = 24,
    color = 'white',
    opacity = 1,
    position = 'bottom-right'
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

    const svg = generateWatermarkSVG(
      metadata.width,
      metadata.height,
      text,
      {
        font,
        size,
        color,
        opacity,
        position
      }
    );

    console.log('Generated SVG:', svg);
    return image
      .composite([{
        input: Buffer.from(svg),
        blend: 'over'
      }])
      .toBuffer();
  } catch (error) {
    console.error('Error in addWatermark:', error);
    throw new ImageProcessingError('Failed to add watermark to image', error as Error, 'addWatermark');
  }
}

export function generateWatermarkSVG(
  width: number,
  height: number,
  text: string,
  {
    font,
    size,
    color,
    opacity,
    position
  }: {
    font: string;
    size: number;
    color: string;
    opacity: number;
    position: WatermarkPosition;
  }
): string {
  const estimatedTextWidth = text.length * (size * 0.6);
  const { x, y } = getWatermarkPosition(
    width,
    height,
    estimatedTextWidth,
    size,
    position
  );

  const textAnchor = position.includes('right') ? 'end' : 
                    position.includes('center') ? 'middle' : 
                    'start';

  const fontStack = `${font}, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif`;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
    </svg>
  `;
}

export function getWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  textWidth: number,
  fontSize: number,
  position: WatermarkPosition
): { x: number; y: number } {
  let x: number;
  let y: number;

  if (position.includes('top')) {
    y = fontSize;
  } else if (position.includes('bottom')) {
    y = imageHeight;
  } else {
    y = imageHeight / 2;
  }

  if (position.includes('left')) {
    x = 0;
  } else if (position.includes('right')) {
    x = imageWidth;
  } else {
    x = imageWidth / 2;
  }

  return { x, y };
}


