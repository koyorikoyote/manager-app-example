import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { DIALOG_STYLES } from './cardStyles';
import { useTouchGestures } from '../../hooks/useTouchGestures';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    scrollable?: boolean;
    maxHeight?: string;
    disableBackdropClick?: boolean;
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className,
    scrollable = true,
    maxHeight: _maxHeight = '80vh',
    disableBackdropClick = false,
}) => {
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Enhanced touch gestures for dialog interactions
    const { attachGestures } = useTouchGestures({
        onSwipeDown: () => {
            // Allow swipe down to close dialog on mobile (only if at top of scroll)
            if (scrollRef.current && scrollRef.current.scrollTop === 0) {
                onClose();
            }
        },
        threshold: 100, // Require longer swipe to prevent accidental closes
    });

    // Simplified max height calculation
    const getMaxHeight = React.useCallback(() => {
        if (typeof window !== 'undefined') {
            const vh = window.innerHeight;
            // Use 85% of viewport height with reasonable limits
            return Math.min(vh * 0.85, 700);
        }
        return 600; // Fallback for SSR
    }, []);

    const [maxHeight, setMaxHeight] = React.useState(getMaxHeight);

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Update max height on window resize
    React.useEffect(() => {
        const handleResize = () => {
            setMaxHeight(getMaxHeight());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [getMaxHeight]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (!disableBackdropClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Focus management - minimal approach to avoid interfering with form inputs
    React.useEffect(() => {
        if (isOpen && dialogRef.current) {
            // Only set focus when dialog first opens, and only if no form elements exist
            const timeoutId = setTimeout(() => {
                if (dialogRef.current && document.activeElement === document.body) {
                    const formInputs = dialogRef.current.querySelectorAll(
                        'input, select, textarea'
                    );
                    // If there are form inputs, don't auto-focus anything to avoid interference
                    if (formInputs.length === 0) {
                        const focusableElements = dialogRef.current.querySelectorAll(
                            'button, [href], [tabindex]:not([tabindex="-1"])'
                        );
                        const firstElement = focusableElements[0] as HTMLElement;
                        if (firstElement) {
                            firstElement.focus();
                        }
                    }
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [isOpen]); // Only depend on isOpen

    // Gesture attachment - separate effect
    React.useEffect(() => {
        if (isOpen && dialogRef.current) {
            const cleanup = attachGestures(dialogRef.current);
            return cleanup;
        }
    }, [isOpen, attachGestures]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    const dialogContent = (
        <div
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
            style={{
                // Enhanced smooth scrolling for the entire dialog container
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                // Prevent momentum scrolling from interfering with dialog interactions
                overscrollBehavior: 'contain',
            }}
        >
            {/* Backdrop with touch-friendly interaction */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 touch-pan-y"
                style={{ touchAction: 'pan-y' }}
            />

            {/* Dialog Container - Positioned slightly higher than center with touch optimization */}
            <div
                className="relative flex min-h-full items-start justify-center pt-12 pb-20 sm:pt-20 sm:pb-6 touch-pan-y"
                onClick={handleBackdropClick}
                style={{
                    touchAction: 'pan-y',
                    // Prevent accidental backdrop clicks on mobile during scrolling
                    WebkitTouchCallout: 'none',
                }}
            >
                {/* Dialog with enhanced touch interactions */}
                <div
                    ref={dialogRef}
                    className={cn(
                        DIALOG_STYLES.container,
                        sizeClasses[size],
                        className
                    )}
                    style={{
                        maxHeight: scrollable ? `${maxHeight}px` : undefined,
                        // Enhanced touch interactions
                        touchAction: 'pan-y',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dialog-title"
                    onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking on dialog
                >
                    {/* Header - Fixed */}
                    <div className={DIALOG_STYLES.header}>
                        <h2 id="dialog-title" className={DIALOG_STYLES.title}>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className={DIALOG_STYLES.closeButton}
                            aria-label="Close dialog"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content - Scrollable when needed */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-6"
                        style={{
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        {children}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
}) => {
    const handleConfirm = () => {
        onConfirm();
    };

    const footer = (
        <>
            <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
            >
                {cancelText}
            </Button>
            <Button
                variant={variant}
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                    variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white'
                )}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </div>
                ) : (
                    confirmText
                )}
            </Button>
        </>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
            size="sm"
        >
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    {variant === 'destructive' ? (
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};