import React, { useState, useEffect } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOptimizedDateFormatting, useOptimizedStatusFormatting } from '../../utils/staffDetailOptimizations';
import { cn } from '../../utils/cn';
import { AccordionList } from '../ui/AccordionList';
import { companyService } from '../../services/companyService';
import type { Company, CompanyInteractionRecord } from '../../../shared/types';

export interface CompanyInteractionTabProps {
    company: Company;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Company, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export const CompanyInteractionTab: React.FC<CompanyInteractionTabProps> = ({
    company,
    isEditMode: _isEditMode,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile } = useResponsive();
    const { formatDate } = useOptimizedDateFormatting();
    const { formatInteractionMeans } = useOptimizedStatusFormatting();

    const [interactionRecords, setInteractionRecords] = useState<CompanyInteractionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load interaction records for the company with AbortController support
    useEffect(() => {
        const controller = new AbortController();
        
        const loadInteractionRecords = async () => {
            try {
                setLoading(true);
                setError(null);

                // Always fetch interaction records from API since company data doesn't include them
                const records = await companyService.getInteractionRecords(company.id, controller.signal);
                
                // Only update state if request wasn't cancelled
                if (!controller.signal.aborted) {
                    setInteractionRecords(Array.isArray(records) ? records : []);
                }
            } catch (err) {
                // Only set error if component is still mounted and request wasn't cancelled
                if (!controller.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
                    console.error('Failed to load interaction records:', err);
                    setError('Failed to load interaction records');
                    setInteractionRecords([]);
                }
            } finally {
                // Only update loading state if request wasn't cancelled
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadInteractionRecords();
        
        return () => {
            controller.abort();
        };
    }, [company.id, company.interactionRecords]);

    // Render summary for accordion item
    const renderSummary = (record: CompanyInteractionRecord) => {
        const meansInfo = record.means ? formatInteractionMeans(record.means) : { text: _t('detailPages.accordionLabels.companyInteraction.notSpecified'), className: 'bg-gray-100 text-gray-800' };

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
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
                <div className="text-xs text-gray-500">
                    {record.description && record.description.length > 40
                        ? `${record.description.substring(0, 40)}...`
                        : record.description
                    }
                </div>
            </div>
        );
    };

    // Render details for accordion item
    const renderDetails = (record: CompanyInteractionRecord) => {
        return (
            <div className="space-y-4">
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.companyInteraction.date')}</dt>
                        <dd className="text-sm text-gray-900">{formatDate(record.date)}</dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.companyInteraction.means')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                record.means ? formatInteractionMeans(record.means).className : 'bg-gray-100 text-gray-800'
                            )}>
                                {record.means ? formatInteractionMeans(record.means).text : _t('detailPages.accordionLabels.companyInteraction.notSpecified')}
                            </span>
                        </dd>
                    </div>
                </div>

                {record.location && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.companyInteraction.location')}</dt>
                        <dd className="text-sm text-gray-900">{record.location}</dd>
                    </div>
                )}

                <div className="space-y-1">
                    <dt className="text-sm font-medium text-gray-600">{_t('detailPages.accordionLabels.companyInteraction.description')}</dt>
                    <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {record.description || _t('detailPages.accordionLabels.companyInteraction.noDescriptionProvided')}
                    </dd>
                </div>
            </div>
        );
    };

    // Key extractor for accordion items
    const keyExtractor = (record: CompanyInteractionRecord) => record.id.toString();

    return (
        <div className="space-y-4">
            {!loading && !error && (
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {_t('detailPages.accordionLabels.companyInteraction.interactionRecords')}
                    </h3>
                    <div className="text-sm text-gray-500">
                        {interactionRecords.length} {interactionRecords.length === 1 ? _t('detailPages.accordionLabels.companyInteraction.record') : _t('detailPages.accordionLabels.companyInteraction.records')}
                    </div>
                </div>
            )}
            <AccordionList
                items={interactionRecords}
                renderSummary={renderSummary}
                renderDetails={renderDetails}
                keyExtractor={keyExtractor}
                loading={loading}
                error={error}
                emptyMessage={_t('detailPages.accordionLabels.companyInteraction.noInteractionRecords')}
                className="space-y-0.5"
            />
        </div>
    );
};