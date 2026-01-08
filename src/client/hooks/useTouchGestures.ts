import { useCallback, useRef, useEffect } from "react";

interface TouchGestureOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
  preventScroll?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onPinch,
    threshold = 50,
    preventScroll = false,
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const initialPinchDistance = useRef<number | null>(null);

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - track for swipe gestures
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now(),
        };
      } else if (e.touches.length === 2 && onPinch) {
        // Two touches - track for pinch gestures
        initialPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
      }

      if (preventScroll && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    [getDistance, onPinch, preventScroll]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && onPinch && initialPinchDistance.current) {
        // Handle pinch gesture
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistance.current;
        onPinch(scale);

        if (preventScroll) {
          e.preventDefault();
        }
      }
    },
    [getDistance, onPinch, preventScroll]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && touchStartRef.current) {
        // Single touch end - check for swipe gestures
        const touch = e.changedTouches[0];
        touchEndRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now(),
        };

        const deltaX = touchEndRef.current.x - touchStartRef.current.x;
        const deltaY = touchEndRef.current.y - touchStartRef.current.y;
        const deltaTime =
          touchEndRef.current.timestamp - touchStartRef.current.timestamp;

        // Only process swipes that are fast enough (within 300ms) and long enough
        if (
          deltaTime < 300 &&
          (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)
        ) {
          // Determine primary direction
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > threshold && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < -threshold && onSwipeLeft) {
              onSwipeLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > threshold && onSwipeDown) {
              onSwipeDown();
            } else if (deltaY < -threshold && onSwipeUp) {
              onSwipeUp();
            }
          }
        }
      }

      // Reset tracking
      touchStartRef.current = null;
      touchEndRef.current = null;
      initialPinchDistance.current = null;
    },
    [threshold, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]
  );

  const attachGestures = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener("touchstart", handleTouchStart, {
        passive: !preventScroll,
      });
      element.addEventListener("touchmove", handleTouchMove, {
        passive: !preventScroll,
      });
      element.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]
  );

  return { attachGestures };
};

// Hook for enhanced scroll behavior in dialogs
export const useDialogScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const smoothScrollTo = useCallback((top: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    smoothScrollTo(0);
  }, [smoothScrollTo]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      smoothScrollTo(scrollRef.current.scrollHeight);
    }
  }, [smoothScrollTo]);

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;

    // Debounce scroll end detection
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll, { passive: true });
      return () => element.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return {
    scrollRef,
    isScrolling: () => isScrollingRef.current,
    smoothScrollTo,
    scrollToTop,
    scrollToBottom,
  };
};

// Hook for touch feedback effects
export const useTouchFeedback = () => {
  const addTouchFeedback = useCallback((element: HTMLElement) => {
    const handleTouchStart = () => {
      element.style.transform = "scale(0.95)";
      element.style.transition = "transform 0.1s ease-out";
    };

    const handleTouchEnd = () => {
      element.style.transform = "scale(1)";
      element.style.transition = "transform 0.15s ease-out";
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return { addTouchFeedback };
};
