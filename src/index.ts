import { PaymentCache } from './cache.js';
import type {
  PaymentRecord,
  CacheOptions,
  CacheStats,
  PaymentStatus
} from './types.js';
import 'dotenv/config';

/**
 * Entry point for the payment-api service.
 * This file demonstrates the fix for the memory leak by utilizing the new 
 * bounded LRU cache implementation and providing a mock API interface.
 */

/**
 * Configuration for the LRU cache.
 * Values are sourced from environment variables with safe defaults to prevent unbounded growth.
 */
const CACHE_CONFIG: CacheOptions = {
  max: parseInt(process.env['CACHE_MAX_SIZE'] || '1000', 10),
  ttl: parseInt(process.env['CACHE_TTL_MS'] || '60000', 10)
};

// Initialize the centralized cache layer
const paymentCache = new PaymentCache(CACHE_CONFIG);

/**
 * Generates a mock payment record for simulation.
 * 
 * @param transactionId - The unique identifier for the transaction
 * @returns A complete PaymentRecord object
 */
function createMockPayment(transactionId: string): PaymentRecord {
  const now = Date.now();
  const statuses: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
  // Use nullish coalescing to ensure a valid status is always returned
  const status = statuses[Math.floor(Math.random() * statuses.length)] ?? 'PENDING';

  return {
    transactionId,
    amount: Math.floor(Math.random() * 10000), // Amount in cents
    currency: 'USD',
    status,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Mock API interface for payment operations.
 * This simulates the service layer that would interact with the cache and database.
 */
export const PaymentAPI = {
  /**
   * Retrieves a payment record. 
   * Checks the cache first to avoid expensive database operations.
   * 
   * @param transactionId - The ID of the payment to retrieve
   * @returns The payment record
   */
  async getPayment(transactionId: string): Promise<PaymentRecord> {
    try {
      const cached = paymentCache.get(transactionId);
      if (cached) {
        return cached;
      }

      // Simulate database latency (e.g., 5ms)
      await new Promise((resolve) => setTimeout(resolve, 5));

      const record = createMockPayment(transactionId);
      
      // Store in cache - the LRU policy will automatically evict old items
      // if the max size is reached, preventing the memory leak.
      paymentCache.set(transactionId, record);

      return record;
    } catch (error) {
      console.error(`[PaymentAPI] Error retrieving transaction ${transactionId}:`, error);
      throw error;
    }
  },

  /**
   * Returns current cache performance and health metrics.
   */
  getStats(): CacheStats {
    return paymentCache.getStats();
  }
};

/**
 * Main execution function to demonstrate cache behavior under high load.
 * This simulation proves that memory usage remains stable even when 
 * processing more records than the cache limit.
 */
async function main(): Promise<void> {
  console.log('--- Payment API: Memory Leak Fix Demonstration ---');
  console.log(`[Config] Max Cache Size: ${CACHE_CONFIG.max}`);
  console.log(`[Config] Cache TTL: ${CACHE_CONFIG.ttl}ms`);

  const TOTAL_REQUESTS = 5000;
  const REPORT_STEP = 1000;

  console.log(`[Simulation] Simulating ${TOTAL_REQUESTS} unique payment requests...`);

  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const id = `TXN_ID_${i}`;
    await PaymentAPI.getPayment(id);

    // Periodically report cache and memory status
    if (i % REPORT_STEP === 0) {
      const stats = PaymentAPI.getStats();
      const memoryUsageMb = process.memoryUsage().heapUsed / 1024 / 1024;
      
      console.log(`[Progress ${i}/${TOTAL_REQUESTS}]`);
      console.log(`  - Cache Size: ${stats.size}`);
      console.log(`  - Evictions: ${stats.evictions}`);
      console.log(`  - Heap Used: ${memoryUsageMb.toFixed(2)} MB`);
    }
  }

  const finalStats = PaymentAPI.getStats();
  console.log('--- Simulation Complete ---');
  console.log(`Final Cache Size: ${finalStats.size}`);
  console.log(`Total Hits: ${finalStats.hits}`);
  console.log(`Total Misses: ${finalStats.misses}`);
  console.log(`Total Evictions: ${finalStats.evictions}`);

  // Validation: Ensure the cache did not grow beyond its limit
  if (finalStats.size <= CACHE_CONFIG.max) {
    console.log('\n[RESULT] SUCCESS: Cache size is bounded. Memory leak is resolved.');
  } else {
    console.error('\n[RESULT] FAILURE: Cache size exceeded the maximum limit.');
    process.exit(1);
  }
}

// Execute the simulation and handle any top-level errors
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[Fatal] Application error:', message);
  process.exit(1);
});