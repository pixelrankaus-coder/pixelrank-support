/**
 * Cache abstraction layer
 *
 * In production: Uses Redis if REDIS_URL is set
 * In development/fallback: Uses in-memory cache with optional DB persistence
 *
 * Usage:
 *   import { cache } from '@/lib/cache';
 *   await cache.set('key', 'value', 3600); // 1 hour TTL
 *   const value = await cache.get('key');
 *   await cache.del('key');
 */

// Cache abstraction - no DB dependency needed

// In-memory cache store (for development or Redis fallback)
const memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

// Redis client singleton
let redisClient: RedisClientType | null = null;

// Type for Redis client (we'll check if ioredis is available)
type RedisClientType = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>;
  setex: (key: string, seconds: number, value: string) => Promise<unknown>;
  del: (key: string | string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  flushdb: () => Promise<unknown>;
  quit: () => Promise<unknown>;
};

// Check if Redis is configured
function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

// Lazy load Redis client
async function getRedisClient(): Promise<RedisClientType | null> {
  if (!isRedisConfigured()) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    // Dynamic import to avoid errors if ioredis is not installed
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(process.env.REDIS_URL!) as unknown as RedisClientType;
    console.log("[Cache] Connected to Redis");
    return redisClient;
  } catch (error) {
    console.warn("[Cache] Redis not available, using in-memory cache:", error);
    return null;
  }
}

// Clean up expired entries from memory cache
function cleanupMemoryCache(): void {
  const now = Date.now();
  Array.from(memoryCache.entries()).forEach(([key, entry]) => {
    if (entry.expiresAt && entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  });
}

// Run cleanup every minute
if (typeof setInterval !== "undefined") {
  setInterval(cleanupMemoryCache, 60 * 1000);
}

export const cache = {
  /**
   * Get a value from cache
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient();

      if (redis) {
        const value = await redis.get(key);
        if (value) {
          try {
            return JSON.parse(value) as T;
          } catch {
            return value as unknown as T;
          }
        }
        return null;
      }

      // Fallback to memory cache
      const entry = memoryCache.get(key);
      if (!entry) return null;

      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        memoryCache.delete(key);
        return null;
      }

      try {
        return JSON.parse(entry.value) as T;
      } catch {
        return entry.value as unknown as T;
      }
    } catch (error) {
      console.error("[Cache] Get error:", error);
      return null;
    }
  },

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache (will be JSON stringified)
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      const redis = await getRedisClient();

      if (redis) {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, serialized);
        } else {
          await redis.set(key, serialized);
        }
        return;
      }

      // Fallback to memory cache
      memoryCache.set(key, {
        value: serialized,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
    } catch (error) {
      console.error("[Cache] Set error:", error);
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      const redis = await getRedisClient();

      if (redis) {
        await redis.del(keys);
        return;
      }

      // Fallback to memory cache
      keys.forEach((k) => memoryCache.delete(k));
    } catch (error) {
      console.error("[Cache] Delete error:", error);
    }
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const redis = await getRedisClient();

      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
        return;
      }

      // Fallback to memory cache - convert glob pattern to regex
      const regexPattern = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      Array.from(memoryCache.keys()).forEach((key) => {
        if (regexPattern.test(key)) {
          memoryCache.delete(key);
        }
      });
    } catch (error) {
      console.error("[Cache] Delete pattern error:", error);
    }
  },

  /**
   * Get or set a value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  /**
   * Check if Redis is being used
   */
  isRedis(): boolean {
    return isRedisConfigured() && redisClient !== null;
  },

  /**
   * Get cache stats
   */
  async stats(): Promise<{ type: "redis" | "memory"; size: number }> {
    const redis = await getRedisClient();

    if (redis) {
      const keys = await redis.keys("*");
      return { type: "redis", size: keys.length };
    }

    return { type: "memory", size: memoryCache.size };
  },

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const redis = await getRedisClient();

      if (redis) {
        await redis.flushdb();
        return;
      }

      memoryCache.clear();
    } catch (error) {
      console.error("[Cache] Clear error:", error);
    }
  },
};

// Cache key helpers for consistent naming
export const cacheKeys = {
  ticketCounts: (userId?: string) => `ticket:counts:${userId || "all"}`,
  userSession: (userId: string) => `session:${userId}`,
  notification: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,
  search: (query: string, type?: string) => `search:${type || "all"}:${query}`,
  kbArticle: (slug: string) => `kb:article:${slug}`,
  kbCategories: () => `kb:categories`,
};

// Cache TTL presets (in seconds)
export const cacheTTL = {
  short: 60,           // 1 minute
  medium: 300,         // 5 minutes
  long: 3600,          // 1 hour
  day: 86400,          // 24 hours
  session: 1800,       // 30 minutes
};
