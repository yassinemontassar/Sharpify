// errors.ts
export class ImageProcessingError extends Error {
  // Additional custom properties for error context
  public functionName: string;
  public originalError: Error;

  constructor(message: string, error: Error, functionName: string) {
    super(message);  // Pass message to parent Error class
    this.name = 'ImageProcessingError';  // Set the error type
    this.functionName = functionName;    // Store the function name where the error happened
    this.originalError = error;         // Store the original error (if any)

    // Capture the stack trace, which can be useful for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageProcessingError);
    }
  }
}
