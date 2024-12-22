import { CacheEntry, ProcessedImage } from './types';

/**
 * Class to manage an in-memory cache for processed images.
 */
export class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly maxAge: number;

  /**
   * Creates a new image cache instance.
   * 
   * @param maxSize - Maximum number of items the cache can hold (default is 100).
   * @param maxAge - Maximum age in milliseconds of the cache items (default is 1 hour).
   */
  constructor(maxSize = 100, maxAge = 3600000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Sets a new cache entry or updates an existing one.
   * If the cache exceeds the maximum size, the oldest entry is removed.
   * 
   * @param key - The cache key.
   * @param value - The processed image to store.
   */
  set(key: string, value: ProcessedImage): void {
    // Check if cache exceeds the maximum size and delete the oldest item if necessary
    if (this.cache.size >= this.maxSize) {
      this.removeOldestEntry();
    }

    this.cache.set(key, {
      timestamp: Date.now(),
      result: value
    });
  }

  /**
   * Retrieves an image from the cache if it's not expired.
   * 
   * @param key - The cache key.
   * @returns The cached processed image, or undefined if not found or expired.
   */
  get(key: string): ProcessedImage | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // If the entry has expired, remove it from the cache and return undefined
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  /**
   * Removes the oldest entry from the cache.
   * This is used when the cache exceeds its maximum size.
   */
  private removeOldestEntry(): void {
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    // Find the oldest entry in the cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    // Remove the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clears all entries in the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
