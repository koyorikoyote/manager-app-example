/**
 * Client Utilities Index
 *
 * Centralized exports for all client-side utilities
 */

// Core utilities
export * from "./cn";
export * from "./columnHelpers";
export * from "./localization";

export * from "./tableUtils";
export * from "./validationErrors";

// Performance optimization utilities
export * from "./memoizationUtils";
export * from "./optimizedColumnHelpers";

// Filter utilities
export * from "./filterHelpers";
export * from "./filterConfigLoader";

export * from "./filterStateManager";
export * from "./filterTypeDetection";
export * from "./tableFilterFunctions";

// Responsive design utilities
export * from "./responsiveUtils";
export * from "./breakpointManager";

// Re-export commonly used types and constants
export type { ResponsiveColumnDef, ColumnPriority } from "./columnHelpers";

export type {
  NavigationItemConfig,
  MobileHiddenSearchPage,
  ResponsiveConfig,
} from "./responsiveUtils";

export type { BreakpointConfig } from "./breakpointManager";

export { BREAKPOINTS } from "../hooks/useResponsive";

export {
  MOBILE_HIDDEN_SEARCH_PAGES,
  NAVIGATION_CONFIG,
  RESPONSIVE_LAYOUTS,
} from "./responsiveUtils";

export {
  BREAKPOINT_CONFIGS,
  breakpointUtils,
  cssBreakpoints,
  tailwindBreakpoints,
} from "./breakpointManager";
