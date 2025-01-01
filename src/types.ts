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
 * Position options for the watermark.
 */
export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

/**
 * Font options for the watermark text.
 */
export type WatermarkFont =
  | 'Arial'
  | 'Helvetica'
  | 'Times New Roman'
  | 'Courier New'
  | 'system-ui'
  | 'Verdana'
  | 'Georgia'
  | 'Custom'; // For custom fonts, you could specify any font family name

/**
 * Supported image formats.
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';

/**
 * Options for customizing image processing behavior.
 */
export interface ImageProcessorOptions {
  /** Desired output width of the image in pixels */
  width?: number;
  /** Desired output height of the image in pixels */
  height?: number;
  /** Resizing method to apply */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  /** Position to use for cropping or watermarking */
  position?: WatermarkPosition;
  /** Background color for padding or transparency replacement */
  background?: { r: number; g: number; b: number; alpha: number };
  /** Radius of the rounded corners to apply to the image */
  radius?: number;
  /** Blur intensity to apply to the image */
  blur?: number;
  /** Whether to apply a sharpening filter */
  sharpen?: boolean;
  /** Convert the image to grayscale if true */
  grayscale?: boolean;
  /** Rotate the image by a specified angle in degrees */
  rotate?: number;
  /** Flip the image vertically if true */
  flip?: boolean;
  /** Flip the image horizontally if true */
  flop?: boolean;
  /** Tint color to apply to the image */
  tint?: string;
  /** Adjust brightness of the image */
  brightness?: number;
  /** Adjust saturation of the image */
  saturation?: number;
  /** Adjust contrast of the image */
  contrast?: number;
  /** Output format of the image */
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  /** Quality of the image compression (1-100) */
  quality?: number;
  /** Crop options for the image */
  crop?: { left: number; top: number; width: number; height: number };
  /** Custom aspect ratio for cropping (width / height) */
  aspectRatio?: number;
  /** Watermark options for the image */
  watermark?: {
    /** Text to display as a watermark */
    text: string;
    /** Font family for the watermark text */
    font?: WatermarkFont;
    /** Font size for the watermark text */
    size?: number;
    /** Color of the watermark text */
    color?: string;
    /** Opacity of the watermark text (0-1) */
    opacity?: number;
    /** Position of the watermark on the image */
    position?: WatermarkPosition;
  };
}

/**
 * Options for creating an avatar.
 */
export interface AvatarOptions {
  /** Desired size of the avatar in pixels */
  size?: number;
}

/**
 * Represents a processed image and its details.
 */
export interface ProcessedImage {
  /** Buffer containing the image data */
  data: Buffer;
  /** Format of the processed image (e.g., 'jpeg', 'png') */
  format: string;
  /** Width of the processed image in pixels */
  width: number;
  /** Height of the processed image in pixels */
  height: number;
  /** Size of the processed image in bytes */
  size: number;
  /** Metadata associated with the processed image */
  metadata: {
    /** Indicates if the image has an alpha channel */
    hasAlpha?: boolean;
    /** Indicates if the image is animated (e.g., GIF) */
    isAnimated: boolean;
    /** Number of pages in the image, if applicable */
    pages?: number;
    /** Compression details, if applicable */
    compression?: unknown;
    /** Color space of the processed image */
    colorSpace?: string;
  };
}

/**
 * Cache entry for storing processed images and metadata.
 */
export interface CacheEntry {
  /** Timestamp of when the image was cached */
  timestamp: number;
  /** Processed image result */
  result: ProcessedImage;
}
