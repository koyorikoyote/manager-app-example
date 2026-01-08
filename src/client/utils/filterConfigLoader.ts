/**
 * Filter Configuration Loader
 *
 * Handles loading and caching of filter configurations for DataTable components.
 * Integrates with the backend FilterAnalyzer service and provides fallback logic.
 */

import {
  FilterConfiguration,
  analyzeColumnsForFiltering,
} from "./filterTypeDetection";
import clientFilterCache from "../../shared/utils/clientFilterCache";

export interface FilterConfigCache {
  [tableName: string]: {
    [columnKey: string]: FilterConfiguration;
  };
}

// In-memory cache for filter configurations
const configCache: FilterConfigCache = {};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

const timestampCache: { [key: string]: number } = {};

/**
 * Load filter configurations for a table
 */
export async function loadFilterConfigurations(
  tableName: string,
  columns: Array<{ key: string; label: string; dataType?: string }>,
  data: Record<string, unknown>[],
  enableFallback = true
): Promise<FilterConfiguration[]> {
  const cacheKey = `${tableName}:configs`;
  const now = Date.now();

  // Check if we have cached configurations that are still valid
  if (
    configCache[tableName] &&
    timestampCache[cacheKey] &&
    now - timestampCache[cacheKey] < CACHE_TTL
  ) {
    return Object.values(configCache[tableName]);
  }

  try {
    // Try to load from backend API
    const response = await fetch(`/api/filters/${tableName}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ columns }),
    });

    if (response.ok) {
      const configurations: FilterConfiguration[] = await response.json();

      // Cache the configurations
      configCache[tableName] = {};
      configurations.forEach((config) => {
        configCache[tableName][config.columnKey] = config;
      });
      timestampCache[cacheKey] = now;

      return configurations;
    } else if (enableFallback) {
      // Fallback to client-side analysis
      console.warn(
        `Failed to load filter configurations from API for table ${tableName}, falling back to client-side analysis`
      );
      return loadFilterConfigurationsFallback(tableName, columns, data);
    } else {
      throw new Error(
        `Failed to load filter configurations: ${response.statusText}`
      );
    }
  } catch (error) {
    if (enableFallback) {
      console.warn(
        "Error loading filter configurations from API, falling back to client-side analysis:",
        error
      );
      return loadFilterConfigurationsFallback(tableName, columns, data);
    } else {
      throw error;
    }
  }
}

/**
 * Fallback method to analyze columns client-side
 */
function loadFilterConfigurationsFallback(
  tableName: string,
  columns: Array<{ key: string; label: string; dataType?: string }>,
  data: Record<string, unknown>[]
): FilterConfiguration[] {
  const configurations = analyzeColumnsForFiltering(columns, data);

  // Cache the fallback configurations
  const now = Date.now();
  const cacheKey = `${tableName}:configs`;

  configCache[tableName] = {};
  configurations.forEach((config) => {
    configCache[tableName][config.columnKey] = config;
  });
  timestampCache[cacheKey] = now;

  return configurations;
}

/**
 * Get filter configuration for a specific column
 */
export function getFilterConfiguration(
  tableName: string,
  columnKey: string
): FilterConfiguration | null {
  return configCache[tableName]?.[columnKey] || null;
}

/**
 * Clear filter configuration cache
 */
export function clearFilterConfigCache(tableName?: string): void {
  if (tableName) {
    delete configCache[tableName];
    delete timestampCache[`${tableName}:configs`];
  } else {
    Object.keys(configCache).forEach((key) => delete configCache[key]);
    Object.keys(timestampCache).forEach((key) => delete timestampCache[key]);
  }
}

/**
 * Load filter options for a specific column
 */
export async function loadFilterOptions(
  tableName: string,
  columnKey: string,
  data: Record<string, unknown>[],
  enableFallback = true
): Promise<Array<{ value: string; label: string; count?: number }>> {
  // Check client filter cache first
  const cachedOptions = clientFilterCache.get(tableName, columnKey);
  if (cachedOptions) {
    return cachedOptions;
  }

  try {
    // Try to load from backend API
    const response = await fetch(
      `/api/filters/${tableName}/${columnKey}/options`
    );

    if (response.ok) {
      const options = await response.json();

      // Cache the options using the client filter cache service
      clientFilterCache.set(tableName, columnKey, options);

      return options;
    } else if (enableFallback) {
      // Fallback to client-side generation
      const generatedOptions = generateOptionsFromData(columnKey, data);

      // Cache the generated options with shorter TTL
      clientFilterCache.set(tableName, columnKey, generatedOptions, 60 * 1000); // 1 minute TTL for generated options

      return generatedOptions;
    } else {
      throw new Error(`Failed to load filter options: ${response.statusText}`);
    }
  } catch (error) {
    if (enableFallback) {
      console.warn(
        `Error loading filter options for ${columnKey}, falling back to client-side generation:`,
        error
      );
      const generatedOptions = generateOptionsFromData(columnKey, data);

      // Cache the generated options with shorter TTL
      clientFilterCache.set(tableName, columnKey, generatedOptions, 60 * 1000); // 1 minute TTL for generated options

      return generatedOptions;
    } else {
      throw error;
    }
  }
}

/**
 * Generate filter options from local data
 */
function generateOptionsFromData(
  columnKey: string,
  data: Record<string, unknown>[]
): Array<{ value: string; label: string; count: number }> {
  const valueCounts = new Map<string, number>();

  data.forEach((row) => {
    const value = row[columnKey];
    if (value != null && value !== "") {
      const stringValue = String(value);
      valueCounts.set(stringValue, (valueCounts.get(stringValue) || 0) + 1);
    }
  });

  return Array.from(valueCounts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Load numeric ranges for a column
 */
export async function loadNumericRanges(
  tableName: string,
  columnKey: string,
  data: Record<string, unknown>[],
  enableFallback = true
): Promise<Array<{ label: string; min: number; max: number; count?: number }>> {
  const cacheKey = `${tableName}:${columnKey}:ranges`;
  const now = Date.now();

  // Check cache first
  const rangesCacheTTL = 5 * 60 * 1000; // 5 minutes
  if (
    timestampCache[cacheKey] &&
    now - timestampCache[cacheKey] < rangesCacheTTL
  ) {
    const config = getFilterConfiguration(tableName, columnKey);
    if (config?.ranges) {
      return config.ranges;
    }
  }

  try {
    // Try to load from backend API
    const response = await fetch(
      `/api/filters/${tableName}/${columnKey}/ranges`
    );

    if (response.ok) {
      const rangeData = await response.json();
      const ranges = rangeData.ranges || [];

      // Update cache
      if (configCache[tableName]?.[columnKey]) {
        configCache[tableName][columnKey].ranges = ranges;
      }
      timestampCache[cacheKey] = now;

      return ranges;
    } else if (enableFallback) {
      // Fallback to client-side generation
      return generateRangesFromData(columnKey, data);
    } else {
      throw new Error(`Failed to load numeric ranges: ${response.statusText}`);
    }
  } catch (error) {
    if (enableFallback) {
      console.warn(
        `Error loading numeric ranges for ${columnKey}, falling back to client-side generation:`,
        error
      );
      return generateRangesFromData(columnKey, data);
    } else {
      throw error;
    }
  }
}

/**
 * Generate numeric ranges from local data
 */
function generateRangesFromData(
  columnKey: string,
  data: Record<string, unknown>[]
): Array<{ label: string; min: number; max: number; count: number }> {
  const values: number[] = [];

  data.forEach((row) => {
    const value = row[columnKey];
    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    } else if (typeof value === "string") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        values.push(numValue);
      }
    }
  });

  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ label: `${min}`, min, max, count: values.length }];
  }

  const difference = max - min;
  const rangeSize = Math.ceil(difference / 4);
  const ranges: Array<{
    label: string;
    min: number;
    max: number;
    count: number;
  }> = [];

  for (let i = 0; i < 4; i++) {
    const rangeMin = min + i * rangeSize;
    const rangeMax = i === 3 ? max : min + (i + 1) * rangeSize - 1;

    // Count values in this range
    const count = values.filter((v) => v >= rangeMin && v <= rangeMax).length;

    if (count > 0) {
      ranges.push({
        label: `${rangeMin} to ${rangeMax}`,
        min: rangeMin,
        max: rangeMax,
        count,
      });
    }
  }

  return ranges;
}
