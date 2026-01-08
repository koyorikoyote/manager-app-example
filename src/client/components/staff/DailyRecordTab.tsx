import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';

import { useOptimizedDateFormatting, useOptimizedStatusFormatting } from '../../utils/staffDetailOptimizations';
import { cn } from '../../utils/cn';
import { AccordionList } from '../ui/AccordionList';
import { dailyRecordService } from '../../services/dailyRecordService';
import type { Staff, DailyRecordWithRelations } from '../../../shared/types';

export interface DailyRecordTabProps {
    staff: Staff;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export const DailyRecordTab: React.FC<DailyRecordTabProps> = ({
    staff,
    isEditMode: _isEditMode,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile } = useResponsive();

    const { formatDate, formatTime } = useOptimizedDateFormatting();
    const { formatConditionStatus } = useOptimizedStatusFormatting();
    const [dailyRecords, setDailyRecords] = useState<DailyRecordWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch daily records for this staff member with AbortController support
    const fetchDailyRecords = useCallback(async (signal?: AbortSignal) => {
        if (!staff.id) return;

        setLoading(true);
        setError(null);

        try {
            const records = await dailyRecordService.getByStaffId(staff.id, signal);
            
            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                setDailyRecords(records);
            }
        } catch (err) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && err instanceof Error && err.name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'Failed to load daily records');
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
            await fetchDailyRecords(controller.signal);
        };
        
        loadData();
        
        return () => {
            controller.abort();
        };
    }, [fetchDailyRecords]);

    // Memoized render functions for better performance
    const renderSummary = useMemo(() => {
        const summaryRenderer = (record: DailyRecordWithRelations) => {
            const conditionInfo = formatConditionStatus(record.conditionStatus);

            return (
                <div className={cn(
                    'flex w-full min-w-0',
                    isMobile ? 'flex-col space-y-1' : 'items-center justify-between'
                )}>
                    <div className={cn(
                        'flex items-center min-w-0',
                        isMobile ? 'gap-2' : 'gap-3'
                    )}>
                        <div className={cn(
                            'font-medium text-gray-900 flex-shrink-0',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            {formatDate(record.dateOfRecord)}
                        </div>
                        <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                            isMobile ? 'text-xs px-1.5' : 'text-xs px-2.5',
                            conditionInfo.className
                        )}>
                            {conditionInfo.text}
                        </span>
                    </div>
                    <div className={cn(
                        'text-gray-500 min-w-0 overflow-hidden',
                        isMobile ? 'text-xs pl-0' : 'text-xs pl-2'
                    )}>
                        <div className="truncate">
                            {record.feedbackContent.length > (isMobile ? 30 : 50)
                                ? `${record.feedbackContent.substring(0, isMobile ? 30 : 50)}...`
                                : record.feedbackContent
                            }
                        </div>
                    </div>
                </div>
            );
        };
        summaryRenderer.displayName = 'DailyRecordSummaryRenderer';
        return summaryRenderer;
    }, [isMobile, formatDate, formatConditionStatus]);

    const renderDetails = useMemo(() => {
        const detailsRenderer = (record: DailyRecordWithRelations) => {
            return (
                <div className="space-y-4">
                    {/* Record Details */}
                    <div className={cn(
                        'grid gap-4',
                        isMobile ? 'grid-cols-1' : 'grid-cols-2'
                    )}>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.dailyRecord.dateOfRecord')}</dt>
                            <dd className="text-sm text-gray-900">{formatDate(record.dateOfRecord)}</dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.dailyRecord.conditionStatus')}</dt>
                            <dd className="text-sm">
                                <span className={cn(
                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                    formatConditionStatus(record.conditionStatus).className
                                )}>
                                    {formatConditionStatus(record.conditionStatus).text}
                                </span>
                            </dd>
                        </div>
                    </div>

                    {/* Feedback Content */}
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.dailyRecord.feedbackContent')}</dt>
                        <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {record.feedbackContent || _t('detailPages.accordionLabels.dailyRecord.noFeedbackProvided')}
                        </dd>
                    </div>

                    {/* Contact Number */}
                    {record.contactNumber && (
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.dailyRecord.contactNumber')}</dt>
                            <dd className="text-sm text-gray-900">{record.contactNumber}</dd>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className={cn(
                        'grid gap-4 pt-3 border-t border-gray-200',
                        isMobile ? 'grid-cols-1' : 'grid-cols-2'
                    )}>
                        <div className="space-y-1">
                            <dt className="text-xs font-medium text-gray-500">{_t('detailPages.accordionLabels.dailyRecord.createdAt')}</dt>
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
        detailsRenderer.displayName = 'DailyRecordDetailsRenderer';
        return detailsRenderer;
    }, [isMobile, formatDate, formatConditionStatus, formatTime]);

    // Memoized key extractor for accordion items
    const keyExtractor = useMemo(() => (record: DailyRecordWithRelations) => record.id, []);

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
                    )}>Daily Records</h3>

                </div>
                <div className={cn(
                    'text-gray-500 flex-shrink-0',
                    isMobile ? 'text-xs self-start' : 'text-sm'
                )}>
                    {dailyRecords.length} record{dailyRecords.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Daily Records Accordion */}
            <AccordionList
                items={dailyRecords}
                renderSummary={renderSummary}
                renderDetails={renderDetails}
                keyExtractor={keyExtractor}
                loading={loading}
                error={error}
                emptyMessage="No daily records found for this staff member"
                className="space-y-0.5"
            />
        </div>
    );
};