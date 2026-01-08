import { useCallback, useMemo } from "react";

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
export const useOptimizedStatusFormatting = () => {
  const conditionStatusMap = useMemo(
    () => ({
      Excellent: {
        text: "Excellent",
        className: "text-green-700 bg-green-100",
      },
      Good: { text: "Good", className: "text-blue-700 bg-blue-100" },
      Fair: { text: "Fair", className: "text-yellow-700 bg-yellow-100" },
      Poor: { text: "Poor", className: "text-red-700 bg-red-100" },
    }),
    []
  );

  const interactionMeansMap = useMemo(
    () => ({
      FACE_TO_FACE: {
        text: "Face to Face",
        className: "text-green-700 bg-green-100",
      },
      ONLINE: { text: "Online", className: "text-blue-700 bg-blue-100" },
      PHONE: { text: "Phone", className: "text-purple-700 bg-purple-100" },
      EMAIL: { text: "Email", className: "text-orange-700 bg-orange-100" },
    }),
    []
  );

  const documentTypeMap = useMemo(
    () => ({
      STAFF: { text: "Staff", className: "text-blue-700 bg-blue-100" },
      PROPERTY: { text: "Property", className: "text-green-700 bg-green-100" },
      COMPANY: { text: "Company", className: "text-purple-700 bg-purple-100" },
    }),
    []
  );

  const documentStatusMap = useMemo(
    () => ({
      ACTIVE: { text: "Active", className: "text-green-700 bg-green-100" },
      EXPIRED: { text: "Expired", className: "text-red-700 bg-red-100" },
      TERMINATED: {
        text: "Terminated",
        className: "text-gray-700 bg-gray-100",
      },
    }),
    []
  );

  const formatConditionStatus = useCallback(
    (status: string) => {
      return (
        conditionStatusMap[status as keyof typeof conditionStatusMap] || {
          text: status,
          className: "text-gray-700 bg-gray-100",
        }
      );
    },
    [conditionStatusMap]
  );

  const formatInteractionMeans = useCallback(
    (means: string) => {
      return (
        interactionMeansMap[means as keyof typeof interactionMeansMap] || {
          text: means,
          className: "text-gray-700 bg-gray-100",
        }
      );
    },
    [interactionMeansMap]
  );

  const formatDocumentType = useCallback(
    (type: string) => {
      return (
        documentTypeMap[type as keyof typeof documentTypeMap] || {
          text: type,
          className: "text-gray-700 bg-gray-100",
        }
      );
    },
    [documentTypeMap]
  );

  const formatDocumentStatus = useCallback(
    (status: string) => {
      return (
        documentStatusMap[status as keyof typeof documentStatusMap] || {
          text: status,
          className: "text-gray-700 bg-gray-100",
        }
      );
    },
    [documentStatusMap]
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
