import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface NavigationState {
  hasNavigatedFromLogin: boolean;
  lastLoginTime: number;
  completedRoutes: string[];
}

interface UseFirstNavigationReturn {
  isFirstNavigation: boolean;
  markNavigationComplete: () => void;
  resetNavigationState: () => void;
}

const STORAGE_KEY = "manager-app-navigation-state";

/**
 * Hook for tracking first-time navigation from login to specific routes
 * Manages navigation state in sessionStorage and resets on logout
 * 
 * @param fromRoute - The route to track navigation from (e.g., "/login")
 * @param toRoute - The route to track navigation to (e.g., "/complaint-details")
 * @returns Object with navigation state and control functions
 */
export function useFirstNavigation(
  fromRoute: string,
  toRoute: string
): UseFirstNavigationReturn {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    hasNavigatedFromLogin: false,
    lastLoginTime: 0,
    completedRoutes: [],
  });

  // Load navigation state from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: NavigationState = JSON.parse(stored);
        setNavigationState(parsed);
      }
    } catch (error) {
      console.warn("Error reading navigation state from sessionStorage:", error);
      // Reset to default state on error
      setNavigationState({
        hasNavigatedFromLogin: false,
        lastLoginTime: 0,
        completedRoutes: [],
      });
    }
  }, []);

  // Save navigation state to sessionStorage when it changes
  const saveNavigationState = useCallback((state: NavigationState) => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setNavigationState(state);
    } catch (error) {
      console.warn("Error saving navigation state to sessionStorage:", error);
    }
  }, []);

  // Reset navigation state (called on logout)
  const resetNavigationState = useCallback(() => {
    const resetState: NavigationState = {
      hasNavigatedFromLogin: false,
      lastLoginTime: 0,
      completedRoutes: [],
    };
    saveNavigationState(resetState);
  }, [saveNavigationState]);

  // Mark navigation as complete for the current route
  const markNavigationComplete = useCallback(() => {
    const routeKey = `${fromRoute}->${toRoute}`;
    if (!navigationState.completedRoutes.includes(routeKey)) {
      const updatedState: NavigationState = {
        ...navigationState,
        completedRoutes: [...navigationState.completedRoutes, routeKey],
      };
      saveNavigationState(updatedState);
    }
  }, [fromRoute, toRoute, navigationState, saveNavigationState]);

  // Track navigation from login route
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check if we're coming from the login route
    const referrer = document.referrer;
    const lastRoute = sessionStorage.getItem('lastRoute');
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    
    const isFromLogin = referrer.includes(fromRoute) || 
                       window.history.state?.from === fromRoute ||
                       lastRoute === fromRoute ||
                       justLoggedIn === 'true';

    // Check if we're on the target route
    const isOnTargetRoute = location.pathname === toRoute;

    if (isFromLogin && isOnTargetRoute) {
      const currentTime = Date.now();
      const updatedState: NavigationState = {
        ...navigationState,
        hasNavigatedFromLogin: true,
        lastLoginTime: currentTime,
      };
      saveNavigationState(updatedState);
      
      // Clear the justLoggedIn flag after using it
      sessionStorage.removeItem('justLoggedIn');
    }
  }, [location.pathname, isAuthenticated, user, fromRoute, toRoute, navigationState, saveNavigationState]);

  // Track route changes to detect login navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store current route for next navigation
    sessionStorage.setItem('lastRoute', location.pathname);
  }, [location.pathname]);

  // Reset navigation state when user logs out
  useEffect(() => {
    if (!isAuthenticated && navigationState.hasNavigatedFromLogin) {
      resetNavigationState();
    }
  }, [isAuthenticated, navigationState.hasNavigatedFromLogin, resetNavigationState]);

  // Determine if this is the first navigation
  const isOnTargetRoute = location.pathname === toRoute;
  
  const isFirstNavigation = 
    isAuthenticated &&
    navigationState.hasNavigatedFromLogin &&
    isOnTargetRoute &&
    !navigationState.completedRoutes.includes(`${fromRoute}->${toRoute}`);





  return {
    isFirstNavigation,
    markNavigationComplete,
    resetNavigationState,
  };
}