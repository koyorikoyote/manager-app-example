interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  keys: string[];
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clean up least recently used entries when cache gets too large
  evictLRU(maxSize: number = 1000): void {
    if (this.cache.size <= maxSize) {
      return;
    }

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.slice(0, this.cache.size - maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  // Get comprehensive cache statistics
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Estimate memory usage
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // String characters are 2 bytes each
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 64; // Overhead for entry metadata
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  // Get detailed entry information
  getEntryStats(
    key: string
  ): { hits: number; age: number; lastAccessed: number } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    return {
      hits: entry.hits,
      age: Date.now() - entry.timestamp,
      lastAccessed: entry.lastAccessed,
    };
  }

  // Warm up cache with frequently accessed data
  async warmUp(
    warmUpFunctions: Array<{
      key: string;
      fn: () => Promise<any>;
      ttl?: number;
    }>
  ): Promise<void> {
    console.log("🔥 Warming up cache...");

    const promises = warmUpFunctions.map(async ({ key, fn, ttl = 60000 }) => {
      try {
        const data = await fn();
        this.set(key, data, ttl);
        console.log(`✅ Warmed up cache key: ${key}`);
      } catch (error) {
        console.warn(
          `⚠️  Failed to warm up cache key ${key}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    });

    await Promise.all(promises);
    console.log(
      `🔥 Cache warm-up completed. ${warmUpFunctions.length} keys processed.`
    );
  }
}

// Create a singleton cache instance
export const ssrCache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  ssrCache.cleanup();
}, 5 * 60 * 1000);

// Cache key generators
export const generateCacheKey = {
  baseStats: () => "base_stats",
  recentActivities: () => "recent_activities",
  properties: (limit: number = 20) => `properties_${limit}`,
  propertyDetail: (id: number) => `property_${id}`,
  staff: (limit: number = 20) => `staff_${limit}`,
  staffDetail: (id: number) => `staff_${id}`,
  systemConfigs: (limit: number = 50) => `system_configs_${limit}`,
};

// Application cache
export const performanceCache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  performanceCache.cleanup();
  performanceCache.evictLRU(1000); // Keep cache size reasonable
}, 5 * 60 * 1000);

// Log cache statistics every 10 minutes in development
if (process.env.NODE_ENV === "development") {
  setInterval(() => {
    const stats = performanceCache.getStats();
    console.log("📊 Cache Statistics:", {
      size: stats.size,
      hitRate: `${stats.hitRate}%`,
      memoryUsage: `${Math.round(stats.memoryUsage / 1024)}KB`,
    });
  }, 10 * 60 * 1000);
}

// Cache warming functions for frequently accessed data
export const cacheWarmUpFunctions = [
  {
    key: generateCacheKey.baseStats(),
    fn: async () => {
      const prisma = require("../lib/prisma").default;
      const [userCount, staffCount, propertyCount] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.staff.count({ where: { status: "ACTIVE" } }),
        prisma.property.count({ where: { status: "ACTIVE" } }),
      ]);
      return { users: userCount, staff: staffCount, properties: propertyCount };
    },
    ttl: 2 * 60 * 1000, // 2 minutes
  },
  {
    key: generateCacheKey.recentActivities(),
    fn: async () => {
      const prisma = require("../lib/prisma").default;
      const [recentStaff, recentProperties] = await Promise.all([
        prisma.staff.findMany({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, name: true, position: true, createdAt: true },
        }),
        prisma.property.findMany({
          where: { status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: { id: true, name: true, propertyType: true, updatedAt: true },
        }),
      ]);
      return { recentStaff, recentProperties };
    },
    ttl: 60 * 1000, // 1 minute
  },
];

// Initialize cache warming on startup
export const initializeCacheWarming = async (): Promise<void> => {
  try {
    await performanceCache.warmUp(cacheWarmUpFunctions);
  } catch (error) {
    console.warn("Cache warming failed:", error);
  }
};
