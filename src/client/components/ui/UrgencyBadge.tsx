import React from 'react';
import { cn } from '../../utils/cn';

interface UrgencyBadgeProps {
    urgency: 'High' | 'Medium' | 'Low';
    className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, className }) => {
    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'High':
                return 'bg-red-100 text-red-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-neutral-100 text-neutral-800';
        }
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getUrgencyColor(urgency),
                className
            )}
        >
            {urgency}
        </span>
    );
};