import { useState, useEffect, RefObject } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If freezeOnceVisible is true and element has been visible, don't observe anymore
    if (freezeOnceVisible && hasBeenVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...observerOptions,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, hasBeenVisible, freezeOnceVisible, observerOptions]);

  return isIntersecting;
};
