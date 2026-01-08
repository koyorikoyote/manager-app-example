import React from 'react';
import { PhotoUpload } from '../ui/PhotoUpload';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import type { Company, PhotoUploadProps } from '../../../shared/types';

export interface CompanyHeaderSectionProps {
    company: Company;
    isEditMode: boolean;
    onPhotoUpload?: (file: File) => Promise<void>;
    onFieldChange?: (field: keyof Company, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    photoUploadLoading?: boolean;
    photoUploadError?: string | null;
}

export const CompanyHeaderSection: React.FC<CompanyHeaderSectionProps> = ({
    company,
    isEditMode,
    onPhotoUpload,
    onFieldChange,
    photoUploadLoading = false,
    photoUploadError = null,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();

    // Format furigana name with proper Japanese styling
    const renderFuriganaName = () => {
        if (!company.furiganaName) return null;

        return (
            <div className="text-sm text-gray-600 mb-1">
                <ruby className="text-xs">
                    {company.furiganaName}
                </ruby>
            </div>
        );
    };

    // Format establishment date
    const formatEstablishmentDate = (date: Date | null | undefined) => {
        if (!date) return null;
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    };



    // Render photo section
    const renderPhotoSection = () => {
        const photoUploadProps: PhotoUploadProps = {
            currentPhoto: company.photo,
            onPhotoUpload: onPhotoUpload || (async () => { }),
            isEditMode,
            loading: photoUploadLoading,
            error: photoUploadError,
            compact: true,
        };

        return (
            <div className={cn(
                'flex-shrink-0 rounded-lg overflow-hidden',
                isMobile ? 'w-16 h-16' : isTablet ? 'w-20 h-20' : 'w-32 h-32',
                'touch:active:scale-95 transition-transform duration-150'
            )}>
                <PhotoUpload {...photoUploadProps} />
            </div>
        );
    };

    // Render name and basic info section
    const renderNameSection = () => {
        return (
            <div className={cn(
                isMobile || isTablet ? 'flex-1 min-w-0' : 'mt-4'
            )}>
                {/* Furigana name (Japanese reading) */}
                {!isEditMode && renderFuriganaName()}

                {/* Main company name */}
                <h1 className={cn(
                    'font-semibold text-gray-900 truncate',
                    isMobile ? 'text-lg leading-tight' : isTablet ? 'text-xl' : 'text-2xl'
                )}>
                    {company.name || 'Company Name'}
                </h1>

                {/* Company ID (display under name) */}
                {company.companyId && !isEditMode && (
                    <div className={cn('text-gray-600', isMobile ? 'text-xs' : 'text-sm')}>
                        <span className="font-medium">{_t('company.companyId')}: </span>{company.companyId}
                    </div>
                )}

                {/* Basic info row - only show in view mode */}
                {!isEditMode && (
                    <div className={cn(
                        'mt-2 space-y-1',
                        isMobile && 'text-xs'
                    )}>
                        {/* Corporate Number - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs truncate' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.corporateNumber')}: </span>{company.corporateNumber || ''}
                        </div>

                        {/* Status - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.status')}: </span>{company.status?.toUpperCase() || ''}
                        </div>

                        {/* Establishment Date - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.established')}: </span>{company.establishmentDate ? formatEstablishmentDate(company.establishmentDate) : ''}
                        </div>

                        {/* Country - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.country')}: </span>{company.country || ''}
                        </div>

                        {/* Region - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.region')}: </span>{company.region || ''}
                        </div>

                        {/* Prefecture - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.prefecture')}: </span>{company.prefecture || ''}
                        </div>

                        {/* City - always show */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.destination.city')}: </span>{company.city || ''}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render edit form fields
    const renderEditFields = () => {
        if (!isEditMode || !onFieldChange) return null;

        // No additional fields in edit mode - all fields are handled by DestinationFormFields
        return null;
    };

    // Mobile/Tablet layout: photo on left, info on right (full width with border)
    if (isMobile || isTablet) {
        return (
            <div className="bg-white border-b border-gray-200 p-4 safe-area-inset">
                <div className={cn(
                    'flex items-start',
                    isMobile ? 'space-x-3' : 'space-x-4'
                )}>
                    {renderPhotoSection()}
                    <div className="flex-1 min-w-0">
                        {renderNameSection()}
                    </div>
                </div>
                {renderEditFields()}
            </div>
        );
    }

    // Desktop sidebar layout: photo above name, no background/border (handled by parent)
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
                {renderPhotoSection()}
                <div className="w-full mt-4">
                    {renderNameSection()}
                </div>
            </div>
            {renderEditFields()}
        </div>
    );
};
