export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/**
 * Represents a payment transaction record stored in the system.
 * This structure is used for both the cache and the underlying data store.
 */
export interface PaymentRecord {
  /** Unique identifier for the transaction */
  transactionId: string;
  /** Transaction amount in the smallest currency unit (e.g., cents) */
  amount: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Current state of the payment */
  status: PaymentStatus;
  /** Unix timestamp (ms) when the record was created */
  createdAt: number;
  /** Unix timestamp (ms) when the record was last modified */
  updatedAt: number;
  /** Optional key-value pairs for additional transaction context */
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Configuration parameters for the LRU (Least Recently Used) cache.
 * These settings help prevent memory leaks by enforcing bounds on growth.
 */
export interface CacheOptions {
  /** 
   * The maximum number of items to store in the cache. 
   * Once reached, the least recently used items are evicted.
   */
  max: number;
  /** 
   * Time-To-Live in milliseconds. 
   * Items older than this duration are considered stale and will be evicted.
   */
  ttl: number;
  /**
   * If true, the cache will return stale items before deleting them 
   * when a get() operation occurs.
   */
  allowStale?: boolean;
  /**
   * If true, retrieving an item will reset its TTL timer.
   */
  updateAgeOnGet?: boolean;
}

/**
 * Operational statistics for monitoring cache health and performance.
 */
export interface CacheStats {
  /** Current number of items residing in memory */
  itemCount: number;
  /** Configured maximum capacity */
  max: number;
  /** Configured time-to-live setting */
  ttl: number;
  /** Calculated memory pressure or utilization percentage (0-100) */
  utilization: number;
}

/**
 * Standard error structure for cache-related failures.
 */
export interface CacheError {
  code: 'CACHE_MISS' | 'CACHE_WRITE_ERROR' | 'INVALID_ENTRY';
  message: string;
  transactionId?: string;
}