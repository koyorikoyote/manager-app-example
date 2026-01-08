import React from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, indeterminate, ...props }, ref) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => inputRef.current!);

        React.useEffect(() => {
            if (inputRef.current) {
                inputRef.current.indeterminate = !!indeterminate;
            }
        }, [indeterminate]);

        return (
            <input
                type="checkbox"
                className={cn(
                    "h-4 w-4 rounded border-gray-300 text-primary-600",
                    className
                )}
                ref={inputRef}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
        );
    }
);

Checkbox.displayName = "Checkbox";