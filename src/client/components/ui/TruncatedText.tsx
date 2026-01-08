import React from 'react';
import { EMPTY_STATE } from './cardStyles';
import { cn } from '../../utils/cn';

interface TruncatedTextProps {
    text: string;
    maxLength?: number;
    className?: string;
    showTooltip?: boolean;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
    text,
    maxLength = 100,
    className = '',
    showTooltip = true
}) => {
    if (!text || text.trim() === '') {
        return (
            <span className={cn(EMPTY_STATE.className, className)}>
                {EMPTY_STATE.placeholder}
            </span>
        );
    }

    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text;

    return (
        <span
            className={cn(
                'block break-words leading-relaxed',
                shouldTruncate && 'cursor-help',
                className
            )}
            title={showTooltip && shouldTruncate ? text : undefined}
        >
            {displayText}
        </span>
    );
};