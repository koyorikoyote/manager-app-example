import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * Props for the AddressClickableField component
 */
export interface AddressClickableFieldProps {
    /** The address string to display and make clickable. Can be null or undefined for empty states */
    address: string | null | undefined;
    /** Optional label to display before the address */
    label?: string;
    /** Additional CSS classes to apply to the component */
    className?: string;
    /** Whether the address field should be disabled (non-clickable) */
    disabled?: boolean;
}

/**
 * A clickable address field component that opens Google Maps in a new tab when clicked.
 * 
 * Features:
 * - Validates addresses to prevent opening invalid/placeholder addresses
 * - Responsive design with touch-friendly interactions on mobile
 * - Visual indicators for clickable state
 * - Graceful handling of empty or invalid addresses
 * - Accessibility support with proper focus management
 * 
 * @param props - The component props
 * @returns A clickable address field or static text for invalid addresses
 */
export const AddressClickableField: React.FC<AddressClickableFieldProps> = ({
    address,
    label,
    className,
    disabled = false,
}) => {
    const { isMobile, isTablet } = useResponsive();
    const handleAddressClick = useCallback(() => {
        if (!address || disabled) return;

        // Validate address to ensure it's not just whitespace or placeholder text
        const trimmed = address.trim();
        const invalidPatterns = [/^n\/a$/i, /^none$/i, /^-+$/, /^\s*$/, /^not specified$/i, /^not provided$/i];

        if (invalidPatterns.some((pattern) => pattern.test(trimmed))) {
            return;
        }

        const encodedAddress = encodeURIComponent(trimmed);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
    }, [address, disabled]);

    // Check if address is valid and clickable
    const isValidAddress = useCallback((addr: string | null | undefined): boolean => {
        if (!addr || addr.trim().length === 0) {
            return false;
        }

        const trimmed = addr.trim();
        const invalidPatterns = [/^n\/a$/i, /^none$/i, /^-+$/, /^\s*$/, /^not specified$/i, /^not provided$/i];

        return !invalidPatterns.some((pattern) => pattern.test(trimmed));
    }, []);

    const isClickable = isValidAddress(address) && !disabled;

    if (!address) {
        return (
            <span className={cn(
                'text-neutral-500',
                isMobile ? 'text-sm' : 'text-base',
                className
            )}>
                {label && <span className="text-neutral-600 mr-1">{label}:</span>}
                No address provided
            </span>
        );
    }

    if (!isClickable) {
        return (
            <span className={cn(
                'text-neutral-900',
                isMobile ? 'text-sm' : 'text-base',
                className
            )}>
                {label && <span className="text-neutral-600 mr-1">{label}:</span>}
                {address}
            </span>
        );
    }

    return (
        <button
            onClick={handleAddressClick}
            className={cn(
                'group text-left text-primary-600 hover:text-primary-700 hover:underline',
                'cursor-pointer transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-white',
                'rounded-sm border-0 bg-transparent',
                'touch-manipulation select-text',
                // Enhanced visual feedback
                'hover:bg-primary-50/50 focus:bg-primary-50/50',
                // Responsive sizing and touch targets
                isMobile ? 'text-sm p-1 min-h-[44px]' : isTablet ? 'text-base p-1' : 'text-base p-0',
                // Enhanced touch interactions for mobile
                isMobile && 'active:bg-primary-100 active:scale-95 transition-transform',
                className
            )}
            disabled={disabled}
            title="Click to view in Google Maps"
            type="button"
            style={{
                // Enhanced touch interactions
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            {label && <span className="text-neutral-600 mr-1">{label}:</span>}
            <span className="relative">
                {address}
                {/* Visual indicator for clickable link */}
                <span className="ml-1 text-primary-400 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                    📍
                </span>
            </span>
        </button>
    );
};