import React from 'react';
import { PhotoUpload } from '../ui/PhotoUpload';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import type { Staff, PhotoUploadProps } from '../../../shared/types';

export interface StaffHeaderSectionProps {
    staff: Staff;
    isEditMode: boolean;
    onPhotoUpload?: (file: File) => Promise<void>;
    /**
     * Called when the user removes the currently displayed photo.
     * Implementations should remove the photo on the server and update state as needed.
     */
    onPhotoRemove?: () => Promise<void>;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    photoUploadLoading?: boolean;
    photoUploadError?: string | null;
}

export const StaffHeaderSection: React.FC<StaffHeaderSectionProps> = ({
    staff,
    isEditMode,
    onPhotoUpload,
    onPhotoRemove,
    onFieldChange,
    getFieldError: _getFieldError,
    photoUploadLoading = false,
    photoUploadError = null,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();



    // Format furigana name with proper Japanese styling
    const renderFuriganaName = () => {
        if (!staff.furiganaName) return null;

        return (
            <div className="text-sm text-neutral-600 mb-1">
                <ruby className="text-xs">
                    {staff.furiganaName}
                </ruby>
            </div>
        );
    };

    // Render photo section
    const renderPhotoSection = () => {
        const photoUploadProps: PhotoUploadProps = {
            currentPhoto: staff.photo,
            onPhotoUpload: onPhotoUpload || (async () => { }),
            onPhotoRemove: onPhotoRemove || (async () => { }),
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

                {/* Main name */}
                <h1 className={cn(
                    'font-semibold text-neutral-900 truncate',
                    isMobile ? 'text-lg leading-tight' : isTablet ? 'text-xl' : 'text-2xl'
                )}>
                    {staff.name || 'Staff Member'}
                </h1>

                {/* Basic info row - only show in view mode */}
                {!isEditMode && (
                    <div className={cn(
                        'mt-2 space-y-1',
                        isMobile && 'text-xs'
                    )}>
                        {/* Nationality */}
                        {staff.nationality && (
                            <div className={cn(
                                'text-neutral-600 truncate',
                                isMobile ? 'text-xs' : 'text-sm'
                            )}>
                                <span className="font-medium">{_t('detailPages.leftColumn.staff.nationality')}: </span>{staff.nationality ? _t(`staff.countries.${staff.nationality}` as any) : staff.nationality}
                            </div>
                        )}

                        {/* Gender */}
                        {staff.gender && (
                            <div className={cn(
                                'text-neutral-600',
                                isMobile ? 'text-xs' : 'text-sm'
                            )}>
                                <span className="font-medium">{_t('detailPages.leftColumn.staff.gender')}: </span>{staff.gender === 'M' ? _t('staff.gender.M' as any) : _t('staff.gender.F' as any)}
                            </div>
                        )}



                        {/* Status */}
                        <div className={cn(
                            'text-neutral-600',
                            isMobile ? 'text-xs' : 'text-sm'
                        )}>
                            <span className="font-medium">{_t('detailPages.leftColumn.staff.status')}: </span>{_t(`staff.status.${staff.status}` as any)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render edit form fields
    const renderEditFields = () => {
        if (!isEditMode || !onFieldChange) return null;

        return null; // No fields in left-side column during edit mode
    };

    // Mobile/Tablet layout: photo on left, info on right (full width with border)
    if (isMobile || isTablet) {
        return (
            <div className="bg-white border-b border-neutral-200 p-4 safe-area-inset">
                <div className="flex items-start space-x-4">
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
