import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';

import { useOptimizedDateFormatting, useOptimizedStatusFormatting } from '../../utils/staffDetailOptimizations';
import { cn } from '../../utils/cn';
import { AccordionList } from '../ui/AccordionList';
import { documentService } from '../../services/documentService';
import type { Staff, Document, DocumentType, DocumentStatus } from '../../../shared/types';

export interface ProceduresTabProps {
    staff: Staff;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export const ProceduresTab: React.FC<ProceduresTabProps> = ({
    staff,
    isEditMode: _isEditMode,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile } = useResponsive();

    const { formatDate, formatTime } = useOptimizedDateFormatting();
    const { formatDocumentType, formatDocumentStatus } = useOptimizedStatusFormatting();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch documents for this staff member with AbortController support
    const fetchDocuments = useCallback(async (signal?: AbortSignal) => {
        if (!staff.id) return;

        setLoading(true);
        setError(null);

        try {
            const result = await documentService.getStaffDocuments(staff.id.toString(), signal);

            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                setDocuments(result.data);
            }
        } catch (err) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && err instanceof Error && err.name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'Failed to load documents');
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
            await fetchDocuments(controller.signal);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [fetchDocuments]);

    // Memoized helper functions with fallbacks
    const formatDocumentTypeWithFallback = useCallback((type?: DocumentType) => {
        return type ? formatDocumentType(type) : { text: '未指定 / Not specified', className: 'text-neutral-500 bg-neutral-50' };
    }, [formatDocumentType]);

    const formatDocumentStatusWithFallback = useCallback((status?: DocumentStatus) => {
        return status ? formatDocumentStatus(status) : { text: '未指定 / Not specified', className: 'text-neutral-500 bg-neutral-50' };
    }, [formatDocumentStatus]);

    // Memoized render functions for better performance
    const renderSummary = useMemo(() => {
        const summaryRenderer = (document: Document) => {
            const typeInfo = formatDocumentTypeWithFallback(document.type);
            const statusInfo = formatDocumentStatusWithFallback(document.status);

            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-neutral-900">
                            {formatDate(document.startDate)}
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
                    <div className="text-xs text-neutral-500 min-w-0 overflow-hidden flex-shrink">
                        <div className="truncate">
                            {document.title.length > 40
                                ? `${document.title.substring(0, 40)}...`
                                : document.title
                            }
                        </div>
                    </div>
                </div>
            );
        };
        summaryRenderer.displayName = 'ProceduresSummaryRenderer';
        return summaryRenderer;
    }, [formatDate, formatDocumentTypeWithFallback, formatDocumentStatusWithFallback]);

    // Render details for accordion item
    const renderDetails = (document: Document) => {
        return (
            <div className="space-y-4">
                {/* Document Details */}
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-neutral-600">{_t('detailPages.accordionLabels.procedures.startDate')}</dt>
                        <dd className="text-sm text-neutral-900">{formatDate(document.startDate)}</dd>
                    </div>
                    {document.endDate && (
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-neutral-600">{_t('detailPages.accordionLabels.procedures.endDate')}</dt>
                            <dd className="text-sm text-neutral-900">{formatDate(document.endDate)}</dd>
                        </div>
                    )}
                </div>

                {/* Type and Status */}
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-neutral-600">{_t('detailPages.accordionLabels.procedures.type')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                formatDocumentTypeWithFallback(document.type).className
                            )}>
                                {formatDocumentTypeWithFallback(document.type).text}
                            </span>
                        </dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-neutral-600">{_t('detailPages.accordionLabels.procedures.status')}</dt>
                        <dd className="text-sm">
                            <span className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                formatDocumentStatusWithFallback(document.status).className
                            )}>
                                {formatDocumentStatusWithFallback(document.status).text}
                            </span>
                        </dd>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <dt className="text-sm font-medium text-neutral-600">{_t('detailPages.accordionLabels.procedures.title')}</dt>
                    <dd className="text-sm text-neutral-900 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                        {document.title || _t('detailPages.accordionLabels.procedures.noTitleProvided')}
                    </dd>
                </div>

                {/* File Path */}
                {document.filePath && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">File Path</dt>
                        <dd className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs break-all">{document.filePath}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        documentService.downloadDocument(document.filePath!, document.title);
                                    }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                    Download
                                </button>
                            </div>
                        </dd>
                    </div>
                )}

                {/* Related Entity ID */}
                {document.relatedEntityId && (
                    <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-600">Related Entity ID</dt>
                        <dd className="text-sm text-gray-900">{document.relatedEntityId}</dd>
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
                            {formatDate(document.createdAt)} {formatTime(document.createdAt)}
                        </dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="text-xs font-medium text-gray-500">Updated At</dt>
                        <dd className="text-xs text-gray-700">
                            {formatDate(document.updatedAt)} {formatTime(document.updatedAt)}
                        </dd>
                    </div>
                </div>
            </div>
        );
    };

    // Memoized key extractor for accordion items
    const keyExtractor = useMemo(() => (document: Document) => document.id, []);

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
                    )}>Procedures & Documents</h3>

                </div>
                <div className={cn(
                    'text-gray-500 flex-shrink-0',
                    isMobile ? 'text-xs self-start' : 'text-sm'
                )}>
                    {documents.length} document{documents.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Documents Accordion */}
            <AccordionList
                items={documents}
                renderSummary={renderSummary}
                renderDetails={renderDetails}
                keyExtractor={keyExtractor}
                loading={loading}
                error={error}
                emptyMessage="No documents found for this staff member"
                className="space-y-0.5"
            />
        </div>
    );
};