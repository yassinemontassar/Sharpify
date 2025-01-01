import { Sharpify } from './ImageProcessor';
import { ImageProcessingError } from './errors';
import { ProcessedImage } from './types';

export async function batchProcess(
  inputs: Buffer[],
  options: Parameters<typeof Sharpify.process>[1] = {}
): Promise<ProcessedImage[]> {
  try {
    const promises = inputs.map(input => Sharpify.process(input, options));
    return Promise.all(promises);
  } catch (error) {
    throw new ImageProcessingError('Batch image processing failed', error as Error, 'batchProcess');
  }
}
