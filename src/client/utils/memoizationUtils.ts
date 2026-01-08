import { useMemo, useCallback, useRef } from "react";
import type { ResponsiveColumnDef } from "./columnHelpers";

/**
 * Memoization utilities for column definitions and filter functions
 * Provides optimized caching for expensive operations in data tables
 */

/**
 * Configuration for column memoization
 */
interface ColumnMemoConfig<_T> {
  dependencies: unknown[];
  debugName?: string;
  enableLogging?: boolean;
}

/**
 * Configuration for filter memoization
 */
interface FilterMemoConfig {
  dependencies: unknown[];
  cacheSize?: number;
  debugName?: string;
  enableLogging?: boolean;
}

/**
 * Cache entry for memoized values
 */
interface CacheEntry<T> {
  value: T;
  dependencies: unknown[];
  timestamp: number;
  hitCount: number;
}

/**
 * LRU Cache implementation for memoization
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: string, dependencies: unknown[]): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // Check if dependencies have changed
    if (!this.dependenciesEqual(entry.dependencies, dependencies)) {
      this.cache.delete(key);
      return undefined;
    }

    // Update hit count and move to end (most recently used)
    entry.hitCount++;
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, dependencies: unknown[]): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      dependencies: [...dependencies],
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      averageAge:
        entries.length > 0
          ? (Date.now() -
              entries.reduce((sum, entry) => sum + entry.timestamp, 0) /
                entries.length) /
            1000
          : 0,
    };
  }

  private dependenciesEqual(deps1: unknown[], deps2: unknown[]): boolean {
    if (deps1.length !== deps2.length) return false;
    return deps1.every((dep, index) => dep === deps2[index]);
  }
}

// Global cache instances
const columnCache = new LRUCache<ResponsiveColumnDef<any>[]>(100);
const filterCache = new LRUCache<(...args: unknown[]) => unknown>(200);

/**
 * Memoize column definitions with dependency tracking
 */
export const useMemoizedColumns = <T extends Record<string, unknown>>(
  createColumns: () => ResponsiveColumnDef<T>[],
  config: ColumnMemoConfig<T>
): ResponsiveColumnDef<T>[] => {
  const { dependencies, debugName = "columns", enableLogging = false } = config;
  const cacheKey = `${debugName}-${JSON.stringify(dependencies)}`;

  return useMemo(() => {
    /* timing disabled */

    // Try to get from cache first
    const cached = columnCache.get(cacheKey, dependencies);
    if (cached) {
      if (enableLogging) {
        console.log(`🎯 Column cache hit for ${debugName}`);
      }
      return cached as ResponsiveColumnDef<T>[];
    }

    // Create new columns
    const columns = createColumns();

    // Cache the result
    columnCache.set(cacheKey, columns, dependencies);

    if (enableLogging) {
      console.log(`🔧 Column creation for ${debugName}`);
    }

    return columns;
  }, dependencies);
};

/**
 * Memoize filter functions with advanced caching
 */
export const useMemoizedFilter = <T>(
  createFilter: () => (row: T, id: string, value: any) => boolean,
  config: FilterMemoConfig
): ((row: T, id: string, value: any) => boolean) => {
  const {
    dependencies,
    cacheSize = 100,
    debugName = "filter",
    enableLogging = false,
  } = config;

  const filterCacheRef = useRef(new LRUCache<boolean>(cacheSize));
  const filterFnRef = useRef<
    ((row: T, id: string, value: any) => boolean) | null
  >(null);
  const lastDependenciesRef = useRef<unknown[]>([]);

  return useCallback((row: T, id: string, value: unknown) => {
    // Check if we need to recreate the filter function
    const depsChanged =
      dependencies.length !== lastDependenciesRef.current.length ||
      dependencies.some(
        (dep, index) => dep !== lastDependenciesRef.current[index]
      );

    if (depsChanged || !filterFnRef.current) {
      /* timing disabled */
      filterFnRef.current = createFilter();
      lastDependenciesRef.current = [...dependencies];

      // Clear cache when filter function changes
      filterCacheRef.current.clear();

      if (enableLogging) {
        console.log(`🔧 Filter recreation for ${debugName}`);
      }
    }

    // Create cache key for this specific filter operation
    const cacheKey = `${id}-${JSON.stringify(value)}-${JSON.stringify(row)}`;

    // Try to get from cache
    const cached = filterCacheRef.current.get(cacheKey, [row, id, value]);
    if (cached !== undefined) {
      if (enableLogging) {
        console.log(`🎯 Filter cache hit for ${debugName}`);
      }
      return cached;
    }

    // Execute filter and cache result
    const result = filterFnRef.current!(row, id, value);
    filterCacheRef.current.set(cacheKey, result, [row, id, value]);

    return result;
  }, dependencies);
};

