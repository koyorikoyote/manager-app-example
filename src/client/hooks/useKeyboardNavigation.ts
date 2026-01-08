import { useCallback, useEffect, useRef } from "react";

export interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  onEscape?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  disabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    onEscape,
    onTab,
    disabled = false,
    preventDefault = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      const { key, ctrlKey, metaKey, shiftKey } = event;

      // Handle modifier keys
      const hasModifier = ctrlKey || metaKey || shiftKey;

      switch (key) {
        case "Enter":
          if (onEnter && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onEnter();
          }
          break;
        case " ":
        case "Space":
          if (onSpace && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onSpace();
          }
          break;
        case "ArrowUp":
          if (onArrowUp && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onArrowUp();
          }
          break;
        case "ArrowDown":
          if (onArrowDown && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onArrowDown();
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (onArrowRight && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onArrowRight();
          }
          break;
        case "Home":
          if (onHome && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onHome();
          }
          break;
        case "End":
          if (onEnd && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onEnd();
          }
          break;
        case "PageUp":
          if (onPageUp && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onPageUp();
          }
          break;
        case "PageDown":
          if (onPageDown && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onPageDown();
          }
          break;
        case "Escape":
          if (onEscape && !hasModifier) {
            if (preventDefault) event.preventDefault();
            onEscape();
          }
          break;
        case "Tab":
          if (onTab) {
            onTab(event);
          }
          break;
      }
    },
    [
      disabled,
      preventDefault,
      onEnter,
      onSpace,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
      onEscape,
      onTab,
    ]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("keydown", handleKeyDown);
    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    keyboardProps: {
      ref: elementRef,
      tabIndex: disabled ? -1 : 0,
      onKeyDown: handleKeyDown,
    },
  };
}
