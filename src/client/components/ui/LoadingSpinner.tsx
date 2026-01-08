import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'border-primary-500',
        secondary: 'border-secondary-500',
        white: 'border-white',
        muted: 'border-secondary-300',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        role="status"
        aria-label={label || 'Loading'}
        {...props}
      >
        <div className={cn(spinnerVariants({ size, variant }))} />
        {label && (
          <span className="ml-2 text-sm text-secondary-600">
            {label}
          </span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, spinnerVariants };