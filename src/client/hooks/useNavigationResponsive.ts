/**
 * Navigation-specific responsive hook
 *
 * This hook provides navigation-specific responsive behavior
 * for the reorganized navigation structure.
 */

import { useCallback, useMemo } from "react";
import { useResponsive } from "./useResponsive";
import { useMobileDetection } from "./useTouch";
import {
  getNavigationMode,
  shouldUseSidebarOverlay,
  getDefaultViewMode,
  getNavigationItemsByLocation,
  shouldShowSearchComponent,
  type NavigationItemConfig,
} from "../utils/responsiveUtils";

export interface NavigationResponsiveState {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Navigation mode
  navigationMode: "mobile" | "hybrid" | "desktop";
  shouldUseMobileNavigation: boolean;
  shouldShowSidebarOverlay: boolean;

  // Component visibility
  shouldHideSearchComponents: boolean;
  shouldUseCardViewDefault: boolean;

  // Navigation items
  headerItems: NavigationItemConfig[];
  sidebarItems: NavigationItemConfig[];

  // Utility functions
  getSearchVisibility: (pageName: string) => boolean;
  getViewModeDefault: () => "cards" | "table";
  getSidebarMode: () => "fixed" | "overlay";
}

/**
 * Hook for navigation-specific responsive behavior
 */
export const useNavigationResponsive = (): NavigationResponsiveState => {
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  const mobileDetection = useMobileDetection();

  // Navigation mode based on screen size
  const navigationMode = useMemo(() => getNavigationMode(width), [width]);

  // Navigation items by location
  const headerItems = useMemo(() => getNavigationItemsByLocation("header"), []);
  const sidebarItems = useMemo(
    () => getNavigationItemsByLocation("sidebar"),
    []
  );

  // Utility functions
  const getSearchVisibility = useCallback(
    (pageName: string) => {
      return shouldShowSearchComponent(pageName, isMobile);
    },
    [isMobile]
  );

  const getViewModeDefault = useCallback(() => {
    return getDefaultViewMode(isMobile, isTablet);
  }, [isMobile, isTablet]);

  const getSidebarMode = useCallback((): "fixed" | "overlay" => {
    return shouldUseSidebarOverlay(isMobile, isTablet) ? "overlay" : "fixed";
  }, [isMobile, isTablet]);

  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,

    // Navigation mode
    navigationMode,
    shouldUseMobileNavigation: mobileDetection.shouldUseMobileNavigation,
    shouldShowSidebarOverlay: mobileDetection.shouldShowSidebarOverlay,

    // Component visibility
    shouldHideSearchComponents: mobileDetection.shouldHideSearchComponents,
    shouldUseCardViewDefault: mobileDetection.shouldUseCardViewDefault,

    // Navigation items
    headerItems,
    sidebarItems,

    // Utility functions
    getSearchVisibility,
    getViewModeDefault,
    getSidebarMode,
  };
};

/**
 * Hook for managing responsive navigation state transitions
 */
export const useNavigationTransitions = () => {
  const { isMobile, width } = useResponsive();

  const getTransitionClasses = useCallback(
    (component: "sidebar" | "header" | "search" | "content") => {
      const baseTransition = "transition-all duration-300 ease-in-out";

      switch (component) {
        case "sidebar":
          return `${baseTransition} ${isMobile ? "transform" : ""}`;
        case "header":
          return `${baseTransition}`;
        case "search":
          return `${baseTransition} ${isMobile ? "opacity-0" : "opacity-100"}`;
        case "content":
          return `${baseTransition}`;
        default:
          return baseTransition;
      }
    },
    [isMobile]
  );

  const getSidebarTransform = useCallback(
    (isOpen: boolean) => {
      if (!isMobile) return "";
      return isOpen ? "translate-x-0" : "-translate-x-full";
    },
    [isMobile]
  );

  return {
    getTransitionClasses,
    getSidebarTransform,
    shouldAnimate: width > 0, // Only animate after initial render
  };
};

/**
 * Hook for responsive touch and gesture handling
 */
export const useNavigationGestures = () => {
  const { isMobile, isTouch } = useMobileDetection();

  const shouldEnableSwipeGestures = isMobile && isTouch;
  const shouldEnableTouchOptimization = isTouch;

  const getTouchTargetSize = useCallback(
    (baseSize: number = 44) => {
      return shouldEnableTouchOptimization ? Math.max(baseSize, 44) : baseSize;
    },
    [shouldEnableTouchOptimization]
  );

  const getSwipeThreshold = useCallback(() => {
    return isMobile ? 50 : 100; // Lower threshold on mobile for easier swiping
  }, [isMobile]);

  return {
    shouldEnableSwipeGestures,
    shouldEnableTouchOptimization,
    getTouchTargetSize,
    getSwipeThreshold,
  };
};

/**
 * Hook for managing responsive layout spacing
 */
export const useResponsiveSpacing = () => {
  const { isMobile, isTablet } = useResponsive();

  const getSpacing = useCallback(
    (size: "xs" | "sm" | "md" | "lg" | "xl"): string => {
      const spacingMap = {
        mobile: {
          xs: "p-1",
          sm: "p-2",
          md: "p-3",
          lg: "p-4",
          xl: "p-6",
        },
        tablet: {
          xs: "p-2",
          sm: "p-3",
          md: "p-4",
          lg: "p-6",
          xl: "p-8",
        },
        desktop: {
          xs: "p-2",
          sm: "p-4",
          md: "p-6",
          lg: "p-8",
          xl: "p-12",
        },
      };

      if (isMobile) return spacingMap.mobile[size];
      if (isTablet) return spacingMap.tablet[size];
      return spacingMap.desktop[size];
    },
    [isMobile, isTablet]
  );

  const getMargin = useCallback(
    (size: "xs" | "sm" | "md" | "lg" | "xl"): string => {
      const marginMap = {
        mobile: {
          xs: "m-1",
          sm: "m-2",
          md: "m-3",
          lg: "m-4",
          xl: "m-6",
        },
        tablet: {
          xs: "m-2",
          sm: "m-3",
          md: "m-4",
          lg: "m-6",
          xl: "m-8",
        },
        desktop: {
          xs: "m-2",
          sm: "m-4",
          md: "m-6",
          lg: "m-8",
          xl: "m-12",
        },
      };

      if (isMobile) return marginMap.mobile[size];
      if (isTablet) return marginMap.tablet[size];
      return marginMap.desktop[size];
    },
    [isMobile, isTablet]
  );

  const getGap = useCallback(
    (size: "xs" | "sm" | "md" | "lg" | "xl"): string => {
      const gapMap = {
        mobile: {
          xs: "gap-1",
          sm: "gap-2",
          md: "gap-3",
          lg: "gap-4",
          xl: "gap-6",
        },
        tablet: {
          xs: "gap-2",
          sm: "gap-3",
          md: "gap-4",
          lg: "gap-6",
          xl: "gap-8",
        },
        desktop: {
          xs: "gap-2",
          sm: "gap-4",
          md: "gap-6",
          lg: "gap-8",
          xl: "gap-12",
        },
      };

      if (isMobile) return gapMap.mobile[size];
      if (isTablet) return gapMap.tablet[size];
      return gapMap.desktop[size];
    },
    [isMobile, isTablet]
  );

  return {
    getSpacing,
    getMargin,
    getGap,
    containerPadding: isMobile ? "px-4" : isTablet ? "px-6" : "px-8",
    sectionSpacing: isMobile
      ? "space-y-4"
      : isTablet
      ? "space-y-6"
      : "space-y-8",
  };
};
