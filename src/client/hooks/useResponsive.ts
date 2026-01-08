import { useState, useEffect } from "react";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

export interface NavigationBreakpoints {
  showMobileNavigation: boolean;
  showDesktopNavigation: boolean;
  showSidebarOverlay: boolean;
  enableTouchNavigation: boolean;
}

/**
 * Hook for responsive breakpoint detection with enhanced navigation support
 * @returns Current breakpoint state and screen dimensions
 */
export const useResponsive = (): BreakpointState => {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(
    () => {
      if (typeof window === "undefined") {
        return {
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          isLargeDesktop: false,
          width: 1024,
          height: 768,
        };
      }

      const width = window.innerWidth;
      const height = window.innerHeight;

      return {
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isLargeDesktop: width >= BREAKPOINTS.desktop,
        width,
        height,
      };
    }
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpointState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isLargeDesktop: width >= BREAKPOINTS.desktop,
        width,
        height,
      });
    };

    // Use passive listeners for better performance
    const options = { passive: true };
    window.addEventListener("resize", handleResize, options);
    window.addEventListener("orientationchange", handleResize, options);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return breakpointState;
};

/**
 * Hook for detecting if current screen size matches a specific breakpoint
 * @param breakpoint - The breakpoint to check against
 * @returns Boolean indicating if the breakpoint matches
 */
export const useBreakpoint = (
  breakpoint: keyof typeof BREAKPOINTS
): boolean => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();

  switch (breakpoint) {
    case "mobile":
      return isMobile;
    case "tablet":
      return isTablet;
    case "desktop":
      return isDesktop || isLargeDesktop;
    default:
      return false;
  }
};

/**
 * Hook for navigation-specific breakpoint detection
 * @returns Navigation-specific breakpoint configuration
 */
export const useNavigationBreakpoints = (): NavigationBreakpoints => {
  const { isMobile, isTablet, width } = useResponsive();

  return {
    showMobileNavigation: isMobile,
    showDesktopNavigation: !isMobile,
    showSidebarOverlay: isMobile || isTablet,
    enableTouchNavigation: isMobile || isTablet || width < 1200,
  };
};

/**
 * Hook for getting responsive column visibility configuration
 * @param columnConfig - Configuration object defining which columns to show at each breakpoint
 * @returns Object with column visibility settings
 */
export const useResponsiveColumns = <
  T extends Record<string, boolean>
>(columnConfig: {
  mobile: T;
  tablet: T;
  desktop: T;
}): T => {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return columnConfig.mobile;
  }

  if (isTablet) {
    return columnConfig.tablet;
  }

  return columnConfig.desktop;
};

/**
 * Hook for managing mobile-specific component visibility
 * @param pageName - The current page name
 * @param componentType - Type of component to check visibility for
 * @returns Boolean indicating if component should be visible
 */
export const useMobileComponentVisibility = (
  pageName: string,
  componentType: "search" | "filters" | "navigation" | "sidebar"
): boolean => {
  const { isMobile } = useResponsive();

  const hiddenSearchPages = [
    "staff",
    "destinations",
    "interactions",
    "properties",
    "complaint-details",
    "daily-record",
    "inquiries-notifications",
  ];

  switch (componentType) {
    case "search":
      return !(isMobile && hiddenSearchPages.includes(pageName));
    case "filters":
      return true; // Filters are always shown but may be in different layouts
    case "navigation":
      return true; // Navigation is always shown but in different positions
    case "sidebar":
      return !isMobile; // Sidebar is hidden on mobile (shown as overlay)
    default:
      return true;
  }
};

/**
 * Hook for responsive layout transitions with debouncing
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced breakpoint state
 */
export const useDebouncedResponsive = (
  delay: number = 150
): BreakpointState => {
  const breakpointState = useResponsive();
  const [debouncedState, setDebouncedState] = useState(breakpointState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(breakpointState);
    }, delay);

    return () => clearTimeout(timer);
  }, [breakpointState, delay]);

  return debouncedState;
};
