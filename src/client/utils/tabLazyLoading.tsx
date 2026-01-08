import React, { Suspense, lazy, ComponentType, useState, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/* eslint-env browser */

interface LazyTabComponentProps {
    fallback?: React.ReactNode;
    preloadDelay?: number;
    isActive?: boolean;
    shouldPreload?: boolean;
}

interface TabLoadingState {
    isLoaded: boolean;
    isLoading: boolean;
    error: Error | null;
}

// Enhanced intersection observer hook for tab visibility
const useTabVisibility = (isActive: boolean, preloadDelay: number = 100) => {
    const [shouldLoad, setShouldLoad] = useState(isActive);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            Promise.resolve().then(() => setShouldLoad(true));
        } else if (!shouldLoad && !timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
                setShouldLoad(true);
                timeoutRef.current = null;
            }, preloadDelay);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isActive, preloadDelay, shouldLoad]);

    return shouldLoad;
};

// Tab-specific lazy loading wrapper with intelligent preloading
export function createLazyTabComponent<T extends ComponentType<unknown>>(
    importFn: () => Promise<{ default: T }>,
    componentName: string,
    options: LazyTabComponentProps = {}
): React.ComponentType<React.ComponentProps<T> & { isActive?: boolean; shouldPreload?: boolean }> {
    const LazyComponent = lazy(() => {
        const startTime = Date.now();

        return importFn().then(module => {
            const loadTime = Date.now() - startTime;

            if (process.env.NODE_ENV === 'development') {
                console.log(`Lazy loaded tab ${componentName} in ${loadTime.toFixed(2)}ms`);
            }

            return module;
        }).catch(error => {
            console.error(`Failed to lazy load tab ${componentName}:`, error);
            throw error;
        });
    });

    const WrappedTabComponent: React.ComponentType<React.ComponentProps<T> & { isActive?: boolean; shouldPreload?: boolean }> = ({
        isActive = false,
        shouldPreload: _shouldPreload = false,
        ...props
    }) => {
        const [loadingState, setLoadingState] = useState<TabLoadingState>({
            isLoaded: false,
            isLoading: false,
            error: null
        });

        const shouldLoad = useTabVisibility(isActive, options.preloadDelay);

        // Preload component when shouldLoad becomes true
        useEffect(() => {
            if (shouldLoad && !loadingState.isLoaded && !loadingState.isLoading) {
                let cancelled = false;

                Promise.resolve().then(() => {
                    if (cancelled) return;
                    setLoadingState(prev => ({ ...prev, isLoading: true }));

                    return importFn()
                        .then(() => {
                            if (!cancelled) {
                                setLoadingState({ isLoaded: true, isLoading: false, error: null });
                            }
                        })
                        .catch(error => {
                            if (!cancelled) {
                                console.error(`Failed to preload tab ${componentName}:`, error);
                                setLoadingState({ isLoaded: false, isLoading: false, error });
                            }
                        });
                });

                return () => {
                    cancelled = true;
                };
            }
        }, [shouldLoad, loadingState.isLoaded, loadingState.isLoading]);

        // If a previous load errored, show a small error UI (Suspense would not catch this)
        if (loadingState.error) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[120px] p-4">
                    <div className="text-red-600 text-sm mb-2">Failed to load {componentName}</div>
                    <button
                        onClick={() => {
                            // Retry by resetting state and triggering effect again
                            setLoadingState({ isLoaded: false, isLoading: false, error: null });
                        }}
                        className="px-3 py-1 bg-primary-600 text-white rounded"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        // Don't render anything if tab shouldn't be loaded yet
        if (!shouldLoad) {
            return null;
        }

        const fallback = options.fallback || (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );

        return (
            <Suspense fallback={fallback}>
                {/* @ts-expect-error - Props spreading with generic types */}
                <LazyComponent {...props} />
            </Suspense>
        );
    };

    WrappedTabComponent.displayName = `LazyTab(${componentName})`;
    return WrappedTabComponent;
}

// Preload tab components based on user interaction patterns
export class TabPreloader {
    private static instance: TabPreloader;
    private preloadQueue: Map<string, () => Promise<unknown>> = new Map();
    private loadedComponents: Set<string> = new Set();
    private preloadTimeouts: Map<string, NodeJS.Timeout> = new Map();

