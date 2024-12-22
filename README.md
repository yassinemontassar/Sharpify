# Sharpify

A TypeScript library for image processing using Sharp, providing a simple and efficient interface for common image operations while maintaining high performance and quality.

## Requirements

- Node.js >= 18
- TypeScript >= 5.3
- Sharp >= 0.33

## Installation

```bash
npm install sharpify
```

## Features

- 🖼️ **Basic Image Operations**
  - Resize images with preset dimensions
  - Convert between formats (JPEG, PNG, WebP, AVIF)
  - Adjust image quality and compression
  - Create thumbnails and avatars

- 🎨 **Image Effects**
  - Sharpen images
  - Adjust brightness, contrast, and saturation
  - Apply blur effects
  - Rotate and flip images
  - Grayscale conversion

- 🔍 **Image Analysis**
  - Get image statistics and metadata
  - Extract dominant colors
  - Analyze image characteristics

- ⚡ **Performance Features**
  - Built-in caching system
  - Batch processing support
  - Memory-efficient operations
  - Queue management for large batches

## Usage

```typescript
import { Sharpify } from 'sharpify';

// Basic image processing
const processImage = async (inputBuffer: Buffer) => {
  const processed = await Sharpify.process(inputBuffer, {
    width: 800,
    format: 'webp',
    quality: 80
  });
  
  return processed.data;
};

// Create an avatar with circular crop
const createAvatar = async (inputBuffer: Buffer) => {
  const avatar = await Sharpify.process(inputBuffer, {
    width: 200,
    format: 'jpeg',
    radius: true
  });
  
  return avatar.data;
};

// Analyze image colors
const analyzeImage = async (inputBuffer: Buffer) => {
  const stats = await Sharpify.Analyzer.getStats(inputBuffer);
  const dominantColor = await Sharpify.Analyzer.getDominantColor(inputBuffer);
  
  return { stats, dominantColor };
};
```

## API Reference

### Sharpify.process(input, options)

Main method to process images with various options.

```typescript
interface SharpifyOptions {
  // Dimensions
  width?: number;
  height?: number;
  
  // Format options
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  
  // Fit and positioning
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left';
  background?: string;
  
  // Effects
  radius?: boolean | number;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  
  // Adjustments
  brightness?: number;
  saturation?: number;
  contrast?: number;
}
```

### Sharpify.Effects

Namespace containing image effect operations.

```typescript
// Sharpen an image
const sharpened = await Sharpify.Effects.sharpen(imageBuffer);

// Adjust image properties
const adjusted = await Sharpify.Effects.adjust(
  imageBuffer,
  1.1, // brightness
  1.0, // saturation
  1.1  // contrast
);
```

### Sharpify.Analyzer

Namespace containing image analysis operations.

```typescript
// Get image statistics
const stats = await Sharpify.Analyzer.getStats(imageBuffer);

// Get dominant color
const color = await Sharpify.Analyzer.getDominantColor(imageBuffer);
```

### Sharpify.batchProcess

Process multiple images with the same options.

```typescript
const images = [/* array of image buffers */];
const results = await Sharpify.batchProcess(images, {
  width: 800,
  format: 'webp'
});
```

## Error Handling

The library uses custom error types for better error handling:

```typescript
try {
  const processed = await Sharpify.process(imageBuffer, options);
} catch (error) {
  if (error instanceof SharpifyError) {
    console.error('Processing failed:', error.message);
    console.error('Operation:', error.operation);
  }
}
```

## Development

### Setup

1. Clone the repository
```bash
git clone https://github.com/yassinemontassar/Sharpify-
cd Sharpify-
```

2. Install dependencies:
```bash
npm install
```

### Scripts

- `npm run build` - Build the project
- `npm test` - Run tests
- `npm run prepare` - Prepare for publishing

### Testing

The library uses Jest for testing. Run the test suite:

```bash
npm test
```

## Performance Tips

- Use WebP format for best compression/quality ratio
- Enable caching for repeated operations
- Use batch processing for multiple images
- Consider image dimensions and quality settings for optimal file size

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

Yassine Montassar
- LinkedIn: [Yassine Montassar](https://www.linkedin.com/in/yassine-montassar-7aa3ab283/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Dependencies

### Runtime Dependencies
- sharp: ^0.33.2

### Development Dependencies
- @types/jest: ^29.5.11
- @types/node: ^20.11.5
- @types/sharp: ^0.31.1
- jest: ^29.7.0
- ts-jest: ^29.1.1
- typescript: ^5.3.3
