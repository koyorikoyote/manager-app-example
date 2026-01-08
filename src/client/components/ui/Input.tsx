import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-white px-4 py-3 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[44px] shadow-sm', // Mobile-optimized height
  {
    variants: {
      variant: {
        default: 'border-neutral-300 focus-visible:ring-primary-500/20 focus-visible:border-primary-500 hover:border-neutral-400',
        error: 'border-red-500 focus-visible:ring-red-500/20 bg-red-50',
        success: 'border-primary-500 focus-visible:ring-primary-500/20 bg-primary-50',
        warning: 'border-secondary-500 focus-visible:ring-secondary-500/20 bg-secondary-50',
      },
      size: {
        default: 'h-12 px-4 py-3',
        sm: 'h-10 px-3 py-2 text-xs',
        compact: 'h-9 px-3 py-2 text-sm',
        lg: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type = 'text',
    label,
    error,
    success,
    warning,
    helperText,
    startIcon,
    endIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine variant based on validation states
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;

    const message = error || success || warning || helperText;
    const messageColor = error ? 'text-red-600' : success ? 'text-primary-600' : warning ? 'text-secondary-600' : 'text-neutral-600';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              startIcon && 'pl-10',
              endIcon && 'pr-10'
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={message ? `${inputId}-message` : undefined}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
              {endIcon}
            </div>
          )}
        </div>
        {message && (
          <p
            id={`${inputId}-message`}
            className={cn('mt-2 text-sm', messageColor)}
            role={error ? 'alert' : 'status'}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };