import fs from 'fs/promises';
import { Sharpify } from './src';
import { ImageProcessingError } from './src/errors';

async function test() {
  try {
    // Read the test image
    const imageBuffer = await fs.readFile('test.jpg');
    console.log('Loaded test.jpg');
    
    // 1. Original functionality tests
    console.log('\n--- Testing Original Features ---');
    
    const stats = await Sharpify.Analyzer.getStats(imageBuffer);
    console.log('Image stats:', stats);

    const dominantColor = await Sharpify.Analyzer.getDominantColor(imageBuffer);
    console.log('Dominant color:', dominantColor);

    // 2. Testing Presets
    console.log('\n--- Testing Presets ---');
    
    // Apply the preset directly
    const thumbnail = await Sharpify.process(imageBuffer, { width: 300, format: 'webp' }); // Resized image
    await fs.writeFile('thumbnail.webp', thumbnail.data);
    console.log('Created thumbnail');

    const avatar = await Sharpify.process(imageBuffer, { width: 200,  format: 'jpeg' }); // Resized image
    await fs.writeFile('avatar.jpeg', avatar.data);
    console.log('Created avatar');

    const social = await Sharpify.process(imageBuffer, { width: 1200, format: 'jpeg' }); // Resized image for social media
    await fs.writeFile('social.jpeg', social.data);
    console.log('Created social media image');

    // 3. Testing Effects
    console.log('\n--- Testing Effects ---');

    const sharpened = await Sharpify.Effects.sharpen(imageBuffer);
    await fs.writeFile('sharpened_image.webp', sharpened);
    console.log('Created sharpened version');

    const enhanced = await Sharpify.Effects.adjust(
      imageBuffer,
      1.1, // brightness
      1.0, // saturation
      1.1  // contrast
    );
    await fs.writeFile('enhanced_image.webp', enhanced);
    console.log('Created enhanced version');

    // 4. Testing Radius and Watermark
    console.log('\n--- Testing Radius and Watermark ---');

    // First, resize image for the watermark to ensure compatibility
    const resizedImage = await Sharpify.process(imageBuffer, { width: 800, height: 800 });
    
    const processedWithEffects = await Sharpify.process(resizedImage.data, {
      watermark: {
        text: '© 2024',
        position: 'center',
        color: 'black',
        size: 40,
        font: 'Georgia',
      }
    });
    await fs.writeFile('processed_with_effects.webp', processedWithEffects.data);
    console.log('Created image with effects and watermark');

    // 5. Testing Error Handling
    console.log('\n--- Testing Error Handling ---');
    
    try {
      await Sharpify.process(Buffer.from(''), {});
    } catch (err) {
      if (err instanceof Error) {
        console.log('Successfully caught empty buffer error:', err.message);
      }
    }

    // Test invalid format
    try {
      await Sharpify.process(imageBuffer, { format: 'invalidformat' as any });
    } catch (err) {
      if (err instanceof Error) {
        console.log('Successfully caught invalid format error:', err.message);
      }
    }

    // Test unsupported image type (e.g., corrupted image or unsupported file format)
    try {
      await Sharpify.process(Buffer.from('notanimage'), { width: 100 });
    } catch (err) {
      if (err instanceof Error) {
        console.log('Successfully caught unsupported image error:', err.message);
      }
    }

    // 6. Testing Caching
    console.log('\n--- Testing Caching ---');
    
    console.time('First process');
    await Sharpify.process(imageBuffer, { width: 100 });
    console.timeEnd('First process');

    console.time('Cached process');
    await Sharpify.process(imageBuffer, { width: 100 });
    console.timeEnd('Cached process');

    // 7. Testing Performance
    console.log('\n--- Performance Testing ---');
    
    console.time('Process 10 images sequentially');
    for (let i = 0; i < 10; i++) {
      await Sharpify.process(imageBuffer, { width: 800, format: 'webp' });
    }
    console.timeEnd('Process 10 images sequentially');

    console.time('Process 10 images in batch');
    await Sharpify.batchProcess(Array(10).fill(imageBuffer), { width: 800, format: 'webp' });
    console.timeEnd('Process 10 images in batch');
    
  } catch (err) {
    if (err instanceof ImageProcessingError) {
      console.error('Image Processing Error:', {
        message: err.message,
        operation: err.operation,
        originalError: err.originalError?.message
      });
    } else if (err instanceof Error) {
      console.error('Unexpected Error:', err.message);
    } else {
      console.error('Unknown error occurred');
    }
  }
}

test();
