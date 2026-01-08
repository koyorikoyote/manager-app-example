import { useCallback, useRef, useEffect } from "react";

export interface FocusManagementOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

export function useFocusManagement(options: FocusManagementOptions = {}) {
  const {
    autoFocus = false,
    restoreFocus = false,
    trapFocus = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  // Store the previously focused element when component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement;
    }
  }, [restoreFocus]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const focusableElement = getFocusableElement(containerRef.current);
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, [autoFocus]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        (previousActiveElementRef.current as HTMLElement).focus?.();
      }
    };
  }, [restoreFocus]);

  // Focus trap
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(containerRef.current!);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [trapFocus]);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return false;
    const firstFocusable = getFocusableElement(containerRef.current);
    if (firstFocusable) {
      firstFocusable.focus();
      return true;
    }
    return false;
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return false;
    const focusableElements = getFocusableElements(containerRef.current);
    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (lastFocusable) {
      lastFocusable.focus();
      return true;
    }
    return false;
  }, []);

  const focusNext = useCallback(() => {
    if (!containerRef.current) return false;
    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < focusableElements.length) {
      focusableElements[nextIndex].focus();
      return true;
    }
    return false;
  }, []);

  const focusPrevious = useCallback(() => {
    if (!containerRef.current) return false;
    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );
    const previousIndex = currentIndex - 1;

    if (previousIndex >= 0) {
      focusableElements[previousIndex].focus();
      return true;
    }
    return false;
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
}

// Helper function to get all focusable elements
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(", ");

  return Array.from(container.querySelectorAll(focusableSelectors)).filter(
    (element) => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetWidth > 0 &&
        htmlElement.offsetHeight > 0 &&
        !htmlElement.hidden &&
        window.getComputedStyle(htmlElement).visibility !== "hidden"
      );
    }
  ) as HTMLElement[];
}

// Helper function to get the first focusable element
function getFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements[0] || null;
}
