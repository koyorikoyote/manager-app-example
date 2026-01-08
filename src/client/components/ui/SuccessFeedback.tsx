import React from 'react';
import { cn } from '../../utils/cn';

interface SuccessFeedbackProps {
    message: string;
    onClose?: () => void;
    autoClose?: boolean;
    autoCloseDelay?: number;
    className?: string;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
    message,
    onClose,
    autoClose = true,
    autoCloseDelay = 3000,
    className
}) => {
    React.useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(onClose, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [autoClose, autoCloseDelay, onClose]);

    return (
        <div className={cn(
            'bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300',
            className
        )}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-800">
                        {message}
                    </p>
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ToastSuccessProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

export const ToastSuccess: React.FC<ToastSuccessProps> = ({
    message,
    isVisible,
    onClose
}) => {
    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-green-800">
                            {message}
                        </p>
                    </div>
                    <div className="ml-auto pl-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};