/**
 * Memoize calculated field computations
 */
export const useMemoizedCalculation = <T, R>(
  calculation: (data: T) => R,
  data: T,
  dependencies: unknown[],
  _debugName: string = "calculation"
): R => {
  return useMemo(() => {
    const result = calculation(data);
    return result;
  }, [data, ...dependencies]);
};

/**
 * Memoize data transformations with batch processing
 */
export const useMemoizedDataTransform = <T, R>(
  transform: (items: T[]) => R[],
  data: T[],
  dependencies: unknown[],
  options: {
    batchSize?: number;
    debugName?: string;
    enableLogging?: boolean;
  } = {}
): R[] => {
  const {
    batchSize = 1000,
    debugName = "transform",
    enableLogging = false,
  } = options;

  return useMemo(() => {
    /* timing disabled */

    // For small datasets, process all at once
    if (data.length <= batchSize) {
      const result = transform(data);

      if (enableLogging) {
        console.log(`🔄 Transform ${debugName} (${data.length} items)`);
      }

      return result;
    }

    // For large datasets, process in batches
    const results: R[] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = transform(batch);
      results.push(...batchResults);
    }

    if (enableLogging) {
      console.log(`🔄 Batched transform ${debugName} (${data.length} items)`);
    }

    return results;
  }, [data, ...dependencies]);
};

/**
 * Memoize sorting functions
 */
export const useMemoizedSort = <T>(
  sortFn: (a: T, b: T) => number,
  dependencies: unknown[],
  _debugName: string = "sort"
): ((a: T, b: T) => number) => {
  return useCallback((a: T, b: T) => {
    return sortFn(a, b);
  }, dependencies);
};

/**
 * Advanced memoization hook with cache statistics
 */
export const useAdvancedMemoization = <T>(
  factory: () => T,
  dependencies: unknown[],
  options: {
    debugName?: string;
    enableLogging?: boolean;
    maxAge?: number; // in milliseconds
  } = {}
) => {
  const {
    debugName: _debugName = "memoized",
    enableLogging = false,
    maxAge = 60000,
  } = options;
  const cacheRef = useRef<{
    value: T;
    dependencies: unknown[];
    timestamp: number;
  } | null>(null);

  return useMemo(() => {
    const now = Date.now();

    // Check if we have a cached value
    if (cacheRef.current) {
      const { value, dependencies: cachedDeps, timestamp } = cacheRef.current;

      // Check if dependencies haven't changed and cache isn't expired
      const depsEqual =
        dependencies.length === cachedDeps.length &&
        dependencies.every((dep, index) => dep === cachedDeps[index]);

      const notExpired = now - timestamp < maxAge;

      if (depsEqual && notExpired) {
        if (enableLogging) {
          console.log(`🎯 Advanced cache hit for ${_debugName}`);
        }
        return value;
      }
    }

    // Create new value
    /* timing disabled */
    const value = factory();

    // Cache the result
    cacheRef.current = {
      value,
      dependencies: [...dependencies],
      timestamp: now,
    };

    if (enableLogging) {
      console.log(`🔧 Advanced memoization for ${_debugName}`);
    }

    return value;
  }, dependencies);
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = () => {
  return {
    columnCache: columnCache.getStats(),
    filterCache: filterCache.getStats(),
  };
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  columnCache.clear();
  filterCache.clear();
};

/**
 * Hook to monitor memoization effectiveness
 */
export const useMemoizationStats = (componentName: string) => {
  const statsRef = useRef({
    cacheHits: 0,
    cacheMisses: 0,
    totalComputations: 0,
  });

  const recordCacheHit = useCallback(() => {
    statsRef.current.cacheHits++;
    statsRef.current.totalComputations++;
  }, []);

  const recordCacheMiss = useCallback(() => {
    statsRef.current.cacheMisses++;
    statsRef.current.totalComputations++;
  }, []);

  const getStats = useCallback(() => {
    const { cacheHits, cacheMisses, totalComputations } = statsRef.current;
    const hitRate =
      totalComputations > 0 ? (cacheHits / totalComputations) * 100 : 0;

    return {
      cacheHits,
      cacheMisses,
      totalComputations,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }, []);

  const logStats = useCallback(() => {
    const stats = getStats();
    console.log(`📊 Memoization stats for ${componentName}:`, stats);
  }, [componentName, getStats]);

  return {
    recordCacheHit,
    recordCacheMiss,
    getStats,
    logStats,
  };
};
