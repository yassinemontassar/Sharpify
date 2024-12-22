export class ImageProcessingError extends Error {
    constructor(
      message: string,
      public readonly originalError?: Error,
      public readonly operation?: string
    ) {
      super(message);
      this.name = 'ImageProcessingError';
    }
  }