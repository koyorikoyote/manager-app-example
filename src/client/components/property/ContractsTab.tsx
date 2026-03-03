import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { AccordionList } from '../ui/AccordionList';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { propertyDocumentService } from '../../services';
import { Download, FileText } from 'lucide-react';
import type { Property } from '../../../shared/types';

export interface ContractsTabProps {
    property: Property;
    isEditMode: boolean;
}

interface ContractRecord {
    id: number;
    title: string;
    type: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    filePath: string | null;
    relatedEntityId: string;
    createdAt: Date;
    updatedAt: Date;
}

const ContractsTabComponent: React.FC<ContractsTabProps> = ({
    property,
    isEditMode: _isEditMode,
}) => {
    const { t } = useLanguage();
    const { isMobile } = useResponsive();
    const [contracts, setContracts] = useState<ContractRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch contract data with AbortController support
    const fetchContracts = useCallback(async (signal?: AbortSignal) => {
        if (!property || typeof property.id !== 'number') {
            setError('Invalid property id');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Use the service to fetch contract records (ensure numeric id)
            const contractData = await propertyDocumentService.getContractsByPropertyId(
                Number(property.id),
                signal
            );

            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                // Defensive: ensure we received an array and normalize fields
                const normalized = Array.isArray(contractData)
                    ? contractData.map((c) => ({
                        ...c,
                        filePath: c.filePath ?? null,
                        startDate: c.startDate ? new Date(c.startDate) : new Date(),
                        endDate: c.endDate ? new Date(c.endDate) : null,
                        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
                        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
                    }))
                    : [];

                setContracts(normalized);
            }
        } catch (err) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && err instanceof Error && err.name !== 'AbortError') {
                console.error('Failed to fetch contracts:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch contract information');
            }
        } finally {
            // Only update loading state if request wasn't cancelled
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [property]);

    // Fetch data on component mount with proper AbortController cleanup
    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            await fetchContracts(controller.signal);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [fetchContracts]);

    // Memoized formatting functions
    const formatDocumentStatus = useMemo(() => (status: string): string => {
        switch (status) {
            case 'ACTIVE': return t('detailPages.accordionLabels.contracts.statusValues.ACTIVE');
            case 'EXPIRED': return t('detailPages.accordionLabels.contracts.statusValues.EXPIRED');
            case 'TERMINATED': return t('detailPages.accordionLabels.contracts.statusValues.TERMINATED');
            default: return status;
        }
    }, [t]);

    const formatDocumentType = useMemo(() => (type: string): string => {
        switch (type) {
            case 'STAFF': return t('detailPages.accordionLabels.contracts.typeValues.STAFF');
            case 'PROPERTY': return t('detailPages.accordionLabels.contracts.typeValues.PROPERTY');
            case 'COMPANY': return t('detailPages.accordionLabels.contracts.typeValues.COMPANY');
            default: return type;
        }
    }, [t]);

    const formatContractPeriod = useMemo(() => (startDate: Date, endDate: Date | null): string => {
        const start = new Date(startDate).toLocaleDateString('ja-JP');
        if (!endDate) return `${start} - ${t('detailPages.accordionLabels.contracts.ongoing')}`;
        const end = new Date(endDate).toLocaleDateString('ja-JP');
        return `${start} - ${end}`;
    }, [t]);

    const getStatusColorClasses = useMemo(() => (status: string): string => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'EXPIRED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'TERMINATED':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }, []);

    // Memoized handle file download
    const handleDownload = useCallback((filePath: string, title: string) => {
        // Create download URL
        const downloadUrl = `/api/documents/download/${encodeURIComponent(filePath)}`;

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // Memoized render accordion summary for each contract record
    const renderContractSummary = useCallback((contract: ContractRecord) => {
        const formattedType = formatDocumentType(contract.type);
        const formattedStatus = formatDocumentStatus(contract.status);
        const period = formatContractPeriod(contract.startDate, contract.endDate);
        const hasFile = !!contract.filePath;

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FileText className={cn(
                                'flex-shrink-0',
                                isMobile ? 'h-4 w-4' : 'h-5 w-5',
                                hasFile ? 'text-blue-600' : 'text-gray-400'
                            )} />
                            <div className={cn(
                                'font-medium text-gray-900 truncate',
                                isMobile ? 'text-sm' : 'text-base'
                            )}>
                                {contract.title}
                            </div>
                        </div>
                        <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium border',
                            getStatusColorClasses(contract.status)
                        )}>
                            {formattedStatus}
                        </div>
                    </div>
                    <div className={cn(
                        'text-gray-600 mt-1',
                        isMobile ? 'text-xs' : 'text-sm'
                    )}>
                        {formattedType} • {period}
                    </div>
                </div>
                {hasFile && (
                    <div className="flex-shrink-0 ml-3">
                        <Download className={cn(
                            'text-gray-400',
                            isMobile ? 'h-4 w-4' : 'h-5 w-5'
                        )} />
                    </div>
                )}
            </div>
        );
    }, [isMobile, formatDocumentType, formatDocumentStatus, formatContractPeriod, getStatusColorClasses]);

    // Memoized render accordion details for each contract record
    const renderContractDetails = useCallback((contract: ContractRecord) => {
        const formattedType = formatDocumentType(contract.type);
        const formattedStatus = formatDocumentStatus(contract.status);
        const hasFile = !!contract.filePath;

        return (
            <div className="space-y-4">
                {/* Contract Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.documentType')}</span>
                        <span className="text-gray-900">{formattedType}</span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.status')}</span>
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            getStatusColorClasses(contract.status)
                        )}>
                            {formattedStatus}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.startDate')}</span>
                        <span className="text-gray-900">
                            {new Date(contract.startDate).toLocaleDateString('ja-JP')}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.endDate')}</span>
                        <span className="text-gray-900">
                            {contract.endDate
                                ? new Date(contract.endDate).toLocaleDateString('ja-JP')
                                : t('detailPages.accordionLabels.contracts.ongoing')
                            }
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.relatedEntityId')}</span>
                        <span className="text-gray-900 font-mono text-sm">{contract.relatedEntityId}</span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{t('detailPages.accordionLabels.contracts.lastUpdated')}</span>
                        <span className="text-gray-900">
                            {new Date(contract.updatedAt).toLocaleDateString('ja-JP')}
                        </span>
                    </div>
                </div>

                {/* File Information */}
                <div className="pt-4 border-t border-gray-200">
                    <span className="block text-sm font-medium text-gray-700 mb-2">{t('detailPages.accordionLabels.contracts.fileAttachment')}</span>
                    {hasFile ? (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                    <div className="font-medium text-gray-900">{contract.title}</div>
                                    <div className="text-sm text-gray-500">
                                        {t('detailPages.accordionLabels.contracts.fileAvailableForDownload')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(contract.filePath!, contract.title)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 text-sm font-medium',
                                    'text-blue-600 hover:text-blue-700',
                                    'bg-white border border-blue-300 rounded-md',
                                    'hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    'transition-colors duration-200'
                                )}
                            >
                                <Download className="h-4 w-4" />
                                {t('detailPages.accordionLabels.contracts.download')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-gray-500 bg-gray-50 rounded-lg p-3">
                            <FileText className="h-5 w-5" />
                            <span className="text-sm">{t('detailPages.accordionLabels.contracts.noFileAttached')}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [formatDocumentType, formatDocumentStatus, getStatusColorClasses, handleDownload, t]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    {t('detailPages.accordionLabels.contracts.contractDocuments')}
                </h3>
                <div className="text-sm text-gray-500">
                    {contracts.length} {contracts.length === 1 ? t('detailPages.accordionLabels.contracts.document') : t('detailPages.accordionLabels.contracts.documents')}
                </div>
            </div>

            {/* Contract List */}
            <AccordionList
                items={contracts}
                renderSummary={renderContractSummary}
                renderDetails={renderContractDetails}
                keyExtractor={(contract) => contract.id}
                loading={loading}
                error={error}
                emptyMessage={t('detailPages.accordionLabels.contracts.noContractDocuments')}
                className="space-y-2"
            />
        </div>
    );
};

ContractsTabComponent.displayName = 'ContractsTab';

export const ContractsTab = memo(ContractsTabComponent);
