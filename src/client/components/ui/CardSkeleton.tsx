import React from 'react';
import { Card, CardContent } from './Card';
import { SKELETON_STYLES, CARD_STYLES } from './cardStyles';
import { cn } from '../../utils/cn';

interface CardSkeletonProps {
    variant?: 'complaint' | 'dailyRecord' | 'inquiry' | 'staff' | 'company' | 'property' | 'interaction';
    className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    variant = 'complaint',
    className
}) => {
    return (
        <Card variant="default" className={cn('', className)}>
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(CARD_STYLES.headerSpacing, 'flex items-start justify-between')}>
                    <div className="flex-1 min-w-0">
                        <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.title)} />
                        <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.subtitle)} />
                    </div>

                    {/* Badge skeletons */}
                    <div className="flex flex-col items-end space-y-1 ml-3 flex-shrink-0">
                        <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.badge)} />
                        {(variant === 'inquiry' || variant === 'interaction') && (
                            <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.badge)} />
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.content)} />
                        <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.content)} />
                        {variant !== 'dailyRecord' && (
                            <>
                                <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.content)} />
                                <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.content)} />
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Section */}
                <div className={CARD_STYLES.footer}>
                    <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.content, 'mb-1')} />
                    <div className={cn(SKELETON_STYLES.base, SKELETON_STYLES.footer)} />
                </div>
            </CardContent>
        </Card>
    );
};