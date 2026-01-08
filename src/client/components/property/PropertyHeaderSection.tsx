import React, { memo, useMemo, useCallback } from 'react';
import { PhotoUpload } from '../ui/PhotoUpload';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import type { Property, PhotoUploadProps } from '../../../shared/types';

// Enhanced Property interface with new fields from requirements
interface EnhancedProperty extends Property {
    // New header fields from requirements
    photo?: string | null;
    furiganaName?: string | null;
    establishmentDate?: Date | null;
}

export interface PropertyHeaderSectionProps {
    property: EnhancedProperty;
    isEditMode: boolean;
    onPhotoUpload?: (file: File) => Promise<void>;
    onFieldChange?: (field: keyof EnhancedProperty, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    photoUploadLoading?: boolean;
    photoUploadError?: string | null;
}

const PropertyHeaderSectionComponent: React.FC<PropertyHeaderSectionProps> = ({
    property,
    isEditMode,
    onPhotoUpload,
    onFieldChange,
    getFieldError: _getFieldError,
    photoUploadLoading = false,
    photoUploadError = null,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();

    // Memoized format furigana name with proper Japanese styling
    const renderFuriganaName = useMemo(() => {
        if (!property.furiganaName) return null;

        return (
            <div className="text-sm text-gray-600 mb-1">
                <ruby className="text-xs">
                    {property.furiganaName}
                </ruby>
            </div>
        );
    }, [property.furiganaName]);

    // Memoized format establishment date
    const formatEstablishmentDate = useCallback((date: Date | null | undefined) => {
        if (!date) return null;
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }, []);

    // Memoized get status label
    const getStatusLabel = useCallback((status: Property['status']): string => {
        switch (status) {
            case 'ACTIVE':
                return 'Active';
            case 'INACTIVE':
                return 'Inactive';
            case 'UNDER_CONSTRUCTION':
                return 'Under Construction';
            case 'SOLD':
                return 'Sold';
            default:
                return status;
        }
    }, []);

    // Memoized get property type label
    const getPropertyTypeLabel = useCallback((type: Property['propertyType']): string => {
        switch (type) {
            case 'RESIDENTIAL':
                return 'Residential';
            case 'COMMERCIAL':
                return 'Commercial';
            case 'INDUSTRIAL':
                return 'Industrial';
            case 'MIXED_USE':
                return 'Mixed Use';
            default:
                return type;
        }
    }, []);

    // Memoized render photo section
    const renderPhotoSection = useMemo(() => {
        const photoUploadProps: PhotoUploadProps = {
            currentPhoto: property.photo,
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
    }, [property.photo, onPhotoUpload, isEditMode, photoUploadLoading, photoUploadError, isMobile, isTablet]);

    // Memoized render name and basic info section
    const renderNameSection = useMemo(() => {
        return (
            <div className={cn(
                isMobile || isTablet ? 'flex-1 min-w-0' : 'mt-4'
            )}>
                {/* Furigana name (Japanese reading) */}
                {!isEditMode && renderFuriganaName}

                {/* Main property name */}
                <h1 className={cn(
                    'font-semibold text-gray-900 truncate',
                    isMobile ? 'text-lg leading-tight' : isTablet ? 'text-xl' : 'text-2xl'
                )}>
                    {property.name || 'Property Name'}
                </h1>

                {/* Basic info row - only show in view mode */}
                {!isEditMode && (
                    <div className={cn(
                        'mt-2 space-y-1',
                        isMobile && 'text-xs'
                    )}>
                        {/* Property Code */}
                        {property.propertyCode && (
                            <div className={cn(
                                'text-gray-600',
                                isMobile ? 'text-xs truncate' : 'text-sm'
                            )}>
                                <span className="font-medium">{_t('detailPages.leftColumn.property.propertyCode')}: </span>{property.propertyCode}
                            </div>
                        )}

                        {/* Status */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.property.status')}: </span>{getStatusLabel(property.status)}
                        </div>

                        {/* Property Type */}
                        <div className={cn(
                            'text-gray-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.property.type')}: </span>{getPropertyTypeLabel(property.propertyType)}
                        </div>

                        {/* Establishment Date */}
                        {property.establishmentDate && (
                            <div className={cn(
                                'text-gray-600',
                                isMobile ? 'text-xs' : 'text-sm'
                            )}>
                                <span className="font-medium">{_t('detailPages.leftColumn.property.established')}: </span>{formatEstablishmentDate(property.establishmentDate)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }, [isMobile, isTablet, isEditMode, renderFuriganaName, property.name, property.propertyCode, property.status, property.propertyType, property.establishmentDate, getStatusLabel, getPropertyTypeLabel, formatEstablishmentDate, _t]);

    // Render edit form fields - removed duplicated fields that are now in PropertyFormFields
    const renderEditFields = () => {
        if (!isEditMode || !onFieldChange) return null;

        // No fields rendered here in edit mode - all fields moved to PropertyFormFields component
        // to avoid duplication between left sidebar and main form
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
                    {renderPhotoSection}
                    <div className="flex-1 min-w-0">
                        {renderNameSection}
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
                {renderPhotoSection}
                <div className="w-full mt-4">
                    {renderNameSection}
                </div>
            </div>
            {renderEditFields()}
        </div>
    );
};

PropertyHeaderSectionComponent.displayName = 'PropertyHeaderSection';

export const PropertyHeaderSection = memo(PropertyHeaderSectionComponent);
