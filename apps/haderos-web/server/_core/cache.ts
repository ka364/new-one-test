/**
 * Caching Layer for Performance Optimization
 * Using in-memory cache (can be upgraded to Redis)
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get or set (lazy loading)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlSeconds);
    return value;
  }
}

// Singleton instance
export const cache = new CacheManager();

// Clean expired entries every 5 minutes
setInterval(() => {
  const cleaned = cache.cleanExpired();
  if (cleaned > 0) {
    console.log(`[CACHE] Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

/**
 * Cache decorator for functions
 */
export function Cacheable(ttlSeconds = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttlSeconds);
    };

    return descriptor;
  };
}

export default cache;
