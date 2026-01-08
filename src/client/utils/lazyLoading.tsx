import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Cache for in-flight / completed module imports to avoid duplicated requests and race conditions
type LazyModule<T extends ComponentType<any> = ComponentType<any>> = { default: T };
const modulePromiseCache = new Map<string, Promise<LazyModule>>();

interface LazyComponentProps {
    fallback?: React.ReactNode;
    errorBoundary?: boolean;
}

// Shared helper to create/reuse a cached promise for a given component
function getOrCreateModulePromise<T extends ComponentType<any>>(
    importFn: () => Promise<LazyModule<T>>,
    componentName: string
): Promise<LazyModule<T>> {
    if (!modulePromiseCache.has(componentName)) {
        const p = importFn()
            .then((module) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Lazy loaded ${componentName}`);
                }
                return module;
            })
            .catch((error) => {
                console.error(`Failed to lazy load ${componentName}:`, error);
                // Remove from cache on failure so retries work
                modulePromiseCache.delete(componentName);
                throw error;
            }) as Promise<LazyModule<T>>;
        modulePromiseCache.set(componentName, p as unknown as Promise<LazyModule>);
    }
    return modulePromiseCache.get(componentName)! as Promise<LazyModule<T>>;
}

// Simple loading fallback
const LoadingFallback: React.FC<{ componentName?: string }> = ({ componentName }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
            <LoadingSpinner size="lg" />
            {componentName ? (
                <div className="text-sm text-secondary-600 mt-2">Loading {componentName}…</div>
            ) : null}
        </div>
    );
};

// Error boundary for lazy loaded components
class LazyErrorBoundary extends React.Component<
    { children: React.ReactNode; componentName?: string },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode; componentName?: string }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Lazy loading error for ${this.props.componentName}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
                    <div className="text-red-600 text-lg font-medium mb-2">
                        Failed to load component
                    </div>
                    <div className="text-secondary-600 text-sm mb-4">
                        {this.props.componentName && `Component: ${this.props.componentName}`}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Enhanced lazy loading wrapper with race condition prevention
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<any>,
    componentName: string,
    options: LazyComponentProps = {}
): React.ComponentType<React.ComponentProps<T>> {
    const LazyComponent = lazy(() =>
        getOrCreateModulePromise<T>(importFn as () => Promise<LazyModule<T>>, componentName) as Promise<LazyModule>
    );

    const WrappedComponent: React.ComponentType<React.ComponentProps<T>> = (props) => {
        const fallback = options.fallback || <LoadingFallback componentName={componentName} />;

        const content = (
            <Suspense fallback={fallback}>
                <LazyComponent {...props} />
            </Suspense>
        );

        if (options.errorBoundary !== false) {
            return (
                <LazyErrorBoundary componentName={componentName}>
                    {content}
                </LazyErrorBoundary>
            );
        }

        return content;
    };

    WrappedComponent.displayName = `Lazy(${componentName})`;
    return WrappedComponent;
}

// Preload utility for critical routes
export function preloadComponent<T extends ComponentType<any>>(importFn: () => Promise<LazyModule<T>>, componentName: string) {
    if (typeof window !== 'undefined') {
        // Use requestIdleCallback if available, otherwise setTimeout(0)
        const schedulePreload = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(callback, { timeout: 2000 });
            } else {
                setTimeout(callback, 0);
            }
        };

        schedulePreload(() => {
            getOrCreateModulePromise<T>(importFn, componentName)
                .then(() => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`🚀 Preloaded ${componentName}`);
                    }
                })
                .catch(error => {
                    console.warn(`Failed to preload ${componentName}:`, error);
                });
        });
    }
}
