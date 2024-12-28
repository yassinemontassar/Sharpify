import sharp from 'sharp';
import { Sharpify } from '../ImageProcessor';


describe('Sharpify Tests', () => {
  let imageBuffer: Buffer;
  let multiColorImageBuffer: Buffer;

  // Constants for test parameters
  const TEST_WIDTH = 100;
  const TEST_HEIGHT = 100;
  const TEST_FORMAT = 'webp';
  const AVATAR_RADIUS = 50;

  // Utility function: Create solid color test image
  const createTestImage = async ({
    width = TEST_WIDTH,
    height = TEST_HEIGHT,
    channels = 4,
    background = { r: 255, g: 0, b: 0, alpha: 1 }, // Default red color
  } = {}) => {
    const pixels = Buffer.alloc(width * height * channels);
    for (let i = 0; i < pixels.length; i += channels) {
      pixels[i] = background.r;
      pixels[i + 1] = background.g;
      pixels[i + 2] = background.b;
      pixels[i + 3] = background.alpha * 255;
    }
    return await sharp(pixels, {
      raw: {
        width,
        height,
        channels: channels as 4 | 3 | 2 | 1 // Type assertion
      }
    })
      .png()
      .toBuffer();
    
  };

  // Utility function: Create multicolor test image
  const createMultiColorTestImage = async ({
    width = TEST_WIDTH,
    height = TEST_HEIGHT,
  } = {}) => {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .linear(1.5, -0.5)
      .composite([
        {
          input: Buffer.from(
            `<svg><rect x="0" y="0" width="${width / 2}" height="${height / 2}" fill="blue"/></svg>`
          ),
          blend: 'over',
        },
      ])
      .png()
      .toBuffer();
  };

  beforeAll(async () => {
    imageBuffer = await createTestImage();
    multiColorImageBuffer = await createMultiColorTestImage();
  });

  describe('Original Functionality', () => {
    it('should return image stats', async () => {
      const stats = await Sharpify.getStats(imageBuffer);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('width', TEST_WIDTH);
      expect(stats).toHaveProperty('height', TEST_HEIGHT);
    });

    it('should return the dominant color of the image', async () => {
      const dominantColor = await Sharpify.getDominantColor(multiColorImageBuffer);
      expect(dominantColor).toBeDefined();
      expect(dominantColor).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    });
  });

  describe('Preset Tests', () => {
    it('should create a thumbnail image', async () => {
      const thumbnail = await Sharpify.process(imageBuffer, { width: 50, format: TEST_FORMAT });
      expect(thumbnail.data).toBeDefined();
      expect(thumbnail.width).toBe(50);
      expect(thumbnail.format).toBe(TEST_FORMAT);
    });

 
  });

  describe('Effects Tests', () => {
    it('should apply sharpening effect', async () => {
      const sharpened = await Sharpify.process(imageBuffer, { sharpen: true });
      
      // Ensure the processed image has a valid buffer in 'data'
      expect(sharpened).toBeDefined();
      expect(Buffer.isBuffer(sharpened.data)).toBe(true); // Access 'data' for the buffer
    });
    

    it('should apply adjustment effect', async () => {
      const enhanced = await Sharpify.process(imageBuffer, { brightness: 1.2, contrast: 1.3 });
      
      // Ensure the processed image has a valid buffer in 'data'
      expect(enhanced).toBeDefined();
      expect(Buffer.isBuffer(enhanced.data)).toBe(true); // Access 'data' for the buffer
    });
    
  });

  describe('Error Handling Tests', () => {
    it('should handle empty buffer error', async () => {
      await expect(Sharpify.process(Buffer.from(''), {})).rejects.toThrow('Failed to process image');
    });

    it('should handle invalid format error', async () => {
      await expect(Sharpify.process(imageBuffer, { format: 'invalidformat' as any })).rejects.toThrow('Failed to process image');
    });
  });

  describe('Performance Tests', () => {
    it('should process 10 images sequentially', async () => {
      const promises = Array(10).fill(null).map(() =>
        Sharpify.process(imageBuffer, { width: TEST_WIDTH, format: TEST_FORMAT })
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.data).toBeDefined();
        expect(result.width).toBe(TEST_WIDTH);
      });
    });

    it('should process 10 images in batch', async () => {
      const results = await Sharpify.batchProcess(Array(10).fill(imageBuffer), {
        width: TEST_WIDTH,
        format: TEST_FORMAT,       
      });
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.data).toBeDefined();
        expect(result.width).toBe(TEST_WIDTH);
      });
    });
  });
});
