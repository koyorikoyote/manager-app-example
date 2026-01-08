import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastVariants = cva(
  'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    className,
    variant,
    title,
    description,
    duration = 2500,
    onClose,
    showCloseButton = true,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />;
        case 'error':
          return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />;
        case 'warning':
          return <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />;
        case 'info':
        default:
          return <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />;
      }
    };

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    };

    const handleMouseUp = (_e: React.MouseEvent<HTMLDivElement>) => {
      handleClose();
    };

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant, className }),
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          'cursor-pointer'
        )}
        onMouseUp={handleMouseUp}
        {...props}
      >
        {getIcon()}

        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm mb-1">
              {title}
            </div>
          )}

          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
        </div>

        {showCloseButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

// Toast Container Component
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  className,
  children,
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Toast, toastVariants };