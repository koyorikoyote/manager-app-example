/**
 * Responsive Design Utilities for Navigation Improvements
 *
 * This module provides utilities for managing responsive behavior
 * specifically for the navigation reorganization and mobile enhancements.
 */

import { BREAKPOINTS } from "../hooks/useResponsive";

export interface ResponsiveConfig {
  mobile: {
    maxWidth: number;
    navigation: "mobile";
    sidebar: "overlay";
    searchVisibility: "conditional";
    defaultViewMode: "cards";
  };
  tablet: {
    minWidth: number;
    maxWidth: number;
    navigation: "hybrid";
    sidebar: "overlay";
    searchVisibility: "visible";
    defaultViewMode: "cards";
  };
  desktop: {
    minWidth: number;
    navigation: "desktop";
    sidebar: "fixed";
    searchVisibility: "visible";
    defaultViewMode: "table";
  };
}

export const RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobile: {
    maxWidth: BREAKPOINTS.mobile,
    navigation: "mobile",
    sidebar: "overlay",
    searchVisibility: "conditional",
    defaultViewMode: "cards",
  },
  tablet: {
    minWidth: BREAKPOINTS.mobile,
    maxWidth: BREAKPOINTS.tablet,
    navigation: "hybrid",
    sidebar: "overlay",
    searchVisibility: "visible",
    defaultViewMode: "cards",
  },
  desktop: {
    minWidth: BREAKPOINTS.tablet,
    navigation: "desktop",
    sidebar: "fixed",
    searchVisibility: "visible",
    defaultViewMode: "table",
  },
};

/**
 * Pages where search components should be hidden on mobile
 */
export const MOBILE_HIDDEN_SEARCH_PAGES = [
  "staff",
  "destinations",
  "interactions",
  "properties",
  "complaint-details",
  "daily-record",
  "inquiries-notifications",
] as const;

export type MobileHiddenSearchPage =
  (typeof MOBILE_HIDDEN_SEARCH_PAGES)[number];

/**
 * Navigation item configuration for reorganized layout
 */
export interface NavigationItemConfig {
  id: string;
  label: string;
  path: string;
  location: "header" | "sidebar";
  priority: "primary" | "secondary";
  mobileVisible: boolean;
  desktopVisible: boolean;
}

export const NAVIGATION_CONFIG: NavigationItemConfig[] = [
  // Header navigation items (top navbar)
  {
    id: "staff",
    label: "Staff",
    path: "/staff",
    location: "header",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "daily-record",
    label: "Daily Record",
    path: "/daily-record",
    location: "header",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "inquiries-notifications",
    label: "Inquiries & Notifications",
    path: "/inquiries-notifications",
    location: "header",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  // Sidebar navigation items (left sidebar)
  {
    id: "destinations",
    label: "Destinations",
    path: "/destinations",
    location: "sidebar",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "interactions",
    label: "Interaction Records",
    path: "/interactions",
    location: "sidebar",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "properties",
    label: "Properties",
    path: "/properties",
    location: "sidebar",
    priority: "primary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "summary",
    label: "Summary",
    path: "/summary",
    location: "sidebar",
    priority: "secondary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "attendance",
    label: "Attendance",
    path: "/attendance",
    location: "sidebar",
    priority: "secondary",
    mobileVisible: true,
    desktopVisible: true,
  },
  {
    id: "manual",
    label: "Manual",
    path: "/manual",
    location: "sidebar",
    priority: "secondary",
    mobileVisible: true,
    desktopVisible: true,
  },
];

/**
 * Get navigation items for a specific location
 */
export const getNavigationItemsByLocation = (
  location: "header" | "sidebar"
): NavigationItemConfig[] => {
  return NAVIGATION_CONFIG.filter((item) => item.location === location);
};

/**
 * Get navigation items by priority
 */
export const getNavigationItemsByPriority = (
  priority: "primary" | "secondary"
): NavigationItemConfig[] => {
  return NAVIGATION_CONFIG.filter((item) => item.priority === priority);
};

/**
 * Check if search component should be visible on a page
 */
export const shouldShowSearchComponent = (
  pageName: string,
  isMobile: boolean
): boolean => {
  if (!isMobile) return true;
  return !MOBILE_HIDDEN_SEARCH_PAGES.includes(
    pageName as MobileHiddenSearchPage
  );
};

/**
 * Get default view mode for a device type
 */
export const getDefaultViewMode = (
  isMobile: boolean,
  isTablet: boolean
): "cards" | "table" => {
  if (isMobile || isTablet) return "cards";
  return "table";
};

/**
 * Check if sidebar should be shown as overlay
 */
export const shouldUseSidebarOverlay = (
  isMobile: boolean,
  isTablet: boolean
): boolean => {
  return isMobile || isTablet;
};

/**
 * Get responsive navigation mode
 */
export const getNavigationMode = (
  width: number
): "mobile" | "hybrid" | "desktop" => {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "hybrid";
  return "desktop";
};

/**
 * Get touch-friendly sizing for interactive elements
 */
export const getTouchFriendlySize = (
  isMobile: boolean,
  baseSize: number = 32
): number => {
  return isMobile ? Math.max(baseSize, 44) : baseSize; // 44px minimum for touch targets
};

/**
 * Get responsive spacing values
 */
export const getResponsiveSpacing = (
  isMobile: boolean,
  baseSpacing: number = 16
): number => {
  return isMobile ? baseSpacing * 0.75 : baseSpacing; // Slightly tighter spacing on mobile
};

/**
 * Check if device supports hover interactions
 */
export const supportsHover = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover)").matches;
};

