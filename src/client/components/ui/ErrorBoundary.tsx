import React from 'react';
import { Button } from './Button';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
    error: Error;
    resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
    return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="mb-4">
                    <svg
                        className="mx-auto h-12 w-12 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Something went wrong
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    An unexpected error occurred. Please try again or contact support if the problem persists.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <details className="text-left mb-4 p-3 bg-gray-50 rounded-lg">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                            Error Details (Development)
                        </summary>
                        <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}
                <Button onClick={resetError} variant="outline">
                    Try Again
                </Button>
            </div>
        </div>
    );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo
        });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return (
                <FallbackComponent
                    error={this.state.error}
                    resetError={this.resetError}
                />
            );
        }

        return this.props.children;
    }
}

// Hook for error handling in functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const handleError = React.useCallback((error: Error | unknown) => {
        if (error instanceof Error) {
            setError(error);
        } else {
            setError(new Error(String(error)));
        }
    }, []);

    // Throw error to be caught by ErrorBoundary
    if (error) {
        throw error;
    }

    return { handleError, resetError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}