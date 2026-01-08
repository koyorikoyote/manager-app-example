import { FilterOption } from "../../shared/types/filtering";

interface CacheEntry {
  options: FilterOption[];
  lastUpdated: Date;
  ttl: number;
}

interface FilterCache {
  [tableName: string]: {
    [columnKey: string]: CacheEntry;
  };
}

export class FilterCacheService {
  private cache: FilterCache = {};
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_ENTRIES_PER_TABLE = 100;

  /**
   * Get cached filter options if they exist and are not expired
   */
  get(tableName: string, columnKey: string): FilterOption[] | null {
    const tableCache = this.cache[tableName];
    if (!tableCache) return null;

    const entry = tableCache[columnKey];
    if (!entry) return null;

    const now = new Date();
    const isExpired = now.getTime() - entry.lastUpdated.getTime() > entry.ttl;

    if (isExpired) {
      delete tableCache[columnKey];
      return null;
    }

    return entry.options;
  }

  /**
   * Set filter options in cache with TTL
   */
  set(
    tableName: string,
    columnKey: string,
    options: FilterOption[],
    ttl?: number
  ): void {
    if (!this.cache[tableName]) {
      this.cache[tableName] = {};
    }

    const tableCache = this.cache[tableName];

    // Check cache size limit and remove oldest entry if needed
    this.enforceTableCacheLimit(tableCache);

    tableCache[columnKey] = {
      options,
      lastUpdated: new Date(),
      ttl: ttl || this.DEFAULT_TTL,
    };
  }

  /**
   * Clear cache for a specific table or all tables
   */
  clear(tableName?: string): void {
    if (tableName) {
      delete this.cache[tableName];
    } else {
      this.cache = {};
    }
  }

  /**
   * Invalidate cache entries for a specific table (useful after data mutations)
   */
  invalidateTable(tableName: string): void {
    delete this.cache[tableName];
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    totalTables: number;
    totalEntries: number;
    tableStats: Record<string, number>;
  } {
    const tableStats: Record<string, number> = {};
    let totalEntries = 0;

    Object.keys(this.cache).forEach((tableName) => {
      const entryCount = Object.keys(this.cache[tableName]).length;
      tableStats[tableName] = entryCount;
      totalEntries += entryCount;
    });

    return {
      totalTables: Object.keys(this.cache).length,
      totalEntries,
      tableStats,
    };
  }

  /**
   * Clean up expired entries across all tables
   */
  cleanupExpired(): number {
    let removedCount = 0;
    const now = new Date();

    Object.keys(this.cache).forEach((tableName) => {
      const tableCache = this.cache[tableName];

      Object.keys(tableCache).forEach((columnKey) => {
        const entry = tableCache[columnKey];
        const isExpired =
          now.getTime() - entry.lastUpdated.getTime() > entry.ttl;

        if (isExpired) {
          delete tableCache[columnKey];
          removedCount++;
        }
      });

      // Remove empty table caches
      if (Object.keys(tableCache).length === 0) {
        delete this.cache[tableName];
      }
    });

    return removedCount;
  }

  /**
   * Enforce cache size limit for a table by removing oldest entries
   */
  private enforceTableCacheLimit(tableCache: Record<string, CacheEntry>): void {
    const cacheKeys = Object.keys(tableCache);

    if (cacheKeys.length >= this.MAX_CACHE_ENTRIES_PER_TABLE) {
      // Find and remove the oldest entry
      const oldestKey = cacheKeys.reduce((oldest, key) => {
        return tableCache[key].lastUpdated < tableCache[oldest].lastUpdated
          ? key
          : oldest;
      });

      delete tableCache[oldestKey];
    }
  }

  /**
   * Preload cache with data (useful for warming up cache)
   */
  preload(
    tableName: string,
    columnKey: string,
    options: FilterOption[],
    ttl?: number
  ): void {
    this.set(tableName, columnKey, options, ttl);
  }

  /**
   * Check if a specific cache entry exists and is valid
   */
  has(tableName: string, columnKey: string): boolean {
    return this.get(tableName, columnKey) !== null;
  }

  /**
   * Get cache entry metadata without returning the actual data
   */
  getMetadata(
    tableName: string,
    columnKey: string
  ): { lastUpdated: Date; ttl: number; size: number } | null {
    const tableCache = this.cache[tableName];
    if (!tableCache) return null;

    const entry = tableCache[columnKey];
    if (!entry) return null;

    return {
      lastUpdated: entry.lastUpdated,
      ttl: entry.ttl,
      size: entry.options.length,
    };
  }
}

export default new FilterCacheService();
