import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';

import { useOptimizedDateFormatting, useOptimizedStatusFormatting } from '../../utils/staffDetailOptimizations';
import { cn } from '../../utils/cn';
import { AccordionList } from '../ui/AccordionList';
import { interactionService } from '../../services/interactionService';
import type { Staff, InteractionRecord, InteractionMeans } from '../../../shared/types';

export interface InteractionTabProps {
    staff: Staff;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export const InteractionTab: React.FC<InteractionTabProps> = ({
    staff,
    isEditMode: _isEditMode,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile } = useResponsive();

    const { formatDate, formatTime } = useOptimizedDateFormatting();
    const { formatInteractionMeans } = useOptimizedStatusFormatting();
    const [interactionRecords, setInteractionRecords] = useState<InteractionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch interaction records for this staff member with AbortController support
    const fetchInteractionRecords = useCallback(async (signal?: AbortSignal) => {
        if (!staff.id) return;

        setLoading(true);
        setError(null);

        try {
            const result = await interactionService.getStaffInteractions(staff.id.toString(), signal);

            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                setInteractionRecords(result.data);
            }
        } catch (err) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && err instanceof Error && err.name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'Failed to load interaction records');
            }
        } finally {
            // Only update loading state if request wasn't cancelled
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [staff.id]);

    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            await fetchInteractionRecords(controller.signal);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [fetchInteractionRecords]);

    // Memoized helper function to format interaction means with fallback
    const formatInteractionMeansWithFallback = useCallback((means?: InteractionMeans) => {
        return means ? formatInteractionMeans(means) : { text: '未指定 / Not specified', className: 'text-gray-500 bg-gray-50' };
    }, [formatInteractionMeans]);

    // Memoized render functions for better performance
    const renderSummary = useMemo(() => {
        const summaryRenderer = (record: InteractionRecord) => {
            const meansInfo = formatInteractionMeansWithFallback(record.means);

            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-900">
                            {formatDate(record.date)}
                        </div>
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            meansInfo.className
                        )}>
                            {meansInfo.text}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 min-w-0 overflow-hidden flex-shrink">
                        <div className="truncate">
                            {record.location && `${record.location} • `}
                            {record.description.length > 40
                                ? `${record.description.substring(0, 40)}...`
                                : record.description
                            }
                        </div>
                    </div>
                </div>
            );
        };
        summaryRenderer.displayName = 'InteractionSummaryRenderer';
        return summaryRenderer;
    }, [formatDate, formatInteractionMeansWithFallback]);

    // Render details for accordion item
    const renderDetails = (record: InteractionRecord) => {
        return (
            <div className="space-y-4">
                {/* Record Details */}
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.date')}</dt>
                        <dd className="text-sm text-gray-900">{formatDate(record.date)}</dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.means')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                formatInteractionMeansWithFallback(record.means).className
                            )}>
                                {formatInteractionMeansWithFallback(record.means).text}
                            </span>
                        </dd>
                    </div>
                </div>

                {/* Location */}
                {record.location && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.location')}</dt>
                        <dd className="text-sm text-gray-900">{record.location}</dd>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-1">
                    <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.description')}</dt>
                    <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {record.description || _t('detailPages.accordionLabels.interaction.noDescriptionProvided')}
                    </dd>
                </div>

                {/* Additional Information */}
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    {record.type && (
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.type')}</dt>
                            <dd className="text-sm text-gray-900 capitalize">{record.type.toLowerCase()}</dd>
                        </div>
                    )}
                    {record.status && (
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.interaction.status')}</dt>
                            <dd className="text-sm text-gray-900 capitalize">{record.status.toLowerCase()}</dd>
                        </div>
                    )}
                </div>

                {/* Person Concerned */}
                {record.personConcerned && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">Person Concerned</dt>
                        <dd className="text-sm text-gray-900">{record.personConcerned}</dd>
                    </div>
                )}

                {/* Response Details */}
                {record.responseDetails && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">Response Details</dt>
                        <dd className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3 border border-blue-200">
                            {record.responseDetails}
                        </dd>
                    </div>
                )}

                {/* User Information */}
                {(record.creator || record.userInCharge) && (
                    <div className={cn(
                        'grid gap-4',
                        isMobile ? 'grid-cols-1' : 'grid-cols-2'
                    )}>
                        {record.creator && (
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-600">Created By</dt>
                                <dd className="text-sm text-gray-900">{record.creator.name}</dd>
                            </div>
                        )}
                        {record.userInCharge && (
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-600">User in Charge</dt>
                                <dd className="text-sm text-gray-900">{record.userInCharge.name}</dd>
                            </div>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div className={cn(
                    'grid gap-4 pt-3 border-t border-gray-200',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-xs font-medium text-gray-500">Created At</dt>
                        <dd className="text-xs text-gray-700">
                            {formatDate(record.createdAt)} {formatTime(record.createdAt)}
                        </dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-xs font-medium text-gray-500">Updated At</dt>
                        <dd className="text-xs text-gray-700">
                            {formatDate(record.updatedAt)} {formatTime(record.updatedAt)}
                        </dd>
                    </div>
                </div>
            </div>
        );
    };

    // Memoized key extractor for accordion items
    const keyExtractor = useMemo(() => (record: InteractionRecord) => record.id, []);

    return (
        <div className={cn(
            'space-y-4',
            isMobile ? 'space-y-3' : 'space-y-6'
        )}>
            {/* Header */}
            <div className={cn(
                'flex justify-between',
                isMobile ? 'flex-col space-y-2' : 'items-center'
            )}>
                <div className="min-w-0 flex-1">
                    <h3 className={cn(
                        'font-semibold text-gray-900',
                        isMobile ? 'text-base' : 'text-lg'
                    )}>Interaction Records</h3>

                </div>
                <div className={cn(
                    'text-gray-500 flex-shrink-0',
                    isMobile ? 'text-xs self-start' : 'text-sm'
                )}>
                    {interactionRecords.length} record{interactionRecords.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Interaction Records Accordion */}
            <AccordionList
                items={interactionRecords}
                renderSummary={renderSummary}
                renderDetails={renderDetails}
                keyExtractor={keyExtractor}
                loading={loading}
                error={error}
                emptyMessage="No interaction records found for this staff member"
                className="space-y-0.5"
            />
        </div>
    );
};