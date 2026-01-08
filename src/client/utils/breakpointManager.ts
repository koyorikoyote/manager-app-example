/**
 * Breakpoint Management Utility
 *
 * Centralized breakpoint management for consistent responsive behavior
 * across the Manager App navigation improvements.
 */

import { BREAKPOINTS } from "../hooks/useResponsive";
import { debounce, throttle } from "./responsiveUtils";

export interface BreakpointConfig {
  name: string;
  minWidth: number;
  maxWidth?: number;
  features: {
    navigation: "mobile" | "desktop" | "hybrid";
    sidebar: "overlay" | "fixed" | "hidden";
    search: "visible" | "hidden" | "conditional";
    viewMode: "card" | "table" | "auto";
    touchOptimized: boolean;
  };
}

export const BREAKPOINT_CONFIGS: BreakpointConfig[] = [
  {
    name: "mobile",
    minWidth: 0,
    maxWidth: BREAKPOINTS.mobile - 1,
    features: {
      navigation: "mobile",
      sidebar: "overlay",
      search: "conditional",
      viewMode: "card",
      touchOptimized: true,
    },
  },
  {
    name: "tablet",
    minWidth: BREAKPOINTS.mobile,
    maxWidth: BREAKPOINTS.tablet - 1,
    features: {
      navigation: "hybrid",
      sidebar: "overlay",
      search: "visible",
      viewMode: "card",
      touchOptimized: true,
    },
  },
  {
    name: "desktop",
    minWidth: BREAKPOINTS.tablet,
    maxWidth: BREAKPOINTS.desktop - 1,
    features: {
      navigation: "desktop",
      sidebar: "fixed",
      search: "visible",
      viewMode: "table",
      touchOptimized: false,
    },
  },
  {
    name: "largeDesktop",
    minWidth: BREAKPOINTS.desktop,
    features: {
      navigation: "desktop",
      sidebar: "fixed",
      search: "visible",
      viewMode: "table",
      touchOptimized: false,
    },
  },
];

/**
 * Breakpoint Manager Class
 * Provides centralized breakpoint management with event handling
 */
export class BreakpointManager {
  private currentBreakpoint: BreakpointConfig | null = null;
  private listeners: Map<string, ((config: BreakpointConfig) => void)[]> =
    new Map();
  private resizeHandler: () => void;
  private orientationHandler: () => void;