/**
 * Get responsive font sizes
 */
export const getResponsiveFontSize = (
  isMobile: boolean,
  baseFontSize: number = 14
): number => {
  return isMobile ? Math.max(baseFontSize, 16) : baseFontSize; // Minimum 16px on mobile for accessibility
};

/**
 * Utility for managing responsive class names
 */
export const getResponsiveClasses = (config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  base?: string;
}): string => {
  const classes: string[] = [];

  if (config.base) classes.push(config.base);
  if (config.mobile) classes.push(`sm:${config.mobile}`);
  if (config.tablet) classes.push(`md:${config.tablet}`);
  if (config.desktop) classes.push(`lg:${config.desktop}`);

  return classes.join(" ");
};

/**
 * Debounce utility for responsive event handlers
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle utility for responsive event handlers
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Media query utilities for responsive design
 */
export const mediaQueries = {
  mobile: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${
    BREAKPOINTS.tablet - 1
  }px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet}px)`,
  largeDesktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  touch: "(hover: none) and (pointer: coarse)",
  hover: "(hover: hover) and (pointer: fine)",
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
} as const;

/**
 * Check if current viewport matches a media query
 */
export const matchesMediaQuery = (query: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
};

/**
 * Get current breakpoint name
 */
export const getCurrentBreakpoint = (
  width: number
): keyof typeof BREAKPOINTS | "largeDesktop" => {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "tablet";
  if (width < BREAKPOINTS.desktop) return "desktop";
  return "largeDesktop";
};

/**
 * Responsive layout configuration for different components
 */
export const RESPONSIVE_LAYOUTS = {
  dataTable: {
    mobile: {
      defaultView: "cards",
      showPagination: true,
      itemsPerPage: 10,
      showColumnToggle: false,
    },
    tablet: {
      defaultView: "cards",
      showPagination: true,
      itemsPerPage: 15,
      showColumnToggle: true,
    },
    desktop: {
      defaultView: "table",
      showPagination: true,
      itemsPerPage: 20,
      showColumnToggle: true,
    },
  },
  navigation: {
    mobile: {
      headerItems: ["staff", "daily-record", "inquiries-notifications"],
      sidebarItems: [
        "destinations",
        "interactions",
        "properties",
        "summary",
        "attendance",
        "manual",
      ],
      showSidebarOverlay: true,
      enableSwipeGestures: true,
    },
    desktop: {
      headerItems: ["staff", "daily-record", "inquiries-notifications"],
      sidebarItems: [
        "destinations",
        "interactions",
        "properties",
        "summary",
        "attendance",
        "manual",
      ],
      showSidebarOverlay: false,
      enableSwipeGestures: false,
    },
  },
  search: {
    mobile: {
      showInlineFilters: false,
      useFilterDialog: true,
      hideOnPages: MOBILE_HIDDEN_SEARCH_PAGES,
    },
    desktop: {
      showInlineFilters: true,
      useFilterDialog: false,
      hideOnPages: [],
    },
  },
} as const;
