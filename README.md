# Sharpify

A powerful TypeScript library for image processing built on top of Sharp. Sharpify provides an intuitive interface for common image manipulation tasks with built-in caching and error handling.

[![npm version](https://img.shields.io/npm/v/sharpify.svg)](https://www.npmjs.com/package/sharpify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Repository

Find the source code and documentation on GitHub:

[https://github.com/yassinemontassar/Sharpify](https://github.com/yassinemontassar/Sharpify)
## Requirements

- Node.js >= 18
- TypeScript >= 5.3
- Sharp >= 0.33

## Features

- 🖼️ Comprehensive image processing capabilities
- 🚀 Built-in image caching for improved performance
- 🎨 Advanced color manipulation and effects
- 💧 Watermark support with customizable positioning
- 📏 Flexible resizing and cropping options
- 🎯 Batch processing support
- 💪 Strong TypeScript support
- 🐛 Robust error handling

## Installation

```bash
npm install sharpify
# or
yarn add sharpify
# or
pnpm add sharpify
```

## Quick Start

```typescript
import { Sharpify } from 'sharpify';
import { readFileSync } from 'fs';

// Read an image
const imageBuffer = readFileSync('input.jpg');

// Process the image
const processed = await Sharpify.process(imageBuffer, {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 80,
  grayscale: true
});

// Access the processed image data
console.log(processed.metadata);
```
## Type Definitions

Sharpify provides several TypeScript types and interfaces to make development easier. You can import these types directly from the library:

```typescript
/**
 * Represents metadata and details of an image.
 */
export interface ImageStats {
  /** Size of the image file in bytes */
  size: number;
  /** Format of the image (e.g., 'jpeg', 'png') */
  format: string;
  /** Width of the image in pixels */
  width: number;
  /** Height of the image in pixels */
  height: number;
  /** Aspect ratio calculated as width / height */
  aspectRatio: number;
  /** Indicates if the image contains an alpha channel */
  hasAlpha: boolean;
  /** Color space of the image (e.g., 'srgb') */
  colorSpace: string;
  /** Number of color channels in the image */
  channels: number;
  /** Compression details, if applicable */
  compression?: unknown;
}

/**
 * Defines available positions for the watermark.
 */
export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

/**
 * Specifies font options for watermark text.
 */
export type WatermarkFont =
  | 'Arial'
  | 'Helvetica'
  | 'Times New Roman'
  | 'Courier New'
  | 'Verdana'
  | 'Georgia'
  | 'Custom'; // For custom fonts, you could specify any font family name

/**
 * Options for customizing image processing behavior.
 */
export interface ImageProcessorOptions {
  width?: number; // Desired output width of the image in pixels
  height?: number; // Desired output height of the image in pixels
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; // Resizing method
  position?: WatermarkPosition; // Position for cropping or watermarking
  background?: { r: number; g: number; b: number; alpha: number }; // Background color
  radius?: number; // Radius for rounded corners
  blur?: number; // Blur intensity
  sharpen?: boolean; // Apply sharpening
  grayscale?: boolean; // Convert to grayscale
  rotate?: number; // Rotation angle
  flip?: boolean; // Vertical flip
  flop?: boolean; // Horizontal flip
  tint?: string; // Tint color
  brightness?: number; // Adjust brightness
  saturation?: number; // Adjust saturation
  contrast?: number; // Adjust contrast
  format?: 'jpeg' | 'png' | 'webp' | 'avif'; // Output format
  quality?: number; // Compression quality (1-100)
  watermark?: {
    text: string; // Watermark text
    font?: WatermarkFont; // Font family
    size?: number; // Font size
    color?: string; // Text color
    opacity?: number; // Text opacity (0-1)
    position?: WatermarkPosition; // Watermark position
  };
}

/**
 * Represents a processed image and its details.
 */
export interface ProcessedImage {
  data: Buffer; // Image data as a buffer
  format: string; // Format of the processed image
  width: number; // Width in pixels
  height: number; // Height in pixels
  size: number; // Size in bytes
  metadata: {
    hasAlpha?: boolean; // Alpha channel presence
    isAnimated: boolean; // Indicates if the image is animated
    pages?: number; // Number of pages or frames
    compression?: unknown; // Compression details
    colorSpace?: string; // Color space
  };
}

## API Reference

### `Sharpify.process(input: Buffer, options?: ProcessOptions): Promise<ProcessedImage>`

Process a single image with various options.

#### Options

```typescript
{
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;                    // 1-100
  width?: number;                      // output width
  height?: number;                     // output height
  crop?: {                            // crop coordinates
    left: number;
    top: number;
    width: number;
    height: number;
  };
  blur?: number;                       // blur radius
  sharpen?: boolean;                   // apply sharpening
  grayscale?: boolean;                 // convert to grayscale
  rotate?: number;                     // rotation angle
  flip?: boolean;                      // vertical flip
  flop?: boolean;                      // horizontal flip
  tint?: string;                       // color tint
  brightness?: number;                 // adjust brightness
  saturation?: number;                 // adjust saturation
  contrast?: number;                   // adjust contrast
  watermark?: {
    text: string;                      // watermark text
    font?: string;                     // font family
    size?: number;                     // font size
    color?: string;                    // text color
    opacity?: number;                  // 0-1
    position?: WatermarkPosition;      // positioning
  };
}
```

#### Return Value (ProcessedImage)

```typescript
{
  data: Buffer;              // processed image buffer
  format: string;            // output format
  width: number;            // output width
  height: number;           // output height
  size: number;            // file size in bytes
  metadata: {
    hasAlpha: boolean;     // alpha channel presence
    isAnimated: boolean;   // animation status
    pages?: number;        // number of pages/frames
    compression?: string;  // compression type
    colorSpace?: string;   // color space
  };
}
```

### `Sharpify.getStats(input: Buffer): Promise<ImageStats>`

Get detailed statistics about an image.

```typescript
const stats = await Sharpify.getStats(imageBuffer);
console.log(stats);
// {
//   size: number,
//   format: string,
//   width: number,
//   height: number,
//   aspectRatio: number,
//   hasAlpha: boolean,
//   colorSpace: string,
//   channels: number,
//   compression?: string
// }
```

### `Sharpify.getDominantColor(input: Buffer): Promise<string>`

Extract the dominant color from an image.

```typescript
const color = await Sharpify.getDominantColor(imageBuffer);
console.log(color); // Returns RGB format, e.g., "rgb(123, 45, 67)"
```

### `Sharpify.batchProcess(inputs: Buffer[], options?: ProcessOptions): Promise<ProcessedImage[]>`

Process multiple images in parallel with the same options.

```typescript
const images = [buffer1, buffer2, buffer3];
const processed = await Sharpify.batchProcess(images, {
  format: 'webp',
  quality: 80
});
```

## Examples

### Basic Image Resizing

```typescript
const processed = await Sharpify.process(imageBuffer, {
  width: 800,
  height: 600
});
```

### Format Conversion with Quality Control

```typescript
const processed = await Sharpify.process(imageBuffer, {
  format: 'webp',
  quality: 85
});
```

### Adding a Watermark

```typescript
const processed = await Sharpify.process(imageBuffer, {
  watermark: {
    text: '© 2024 My Company',
    position: 'bottom-right',
    size: 24,
    color: 'white',
    opacity: 0.8
  }
});
```

### Advanced Image Enhancement

```typescript
const processed = await Sharpify.process(imageBuffer, {
  brightness: 1.2,
  contrast: 1.1,
  saturation: 1.3,
  sharpen: true
});
```

## Error Handling

Sharpify provides detailed error information through the `ImageProcessingError` class:

```typescript
try {
  const processed = await Sharpify.process(imageBuffer, options);
} catch (error) {
  if (error instanceof ImageProcessingError) {
    console.error(`Operation: ${error.operation}`);
    console.error(`Message: ${error.message}`);
    console.error(`Original Error: ${error.originalError}`);
  }
}
```

## Performance Considerations

- The library implements automatic caching of processed images to improve performance for repeated operations
- Batch processing is performed in parallel for optimal performance
- Memory usage scales with image size and number of concurrent operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Yassine Montassar - [LinkedIn](https://www.linkedin.com/in/yassine-montassar-7aa3ab283/)