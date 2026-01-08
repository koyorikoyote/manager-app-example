import React from 'react';
import { useMobileComponentVisibility } from '../../hooks/useResponsive';
import { shouldShowSearchComponent } from '../../utils/responsiveUtils';
import { useResponsive } from '../../hooks/useResponsive';

interface MobileAwareSearchSectionProps {
    children: React.ReactNode;
    pageName: string;
    className?: string;
    forceVisible?: boolean; // Override for specific use cases
}

/**
 * Enhanced component that conditionally hides search components on mobile for specific pages
 * Now uses centralized responsive utilities for consistent behavior
 */
export const MobileAwareSearchSection: React.FC<MobileAwareSearchSectionProps> = ({
    children,
    pageName,
    className = '',
    forceVisible = false
}) => {
    const { isMobile } = useResponsive();
    const isVisible = useMobileComponentVisibility(pageName, 'search');

    // Use the new utility function for consistency
    const shouldShow = forceVisible || shouldShowSearchComponent(pageName, isMobile);

    // Hide the search component if it shouldn't be visible
    if (!shouldShow || !isVisible) {
        return null;
    }

    return (
        <div className={className}>
            {children}
        </div>
    );
};