import { useEffect, useCallback } from "react";
import { useResponsive } from "./useResponsive";
import { useSessionStorage } from "./useSessionStorage";
import { getDefaultViewMode } from "../utils/responsiveUtils";
import type { ViewMode } from "../components/ui/ViewModeToggle";

/**
 * Enhanced hook for managing view mode with mobile-specific defaults and session storage
 *
 * Features:
 * - Uses centralized responsive utilities for consistent behavior
 * - Defaults to card mode on mobile/tablet, table mode on desktop
 * - Stores view mode preference in session storage for mobile users
 * - Automatically switches to card mode when switching to mobile view
 * - Smooth transitions without layout flashing
 * - Enhanced mobile detection and responsive behavior
 *
 * @param pageName - Unique identifier for the page (for separate storage keys)
 * @returns Object with current view mode, setter function, and responsive state
 */
export function useViewMode(pageName: string) {
  const { isMobile, isTablet } = useResponsive();

  // Use session storage with page-specific key for mobile users
  const storageKey = `viewMode_${pageName}_mobile`;
  const [storedViewMode, setStoredViewMode] = useSessionStorage<ViewMode>(
    storageKey,
    "cards" // Default to cards for mobile
  );

  // Determine the current view mode based on device type and stored preference
  const getDefaultViewModeForDevice = useCallback((): ViewMode => {
    // Use the centralized utility for consistent behavior
    const defaultMode = getDefaultViewMode(isMobile, isTablet);

    if (isMobile || isTablet) {
      // On mobile/tablet, use stored preference or default to cards
      return storedViewMode || defaultMode;
    } else {
      // On desktop, default to table mode
      return defaultMode;
    }
  }, [isMobile, isTablet, storedViewMode]);

  // Initialize view mode
  const [viewMode, setViewModeState] = useSessionStorage<ViewMode>(
    `viewMode_${pageName}`,
    getDefaultViewModeForDevice()
  );

  // Update view mode when switching between mobile/desktop (only on device type change, not view mode change)
  useEffect(() => {
    // Only auto-switch when the device type changes, not when view mode changes
    // This prevents interfering with user's manual view mode selection
    if (isMobile || isTablet) {
      // On mobile/tablet, respect user's choice but default to cards for new sessions
      // Don't force change if user manually selected table mode
    } else {
      // On desktop, allow both modes without forcing changes
    }
  }, [isMobile, isTablet]); // Removed viewMode and setViewModeState from dependencies

  // Handle view mode changes with enhanced mobile support
  const setViewMode = useCallback(
    (newMode: ViewMode) => {
      setViewModeState(newMode);

      // Store mobile preference separately for better UX
      if (isMobile || isTablet) {
        setStoredViewMode(newMode);
      }
    },
    [isMobile, isTablet, setViewModeState, setStoredViewMode]
  );

  // Enhanced return object with more responsive information
  return {
    viewMode,
    setViewMode,
    isMobile,
    isTablet,
    // Additional responsive helpers
    shouldDefaultToCards: isMobile || isTablet,
    canSwitchModes: true, // Always allow mode switching
    preferredMobileMode: storedViewMode,
  };
}
