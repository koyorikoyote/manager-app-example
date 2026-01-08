import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'md',
    className
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={cn('flex items-center justify-center space-x-2', className)}>
            <div
                className={cn(
                    'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
                    sizeClasses[size]
                )}
            />
            {message && (
                <span className="text-sm text-gray-600">{message}</span>
            )}
        </div>
    );
};

interface InlineLoadingProps {
    message?: string;
    className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
    message = 'Processing...',
    className
}) => {
    return (
        <div className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
            <span>{message}</span>
        </div>
    );
};

interface ButtonLoadingProps {
    isLoading: boolean;
    children: React.ReactNode;
    loadingText?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
    isLoading,
    children,
    loadingText = 'Loading...'
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{loadingText}</span>
            </div>
        );
    }

    return <>{children}</>;
};