import { FilterOption } from "../types/filtering";

interface CacheEntry {
  options: FilterOption[];
  lastUpdated: number;
  ttl: number;
}

interface ClientFilterCache {
  [tableName: string]: {
    [columnKey: string]: CacheEntry;
  };
}

export class ClientFilterCacheService {
  private cache: ClientFilterCache = {};
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_ENTRIES_PER_TABLE = 100;
  private readonly STORAGE_KEY = "manager_app_filter_cache";
  private readonly useLocalStorage: boolean;

  constructor(useLocalStorage = true) {
    this.useLocalStorage =
      useLocalStorage && typeof window !== "undefined" && !!window.localStorage;

    if (this.useLocalStorage) {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Get cached filter options if they exist and are not expired
   */
  get(tableName: string, columnKey: string): FilterOption[] | null {
    const tableCache = this.cache[tableName];
    if (!tableCache) return null;

    const entry = tableCache[columnKey];
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.lastUpdated > entry.ttl;

    if (isExpired) {
      delete tableCache[columnKey];
      this.saveToLocalStorage();
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
      lastUpdated: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    this.saveToLocalStorage();
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

    this.saveToLocalStorage();
  }

  /**
   * Invalidate cache entries for a specific table (useful after data mutations)
   */
  invalidateTable(tableName: string): void {
    delete this.cache[tableName];
    this.saveToLocalStorage();
  }

  /**
   * Clean up expired entries across all tables
   */
  cleanupExpired(): number {
    let removedCount = 0;
    const now = Date.now();

    Object.keys(this.cache).forEach((tableName) => {
      const tableCache = this.cache[tableName];

      Object.keys(tableCache).forEach((columnKey) => {
        const entry = tableCache[columnKey];
        const isExpired = now - entry.lastUpdated > entry.ttl;

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

    if (removedCount > 0) {
      this.saveToLocalStorage();
    }

    return removedCount;
  }

  /**
   * Check if a specific cache entry exists and is valid
   */
  has(tableName: string, columnKey: string): boolean {
    return this.get(tableName, columnKey) !== null;
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
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    if (!this.useLocalStorage) return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = parsed;

        // Clean up expired entries on load
        this.cleanupExpired();
      }
    } catch (error) {
      console.warn("Failed to load filter cache from localStorage:", error);
      this.cache = {};
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    if (!this.useLocalStorage) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn("Failed to save filter cache to localStorage:", error);

      // If storage is full, try clearing expired entries and retry
      if (error instanceof Error && error.name === "QuotaExceededError") {
        this.cleanupExpired();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
        } catch (retryError) {
          console.error(
            "Failed to save filter cache even after cleanup:",
            retryError
          );
        }
      }
    }
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
}

// Create a singleton instance for the client
export default new ClientFilterCacheService();
