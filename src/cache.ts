import { LRUCache } from 'lru-cache';
import type {
  PaymentRecord,
  CacheOptions,
  CacheStats
} from './types.js';

/**
 * PaymentCache provides a memory-safe storage layer for payment transactions.
 * It uses an LRU (Least Recently Used) eviction policy and TTL (Time-To-Live)
 * to prevent unbounded memory growth and ensure stale data is removed.
 */
export class PaymentCache {
  private readonly cache: LRUCache<string, PaymentRecord>;

  /**
   * Initializes the cache with strict bounds.
   * @param options Configuration for max items and expiration.
   */
  constructor(options: CacheOptions) {
    this.cache = new LRUCache<string, PaymentRecord>({
      max: options.max,
      ttl: options.ttl,
      allowStale: options.allowStale ?? false,
      updateAgeOnGet: options.updateAgeOnGet ?? false,
    });
  }

  /**
   * Retrieves a payment record from the cache.
   * @param transactionId The unique identifier for the transaction.
   * @returns The record if found and not expired, otherwise undefined.
   */
  public get(transactionId: string): PaymentRecord | undefined {
    if (!transactionId || typeof transactionId !== 'string') {
      return undefined;
    }
    return this.cache.get(transactionId);
  }

  /**
   * Stores a payment record in the cache.
   * If the cache is at capacity, the least recently used item is evicted.
   * @param record The payment record to cache.
   */
  public set(record: PaymentRecord): void {
    if (!record || typeof record.transactionId !== 'string') {
      return;
    }
    this.cache.set(record.transactionId, record);
  }

  /**
   * Checks if a transaction exists in the cache without updating its LRU status.
   * @param transactionId The unique identifier for the transaction.
   */
  public has(transactionId: string): boolean {
    if (!transactionId || typeof transactionId !== 'string') {
      return false;
    }
    return this.cache.has(transactionId);
  }

  /**
   * Removes a specific transaction from the cache.
   * @param transactionId The unique identifier for the transaction.
   */
  public delete(transactionId: string): void {
    if (!transactionId || typeof transactionId !== 'string') {
      return;
    }
    this.cache.delete(transactionId);
  }

  /**
   * Evicts all items from the cache.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns operational statistics for monitoring and alerting.
   * Useful for detecting if the cache size needs adjustment.
   */
  public getStats(): CacheStats {
    const itemCount = this.cache.size;
    const max = this.cache.max;
    const ttl = this.cache.ttl;

    return {
      itemCount,
      max,
      ttl,
      utilization: max > 0 ? (itemCount / max) * 100 : 0,
    };
  }
}

/**
 * Default export for easier integration in the main application.
 */
export default PaymentCache;