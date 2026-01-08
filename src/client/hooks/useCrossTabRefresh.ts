import { useEffect, useCallback } from "react";

export interface CrossTabRefreshEvent {
  type: "RECORD_DELETED" | "RECORD_CREATED" | "RECORD_UPDATED";
  entityType: "staff" | "destination" | "property";
  timestamp: number;
}

/**
 * Hook to listen for cross-tab refresh events
 * Used to refresh data when records are created, updated, or deleted from other tabs
 */
export const useCrossTabRefresh = (
  entityType: "staff" | "destination" | "property",
  onRefresh: () => void
) => {
  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === "crossTabRefresh" && event.newValue) {
        try {
          const refreshEvent: CrossTabRefreshEvent = JSON.parse(event.newValue);

          // Only refresh if the event is for the same entity type
          if (
            (refreshEvent.type === "RECORD_DELETED" ||
              refreshEvent.type === "RECORD_CREATED" ||
              refreshEvent.type === "RECORD_UPDATED") &&
            refreshEvent.entityType === entityType
          ) {
            // Add a small delay to ensure the operation is complete
            setTimeout(() => {
              onRefresh();
            }, 100);
          }
        } catch (error) {
          console.error("Failed to parse cross-tab refresh event:", error);
        }
      }
    },
    [entityType, onRefresh]
  );

  useEffect(() => {
    // Listen for storage events (cross-tab communication)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleStorageChange]);
};