  constructor() {
    this.resizeHandler = debounce(this.handleResize.bind(this), 150);
    this.orientationHandler = throttle(
      this.handleOrientationChange.bind(this),
      100
    );

    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private initialize(): void {
    this.updateBreakpoint();
    window.addEventListener("resize", this.resizeHandler, { passive: true });
    window.addEventListener("orientationchange", this.orientationHandler, {
      passive: true,
    });
  }

  private handleResize(): void {
    this.updateBreakpoint();
  }

  private handleOrientationChange(): void {
    // Delay to allow orientation change to complete
    setTimeout(() => {
      this.updateBreakpoint();
    }, 100);
  }

  private updateBreakpoint(): void {
    const width = window.innerWidth;
    const newBreakpoint = this.getBreakpointForWidth(width);

    if (
      !this.currentBreakpoint ||
      newBreakpoint.name !== this.currentBreakpoint.name
    ) {
      const previousBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      this.notifyListeners(newBreakpoint, previousBreakpoint);
    }
  }

  private getBreakpointForWidth(width: number): BreakpointConfig {
    return (
      BREAKPOINT_CONFIGS.find((config) => {
        if (config.maxWidth) {
          return width >= config.minWidth && width <= config.maxWidth;
        }
        return width >= config.minWidth;
      }) || BREAKPOINT_CONFIGS[BREAKPOINT_CONFIGS.length - 1]
    );
  }

  private notifyListeners(
    newBreakpoint: BreakpointConfig,
    previousBreakpoint: BreakpointConfig | null
  ): void {
    // Notify general listeners
    const generalListeners = this.listeners.get("*") || [];
    generalListeners.forEach((listener) => listener(newBreakpoint));

    // Notify specific breakpoint listeners
    const specificListeners = this.listeners.get(newBreakpoint.name) || [];
    specificListeners.forEach((listener) => listener(newBreakpoint));

    // Notify transition listeners
    if (previousBreakpoint) {
      const transitionKey = `${previousBreakpoint.name}->${newBreakpoint.name}`;
      const transitionListeners = this.listeners.get(transitionKey) || [];
      transitionListeners.forEach((listener) => listener(newBreakpoint));
    }
  }

  /**
   * Subscribe to breakpoint changes
   */
  public subscribe(
    breakpointOrPattern: string,
    callback: (config: BreakpointConfig) => void
  ): () => void {
    if (!this.listeners.has(breakpointOrPattern)) {
      this.listeners.set(breakpointOrPattern, []);
    }

    this.listeners.get(breakpointOrPattern)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(breakpointOrPattern);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get current breakpoint configuration
   */
  public getCurrentBreakpoint(): BreakpointConfig | null {
    return this.currentBreakpoint;
  }

  /**
   * Check if current breakpoint matches a condition
   */
  public matches(
    condition: string | ((config: BreakpointConfig) => boolean)
  ): boolean {
    if (!this.currentBreakpoint) return false;

    if (typeof condition === "string") {
      return this.currentBreakpoint.name === condition;
    }

    return condition(this.currentBreakpoint);
  }

  /**
   * Get feature value for current breakpoint
   */
  public getFeature<K extends keyof BreakpointConfig["features"]>(
    feature: K
  ): BreakpointConfig["features"][K] | null {
    return this.currentBreakpoint?.features[feature] || null;
  }

  /**
   * Check if current breakpoint supports a feature
   */
  public supportsFeature(
    feature: keyof BreakpointConfig["features"],
    value: unknown
  ): boolean {
    const currentValue = this.getFeature(feature);
    return currentValue === value;
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.resizeHandler);
      window.removeEventListener("orientationchange", this.orientationHandler);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let breakpointManagerInstance: BreakpointManager | null = null;

/**
 * Get the singleton breakpoint manager instance
 */
export const getBreakpointManager = (): BreakpointManager => {
  if (!breakpointManagerInstance) {
    breakpointManagerInstance = new BreakpointManager();
  }
  return breakpointManagerInstance;
};

/**
 * Hook for using the breakpoint manager
 */
export const useBreakpointManager = () => {
  return getBreakpointManager();
};

/**
 * Utility functions for common breakpoint checks
 */
export const breakpointUtils = {
  /**
   * Check if current viewport is mobile
   */
  isMobile: (): boolean => {
    const manager = getBreakpointManager();
    return manager.matches("mobile");
  },

  /**
   * Check if current viewport is tablet
   */
  isTablet: (): boolean => {
    const manager = getBreakpointManager();
    return manager.matches("tablet");
  },

  /**
   * Check if current viewport is desktop or larger
   */
  isDesktop: (): boolean => {
    const manager = getBreakpointManager();
    return manager.matches(
      (config) => config.name === "desktop" || config.name === "largeDesktop"
    );
  },

  /**
   * Check if touch optimization should be enabled
   */
  shouldOptimizeForTouch: (): boolean => {
    const manager = getBreakpointManager();
    return manager.getFeature("touchOptimized") === true;
  },

  /**
   * Get recommended navigation mode
   */
  getNavigationMode: (): "mobile" | "desktop" | "hybrid" => {
    const manager = getBreakpointManager();
    return manager.getFeature("navigation") || "desktop";
  },

  /**
   * Get recommended sidebar mode
   */
  getSidebarMode: (): "overlay" | "fixed" | "hidden" => {
    const manager = getBreakpointManager();
    return manager.getFeature("sidebar") || "fixed";
  },

  /**
   * Get recommended view mode
   */
  getViewMode: (): "card" | "table" | "auto" => {
    const manager = getBreakpointManager();
    return manager.getFeature("viewMode") || "table";
  },

  /**
   * Check search visibility
   */
  getSearchVisibility: (): "visible" | "hidden" | "conditional" => {
    const manager = getBreakpointManager();
    return manager.getFeature("search") || "visible";
  },
};

/**
 * CSS-in-JS breakpoint utilities
 */
export const cssBreakpoints = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${
    BREAKPOINTS.tablet - 1
  }px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
  largeDesktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,

  // Utility functions
  up: (breakpoint: keyof typeof BREAKPOINTS) =>
    `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`,

  down: (breakpoint: keyof typeof BREAKPOINTS) =>
    `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,

  between: (min: keyof typeof BREAKPOINTS, max: keyof typeof BREAKPOINTS) =>
    `@media (min-width: ${BREAKPOINTS[min]}px) and (max-width: ${
      BREAKPOINTS[max] - 1
    }px)`,
};

/**
 * Tailwind CSS breakpoint classes
 */
export const tailwindBreakpoints = {
  mobile: "sm:",
  tablet: "md:",
  desktop: "lg:",
  largeDesktop: "xl:",

  // Responsive visibility classes
  showOnMobile: "block sm:hidden",
  hideOnMobile: "hidden sm:block",
  showOnTablet: "hidden md:block lg:hidden",
  showOnDesktop: "hidden lg:block",

  // Responsive layout classes
  mobileStack: "flex-col sm:flex-row",
  tabletGrid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  responsivePadding: "p-4 md:p-6 lg:p-8",
  responsiveMargin: "m-4 md:m-6 lg:m-8",
  responsiveGap: "gap-4 md:gap-6 lg:gap-8",
};
