import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

const overlayVariants = cva(
  'absolute inset-0 flex items-center justify-center transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white/80 backdrop-blur-sm',
        dark: 'bg-black/50 backdrop-blur-sm',
        transparent: 'bg-transparent',
        solid: 'bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {
  loading: boolean;
  label?: string;
  spinnerSize?: 'sm' | 'default' | 'lg' | 'xl';
  spinnerVariant?: 'default' | 'secondary' | 'white' | 'muted';
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    className, 
    variant, 
    loading, 
    label, 
    spinnerSize = 'lg',
    spinnerVariant = 'default',
    children,
    ...props 
  }, ref) => {
    if (!loading) {
      return <>{children}</>;
    }

    return (
      <div ref={ref} className="relative" {...props}>
        {children}
        <div className={cn(overlayVariants({ variant, className }))}>
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner 
              size={spinnerSize} 
              variant={variant === 'dark' ? 'white' : spinnerVariant}
            />
            {label && (
              <p className={cn(
                'text-sm font-medium',
                variant === 'dark' ? 'text-white' : 'text-secondary-700'
              )}>
                {label}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

// Inline loading component for smaller areas
export interface InlineLoadingProps {
  loading: boolean;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  label,
  size = 'default',
  className,
  children,
}) => {
  if (!loading && !children) {
    return null;
  }

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('flex items-center justify-center py-4', className)}>
      <LoadingSpinner size={size} label={label} />
    </div>
  );
};

export { LoadingOverlay, overlayVariants };