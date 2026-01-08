import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useGlassBlue } from '../../hooks/useGlassBlue';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch:active:scale-90 select-none',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-md hover:shadow-lg active:shadow-sm',
        destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg active:shadow-sm',
        outline: 'border-2 border-primary-200 bg-white hover:bg-primary-50 hover:text-primary-900 text-primary-700 shadow-sm hover:shadow-md active:bg-primary-100',
        secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-400 text-white hover:from-secondary-600 hover:to-secondary-500 shadow-md hover:shadow-lg active:shadow-sm',
        ghost: 'hover:bg-primary-100 hover:text-primary-900 text-primary-700 active:bg-primary-200',
        link: 'text-primary-500 underline-offset-4 hover:underline hover:text-primary-600 active:text-primary-700',
      },
      size: {
        default: 'h-12 px-6 py-3 min-h-[48px] text-base', // Enhanced mobile-optimized touch target
        sm: 'h-10 rounded-md px-4 min-h-[44px] text-sm',
        lg: 'h-14 rounded-md px-8 min-h-[48px] text-lg',
        icon: 'h-12 w-12 min-h-[48px] min-w-[48px]', // Enhanced square touch target for mobile
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild: _asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const isGlassBlue = useGlassBlue();
    
    // Glass Blue theme overrides
    const getGlassBlueClasses = (variant: string | null | undefined) => {
      if (!isGlassBlue) return '';
      
      switch (variant) {
        case 'default':
          return 'glass-blue-button glass-blue-glow glass-blue-shine';
        case 'destructive':
          return 'glass-blue-button-destructive glass-blue-glow glass-blue-shine';
        case 'secondary':
          return 'glass-blue-button-secondary glass-blue-glow glass-blue-shine';
        case 'outline':
          return 'glass-blue-input border-blue-200/50 text-blue-700 hover:bg-blue-50/50';
        case 'ghost':
          return 'hover:bg-blue-100/30 text-blue-700 active:bg-blue-200/30';
        default:
          return '';
      }
    };

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          getGlassBlueClasses(variant),
          loading && 'cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        style={{
          // Enhanced touch interactions
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={cn(loading && 'opacity-70')}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };