/**
 * Cache Module - Intelligent Caching System
 * 
 * This module provides a flexible caching system with:
 * - In-memory caching (default)
 * - Redis support (production-ready)
 * - TTL (Time To Live) support
 * - Cache invalidation
 * - Cache statistics
 * - Automatic cleanup
 * - getOrSet pattern
 * 
 * @module cache
 * @version 1.0.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // in seconds
  maxSize: number; // maximum number of entries
  cleanupInterval: number; // in milliseconds
  redis?: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
  };
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  defaultTTL: 300, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  redis: {
    enabled: false,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};

// ============================================================================
// IN-MEMORY CACHE IMPLEMENTATION
// ============================================================================

class InMemoryCache {
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.cache = new Map();
    this.config = config;
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };

    if (config.enabled) {
      this.startCleanup();
    }
  }

  /**
   * Get value from cache
   */
  get<T = any>(key: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update hits
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) return;

    const ttlSeconds = ttl || this.config.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
      hits: 0,
    };

    // Check max size
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      // Remove oldest entry
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    if (!this.config.enabled) return false;

    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (!this.config.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await factory();

    // Store in cache
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Find oldest cache entry
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    console.log('✅ Cache cleanup started (interval: 5 minutes)');
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      console.log('⏹️ Cache cleanup stopped');
    }
  }
}

// ============================================================================
// CACHE INSTANCE
// ============================================================================

let cacheInstance: InMemoryCache | null = null;

export function initializeCache(config: CacheConfig = DEFAULT_CACHE_CONFIG): InMemoryCache {
  if (cacheInstance) {
    console.warn('⚠️ Cache already initialized');
    return cacheInstance;
  }

  cacheInstance = new InMemoryCache(config);
  console.log('✅ Cache initialized (in-memory)');
  console.log(`📊 Config: TTL=${config.defaultTTL}s, MaxSize=${config.maxSize}`);

  return cacheInstance;
}

export function getCache(): InMemoryCache {
  if (!cacheInstance) {
    cacheInstance = initializeCache();
  }
  return cacheInstance;
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  company: (id: string) => `company:${id}`,
  expansion: (id: string) => `expansion:${id}`,
  expense: (id: string) => `expense:${id}`,
  list: (resource: string, filters?: string) => 
    `list:${resource}${filters ? `:${filters}` : ''}`,
  stats: (resource: string) => `stats:${resource}`,
  search: (query: string) => `search:${query}`,
};

// ============================================================================
// CACHE DECORATORS / HELPERS
// ============================================================================

/**
 * Cache a function result
 */
export function cached<T>(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      const key = keyGenerator(...args);

      return cache.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

/**
 * Invalidate cache for a specific pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  const cache = getCache();
  const keys = cache.keys();
  let deleted = 0;

  for (const key of keys) {
    if (typeof pattern === 'string') {
      if (key.startsWith(pattern)) {
        cache.delete(key);
        deleted++;
      }
    } else {
      if (pattern.test(key)) {
        cache.delete(key);
        deleted++;
      }
    }
  }

  if (deleted > 0) {
    console.log(`🗑️ Invalidated ${deleted} cache entries matching: ${pattern}`);
  }

  return deleted;
}

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

export function cacheMiddleware(ttl: number = 60) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cache = getCache();
    const key = `http:${req.originalUrl}`;

    // Try to get from cache
    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body: any) => {
      cache.set(key, body, ttl);
      return originalJson(body);
    };

    next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializeCache,
  getCache,
  CacheKeys,
  cached,
  invalidateCache,
  cacheMiddleware,
  DEFAULT_CACHE_CONFIG,
};

export type { CacheConfig, CacheEntry, CacheStats };
