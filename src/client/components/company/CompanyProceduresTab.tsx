import React, { useState, useEffect } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOptimizedDateFormatting, useOptimizedStatusFormatting } from '../../utils/staffDetailOptimizations';
import { cn } from '../../utils/cn';
import { AccordionList } from '../ui/AccordionList';
import { companyService } from '../../services/companyService';
import type { Company, CompanyDocument } from '../../../shared/types';

export interface CompanyProceduresTabProps {
    company: Company;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Company, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export const CompanyProceduresTab: React.FC<CompanyProceduresTabProps> = ({
    company,
    isEditMode: _isEditMode,
}) => {
    const { t } = useLanguage();
    const { isMobile } = useResponsive();
    const { formatDate } = useOptimizedDateFormatting();
    const { formatDocumentType, formatDocumentStatus } = useOptimizedStatusFormatting(t);

    const [documents, setDocuments] = useState<CompanyDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load documents for the company with AbortController support
    useEffect(() => {
        const controller = new AbortController();

        const loadDocuments = async () => {
            try {
                setLoading(true);
                setError(null);

                // Always fetch documents from API since company data doesn't include them
                const records = await companyService.getDocuments(company.id, controller.signal);

                // Only update state if request wasn't cancelled
                if (!controller.signal.aborted) {
                    setDocuments(Array.isArray(records) ? records : []);
                }
            } catch (err) {
                // Only set error if component is still mounted and request wasn't cancelled
                if (!controller.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
                    console.error('Failed to load documents:', err);
                    setError('Failed to load company documents');
                    setDocuments([]);
                }
            } finally {
                // Only update loading state if request wasn't cancelled
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadDocuments();

        return () => {
            controller.abort();
        };
    }, [company.id, company.documents]);

    // Render summary for accordion item
    const renderSummary = (document: CompanyDocument) => {
        const typeInfo = formatDocumentType(document.type);
        const statusInfo = formatDocumentStatus(document.status);

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                        {document.title}
                    </div>
                    <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        typeInfo.className
                    )}>
                        {typeInfo.text}
                    </span>
                    <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        statusInfo.className
                    )}>
                        {statusInfo.text}
                    </span>
                </div>
                <div className="text-xs text-gray-500">
                    {formatDate(document.startDate)}
                </div>
            </div>
        );
    };

    // Render details for accordion item
    const renderDetails = (document: CompanyDocument) => {
        return (
            <div className="space-y-4">
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.title')}</dt>
                        <dd className="text-sm text-gray-900">{document.title}</dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.type')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                formatDocumentType(document.type).className
                            )}>
                                {formatDocumentType(document.type).text}
                            </span>
                        </dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.status')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                formatDocumentStatus(document.status).className
                            )}>
                                {formatDocumentStatus(document.status).text}
                            </span>
                        </dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.startDate')}</dt>
                        <dd className="text-sm text-gray-900">{formatDate(document.startDate)}</dd>
                    </div>
                </div>

                {document.endDate && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.endDate')}</dt>
                        <dd className="text-sm text-gray-900">{formatDate(document.endDate)}</dd>
                    </div>
                )}

                {document.filePath && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.filePath')}</dt>
                        <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono">
                            {document.filePath}
                        </dd>
                    </div>
                )}

                {document.staff && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">{t('detailPages.accordionLabels.companyProcedures.associatedStaff')}</dt>
                        <dd className="text-sm text-gray-900">
                            {document.staff.name} ({document.staff.employeeId})
                        </dd>
                    </div>
                )}
            </div>
        );
    };

    // Key extractor for accordion items
    const keyExtractor = (document: CompanyDocument) => document.id.toString();

    return (
        <div className="space-y-4">
            {!loading && !error && (
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {t('detailPages.accordionLabels.companyProcedures.proceduresDocuments')}
                    </h3>
                    <div className="text-sm text-gray-500">
                        {documents.length} {documents.length === 1 ? t('detailPages.accordionLabels.companyProcedures.document') : t('detailPages.accordionLabels.companyProcedures.documents')}
                    </div>
                </div>
            )}
            <AccordionList
                items={documents}
                renderSummary={renderSummary}
                renderDetails={renderDetails}
                keyExtractor={keyExtractor}
                loading={loading}
                error={error}
                emptyMessage={t('detailPages.accordionLabels.companyProcedures.noDocuments')}
                className="space-y-0.5"
            />
        </div>
    );
};