    static getInstance(): TabPreloader {
        if (!TabPreloader.instance) {
            TabPreloader.instance = new TabPreloader();
        }
        return TabPreloader.instance;
    }

    // Register a tab component for potential preloading
    registerTab(tabId: string, importFn: () => Promise<unknown>): void {
        if (!this.preloadQueue.has(tabId)) {
            this.preloadQueue.set(tabId, importFn);
        }
    }

    // Preload a specific tab with optional delay
    preloadTab(tabId: string, delay: number = 0): void {
        if (this.loadedComponents.has(tabId)) {
            return; // Already loaded
        }

        const existingTimeout = this.preloadTimeouts.get(tabId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
            const importFn = this.preloadQueue.get(tabId);
            if (importFn) {
                importFn()
                    .then(() => {
                        this.loadedComponents.add(tabId);
                        if (process.env.NODE_ENV === 'development') {
                            console.log(`🚀 Preloaded tab: ${tabId}`);
                        }
                    })
                    .catch(error => {
                        console.warn(`Failed to preload tab ${tabId}:`, error);
                    });
            }
            this.preloadTimeouts.delete(tabId);
        }, delay);

        this.preloadTimeouts.set(tabId, timeout);
    }

    // Preload tabs based on user interaction patterns
    preloadAdjacentTabs(currentTabId: string, tabOrder: string[]): void {
        const currentIndex = tabOrder.indexOf(currentTabId);
        if (currentIndex === -1) return;

        // Preload next tab immediately
        if (currentIndex < tabOrder.length - 1) {
            this.preloadTab(tabOrder[currentIndex + 1], 100);
        }

        // Preload previous tab with slight delay
        if (currentIndex > 0) {
            this.preloadTab(tabOrder[currentIndex - 1], 300);
        }
    }

    // Preload all tabs with staggered timing
    preloadAllTabs(tabIds: string[], baseDelay: number = 500): void {
        tabIds.forEach((tabId, index) => {
            this.preloadTab(tabId, baseDelay + (index * 200));
        });
    }

    // Clear preload timeouts
    clearPreloadTimeouts(): void {
        this.preloadTimeouts.forEach(timeout => clearTimeout(timeout));
        this.preloadTimeouts.clear();
    }

    // Get loading statistics
    getStats(): { registered: number; loaded: number; pending: number } {
        return {
            registered: this.preloadQueue.size,
            loaded: this.loadedComponents.size,
            pending: this.preloadTimeouts.size
        };
    }
}

// Hook for managing tab preloading
export const useTabPreloading = (tabIds: string[], currentTabId: string) => {
    const preloader = TabPreloader.getInstance();

    useEffect(() => {
        // Preload adjacent tabs when current tab changes
        preloader.preloadAdjacentTabs(currentTabId, tabIds);
    }, [currentTabId, tabIds, preloader]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            preloader.clearPreloadTimeouts();
        };
    }, [preloader]);

    return {
        preloadTab: (tabId: string, delay?: number) => preloader.preloadTab(tabId, delay),
        preloadAllTabs: (delay?: number) => preloader.preloadAllTabs(tabIds, delay),
        getStats: () => preloader.getStats()
    };
};

// Note: useIntersectionObserver is imported from hooks/useIntersectionObserver

// Smart tab container that handles visibility and preloading
export const SmartTabContainer: React.FC<{
    children: React.ReactNode;
    tabId: string;
    isActive: boolean;
    onVisibilityChange?: (isVisible: boolean) => void;
}> = ({ children, tabId, isActive, onVisibilityChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(containerRef as React.RefObject<Element>);

    useEffect(() => {
        onVisibilityChange?.(isVisible);
    }, [isVisible, onVisibilityChange]);

    return (
        <div
            ref={containerRef}
            data-tab-id={tabId}
            className={`tab-container ${isActive ? 'active' : 'inactive'}`}
            style={{
                display: isActive ? 'block' : 'none'
            }}
        >
            {children}
        </div>
    );
};
