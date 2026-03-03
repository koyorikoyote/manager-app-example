import { useCallback, useMemo } from "react";
import type { TranslationFunction } from "../../shared/types/translations";

/**
 * Performance optimization utilities specifically for Staff Detail components
 */

// Memoization helper for expensive staff data transformations
export const useStaffDataMemoization = () => {
  const measureStaffTransformation = useCallback(
    <T, R>(
      transformFn: (data: T) => R,
      data: T,
      operationName: string = "staffDataTransformation"
    ): R => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Executing staff operation: ${operationName}`);
      }
      return transformFn(data);
    },
    []
  );

  return { measureStaffTransformation };
};

// Optimized date formatting for staff records
export const useOptimizedDateFormatting = () => {
  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  }, []);

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatDate = useCallback(
    (date: Date | string): string => {
      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return dateFormatter.format(dateObj);
      } catch {
        return "Invalid Date";
      }
    },
    [dateFormatter]
  );

  const formatTime = useCallback(
    (date: Date | string): string => {
      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return timeFormatter.format(dateObj);
      } catch {
        return "Invalid Time";
      }
    },
    [timeFormatter]
  );

  return { formatDate, formatTime };
};

// Optimized status formatting with memoized color mappings
export const useOptimizedStatusFormatting = (t?: TranslationFunction) => {
  const conditionStatusMap = useMemo(
    () => ({
      Excellent: {
        textKey: "detailPages.accordionLabels.dailyRecord.conditionStatusValues.Excellent",
        fallback: "Excellent",
        className: "text-green-700 bg-green-100",
      },
      Good: { textKey: "detailPages.accordionLabels.dailyRecord.conditionStatusValues.Good", fallback: "Good", className: "text-blue-700 bg-blue-100" },
      Fair: { textKey: "detailPages.accordionLabels.dailyRecord.conditionStatusValues.Fair", fallback: "Fair", className: "text-yellow-700 bg-yellow-100" },
      Poor: { textKey: "detailPages.accordionLabels.dailyRecord.conditionStatusValues.Poor", fallback: "Poor", className: "text-red-700 bg-red-100" },
    }),
    []
  );

  const interactionMeansMap = useMemo(
    () => ({
      FACE_TO_FACE: {
        textKey: "detailPages.accordionLabels.interaction.meansValues.FACE_TO_FACE",
        fallback: "Face to Face",
        className: "text-green-700 bg-green-100",
      },
      ONLINE: { textKey: "detailPages.accordionLabels.interaction.meansValues.ONLINE", fallback: "Online", className: "text-blue-700 bg-blue-100" },
      PHONE: { textKey: "detailPages.accordionLabels.interaction.meansValues.PHONE", fallback: "Phone", className: "text-purple-700 bg-purple-100" },
      EMAIL: { textKey: "detailPages.accordionLabels.interaction.meansValues.EMAIL", fallback: "Email", className: "text-orange-700 bg-orange-100" },
    }),
    []
  );

  const documentTypeMap = useMemo(
    () => ({
      STAFF: { textKey: "detailPages.accordionLabels.procedures.typeValues.STAFF", fallback: "Staff", className: "text-blue-700 bg-blue-100" },
      PROPERTY: { textKey: "detailPages.accordionLabels.procedures.typeValues.PROPERTY", fallback: "Property", className: "text-green-700 bg-green-100" },
      COMPANY: { textKey: "detailPages.accordionLabels.procedures.typeValues.COMPANY", fallback: "Company", className: "text-purple-700 bg-purple-100" },
    }),
    []
  );

  const documentStatusMap = useMemo(
    () => ({
      ACTIVE: { textKey: "detailPages.accordionLabels.procedures.statusValues.ACTIVE", fallback: "Active", className: "text-green-700 bg-green-100" },
      EXPIRED: { textKey: "detailPages.accordionLabels.procedures.statusValues.EXPIRED", fallback: "Expired", className: "text-red-700 bg-red-100" },
      TERMINATED: {
        textKey: "detailPages.accordionLabels.procedures.statusValues.TERMINATED",
        fallback: "Terminated",
        className: "text-gray-700 bg-gray-100",
      },
    }),
    []
  );

  const formatConditionStatus = useCallback(
    (status: string) => {
      const entry = conditionStatusMap[status as keyof typeof conditionStatusMap];
      if (!entry) return { text: status, className: "text-gray-700 bg-gray-100" };
      return { text: t ? t(entry.textKey as Parameters<typeof t>[0]) : entry.fallback, className: entry.className };
    },
    [conditionStatusMap, t]
  );

  const formatInteractionMeans = useCallback(
    (means: string) => {
      const entry = interactionMeansMap[means as keyof typeof interactionMeansMap];
      if (!entry) return { text: means, className: "text-gray-700 bg-gray-100" };
      return { text: t ? t(entry.textKey as Parameters<typeof t>[0]) : entry.fallback, className: entry.className };
    },
    [interactionMeansMap, t]
  );

  const formatDocumentType = useCallback(
    (type: string) => {
      const entry = documentTypeMap[type as keyof typeof documentTypeMap];
      if (!entry) return { text: type, className: "text-gray-700 bg-gray-100" };
      return { text: t ? t(entry.textKey as Parameters<typeof t>[0]) : entry.fallback, className: entry.className };
    },
    [documentTypeMap, t]
  );

  const formatDocumentStatus = useCallback(
    (status: string) => {
      const entry = documentStatusMap[status as keyof typeof documentStatusMap];
      if (!entry) return { text: status, className: "text-gray-700 bg-gray-100" };
      return { text: t ? t(entry.textKey as Parameters<typeof t>[0]) : entry.fallback, className: entry.className };
    },
    [documentStatusMap, t]
  );

  return {
    formatConditionStatus,
    formatInteractionMeans,
    formatDocumentType,
    formatDocumentStatus,
  };
};

// Debounced search for large datasets
export const useDebouncedSearch = (delay: number = 300) => {
  const createDebouncedSearch = useCallback(
    <T>(searchFn: (query: string, items: T[]) => T[], items: T[]) => {
      let timeoutId: NodeJS.Timeout;

      return (query: string, callback: (results: T[]) => void) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const results = searchFn(query, items);
          callback(results);
        }, delay);
      };
    },
    [delay]
  );

  return { createDebouncedSearch };
};

// Virtual scrolling for large record lists
export const useVirtualScrolling = (
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const calculateVisibleRange = useCallback(
    (scrollTop: number, totalItems: number) => {
      const visibleItemCount = Math.ceil(containerHeight / itemHeight);
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / itemHeight) - overscan
      );
      const endIndex = Math.min(
        totalItems - 1,
        startIndex + visibleItemCount + overscan * 2
      );

      return {
        startIndex,
        endIndex,
        visibleItemCount,
        totalHeight: totalItems * itemHeight,
        offsetY: startIndex * itemHeight,
      };
    },
    [itemHeight, containerHeight, overscan]
  );

  return { calculateVisibleRange };
};

// Memory-efficient image loading for staff photos
export const useOptimizedImageLoading = () => {
  const createImageLoader = useCallback(() => {
    const imageCache = new Map<string, HTMLImageElement>();
    const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

    return {
      loadImage: (src: string): Promise<HTMLImageElement> => {
        // Return cached image if available
        if (imageCache.has(src)) {
          return Promise.resolve(imageCache.get(src)!);
        }

        // Return existing loading promise if in progress
        if (loadingPromises.has(src)) {
          return loadingPromises.get(src)!;
        }

        // Create new loading promise
        const loadingPromise = new Promise<HTMLImageElement>(
          (resolve, reject) => {
            const img = document.createElement("img");
            img.onload = () => {
              imageCache.set(src, img);
              loadingPromises.delete(src);
              resolve(img);
            };
            img.onerror = () => {
              loadingPromises.delete(src);
              reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
          }
        );

        loadingPromises.set(src, loadingPromise);
        return loadingPromise;
      },

      preloadImages: function (sources: string[]) {
        sources.forEach((src) => {
          if (!imageCache.has(src) && !loadingPromises.has(src)) {
            // Start loading but don't wait for completion
            this.loadImage(src).catch(() => {
              // Ignore preload errors
            });
          }
        });
      },

      clearCache: () => {
        imageCache.clear();
        loadingPromises.clear();
      },

      getCacheSize: () => imageCache.size,
    };
  }, []);

  return { createImageLoader };
};

// Performance metrics for staff detail operations
export class StaffDetailMetrics {
  private static instance: StaffDetailMetrics;
  private metrics: Map<
    string,
    { count: number; totalTime: number; maxTime: number }
  > = new Map();

  static getInstance(): StaffDetailMetrics {
    if (!StaffDetailMetrics.instance) {
      StaffDetailMetrics.instance = new StaffDetailMetrics();
    }
    return StaffDetailMetrics.instance;
  }

  recordOperation(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
    };
    this.metrics.set(operation, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      maxTime: Math.max(existing.maxTime, duration),
    });
  }

  getMetrics(): Record<
    string,
    { average: number; count: number; max: number }
  > {
    const result: Record<
      string,
      { average: number; count: number; max: number }
    > = {};

    this.metrics.forEach((value, key) => {
      result[key] = {
        average: value.totalTime / value.count,
        count: value.count,
        max: value.maxTime,
      };
    });

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Hook to use staff detail performance metrics
export const useStaffDetailMetrics = () => {
  const metricsInstance = StaffDetailMetrics.getInstance();

  const recordMetric = useCallback(
    (operation: string, duration: number) => {
      metricsInstance.recordOperation(operation, duration);
    },
    [metricsInstance]
  );

  const getMetrics = useCallback(() => {
    return metricsInstance.getMetrics();
  }, [metricsInstance]);

  const clearMetrics = useCallback(() => {
    metricsInstance.clearMetrics();
  }, [metricsInstance]);

  return { recordMetric, getMetrics, clearMetrics };
};
