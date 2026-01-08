import { useEffect, useRef, useState } from "react";

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  direction: "left" | "right" | "up" | "down" | null;
  distance: number;
  velocity: number;
}

interface UseTouchOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  onTap?: (position: TouchPosition) => void;
  onLongPress?: (position: TouchPosition) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  velocityThreshold?: number;
}

export const useTouch = (options: UseTouchOptions = {}) => {
  const {
    onSwipe,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    velocityThreshold = 0.3,
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
    setIsLongPressing(false);

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress(touchStartRef.current!);
      }, longPressDelay);
    }
  };

  const handleTouchMove = (_e: React.TouchEvent<HTMLElement>) => {
    // Cancel long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current || isLongPressing) {
      setIsLongPressing(false);
      return;
    }

    const touch = e.changedTouches[0];
    const touchEnd = { x: touch.clientX, y: touch.clientY };
    const touchEndTime = Date.now();

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = touchEndTime - touchStartTimeRef.current;
    const velocity = distance / duration;

    // Determine if it's a swipe or tap
    if (distance > swipeThreshold && velocity > velocityThreshold) {
      // It's a swipe
      let direction: "left" | "right" | "up" | "down";

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        direction = deltaX > 0 ? "right" : "left";
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? "down" : "up";
      }

      onSwipe?.({
        direction,
        distance,
        velocity,
      });
    } else if (distance < 10 && duration < 300) {
      // It's a tap
      onTap?.(touchEnd);
    }

    touchStartRef.current = null;
    setIsLongPressing(false);
  };

  const bindTouch = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    bindTouch,
    isLongPressing,
  };
};

// Hook for pull-to-refresh functionality
export const usePullToRefresh = (onRefresh: () => Promise<void> | void) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isAtTopRef = useRef<boolean>(true);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;

    // Check if we're at the top of the page
    isAtTopRef.current = window.scrollY === 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAtTopRef.current || isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY > 0) {
      // Pulling down
      setPullDistance(Math.min(deltaY * 0.5, 100)); // Damping effect
      e.preventDefault(); // Prevent default scroll behavior
    }
  };

  const handleTouchEnd = async (_e: React.TouchEvent<HTMLDivElement>) => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const bindPullToRefresh = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    bindPullToRefresh,
    isRefreshing,
    pullDistance,
  };
};

// Enhanced mobile detection with navigation-specific features
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [navigationMode, setNavigationMode] = useState<"mobile" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const orient = height > width ? "portrait" : "landscape";

      // Determine device type
      let device: "mobile" | "tablet" | "desktop";
      if (mobile) {
        device = "mobile";
      } else if (tablet) {
        device = "tablet";
      } else {
        device = "desktop";
      }

      // Determine navigation mode (mobile navigation for mobile and small tablets)
      const navMode = width < 1024 ? "mobile" : "desktop";

      setIsMobile(mobile);
      setIsTouch(touch);
      setOrientation(orient);
      setDeviceType(device);
      setNavigationMode(navMode);
    };

    checkMobile();

    // Use passive listeners for better performance
    const options = { passive: true };
    window.addEventListener("resize", checkMobile, options);
    window.addEventListener("orientationchange", checkMobile, options);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return {
    isMobile,
    isTouch,
    orientation,
    deviceType,
    navigationMode,
    // Navigation-specific helpers
    shouldUseMobileNavigation: navigationMode === "mobile",
    shouldShowSidebarOverlay: isMobile || deviceType === "tablet",
    shouldHideSearchComponents: isMobile,
    shouldUseCardViewDefault: isMobile,
  };
};
