import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../layout/DetailPageLayout';
import { PropertyFormFields } from '../forms/PropertyFormFields';
import { PropertyHeaderSection } from '../property/PropertyHeaderSection';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { propertyService } from '../../services/propertyService';
import { Property } from '../../../shared/types';
import { formatDateForBackend } from '../../utils/dateUtils';

export const PropertyNewPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { createCloseHandler, handlePostCreateNavigation } = useResponsiveNavigation();
    const { isDesktop, isLargeDesktop } = useResponsive();

    // State management
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Property>>({
        status: 'ACTIVE', // Default status
        propertyType: 'RESIDENTIAL', // Default property type
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [_photoFile, _setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

    // Form data for dropdowns
    const [availableManagers, setAvailableManagers] = useState<Array<{ id: number; name: string; email: string }>>([]);

    // Fetch form data for dropdowns
    const fetchFormData = useCallback(async () => {
        try {
            // For now, use mock data. In a real implementation, this would fetch from an API
            setAvailableManagers([
                { id: 1, name: 'John Manager', email: 'john@example.com' },
                { id: 2, name: 'Jane Manager', email: 'jane@example.com' }
            ]);
        } catch (error) {
            console.error('Failed to fetch form data:', error);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // Set document title for web view mode
    useEffect(() => {
        if (isDesktop || isLargeDesktop) {
            return () => {
                document.title = t('detailPages.newPages.property.title');
            };
        }
    }, [isDesktop, isLargeDesktop, t]);

    // Cleanup photo preview URL on unmount
    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    // Handle form field changes
    const handleFieldChange = useCallback((field: keyof Property, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Real-time validation for specific fields
        const errors = { ...formErrors };

        // Validate occupant count in real-time
        if (field === 'occupantCount') {
            if (value !== undefined && value !== null && String(value) !== '') {
                const count = typeof value === 'string' ? parseInt(value) : (typeof value === 'number' ? value : NaN);
                if (isNaN(count)) {
                    errors.occupantCount = 'Occupant count must be a valid number';
                } else if (count < 0) {
                    errors.occupantCount = 'Occupant count cannot be negative';
                } else {
                    delete errors.occupantCount;
                }
            } else {
                delete errors.occupantCount;
            }
        }

        // Clear field error when user starts typing (for other fields)
        if (formErrors[field] && !errors[field]) {
            delete errors[field];
        }

        setFormErrors(errors);
    }, [formErrors]);

    // Get field error
    const getFieldError = useCallback((field: string) => {
        return formErrors[field];
    }, [formErrors]);

    // Handle photo upload (store file for later upload after property creation)
    const handlePhotoUpload = useCallback(async (file: File) => {
        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            // Store the file for later upload
            _setPhotoFile(file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);

            // Update form data with preview
            setFormData(prev => ({ ...prev, photo: previewUrl }));
        } catch (error) {
            console.error('Photo preview failed:', error);
            setPhotoUploadError(error instanceof Error ? error.message : 'Failed to process photo');
        } finally {
            setPhotoUploadLoading(false);
        }
    }, []);

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            errors.name = 'Property name is required';
        }

        if (!formData.propertyCode?.trim()) {
            errors.propertyCode = 'Property code is required';
        }

        if (!formData.address?.trim()) {
            errors.address = 'Address is required';
        }

        if (!formData.propertyType) {
            errors.propertyType = 'Property type is required';
        }

        // Validate field lengths
        if (formData.name && formData.name.length > 255) {
            errors.name = 'Property name must be 255 characters or less';
        }

        if (formData.propertyCode && formData.propertyCode.length > 50) {
            errors.propertyCode = 'Property code must be 50 characters or less';
        }

        if (formData.address && formData.address.length > 500) {
            errors.address = 'Address must be 500 characters or less';
        }

        if (formData.description && formData.description.length > 1000) {
            errors.description = 'Description must be 1000 characters or less';
        }

        // Validate occupant count
        if (formData.occupantCount !== undefined && formData.occupantCount !== null && String(formData.occupantCount) !== '') {
            const count = typeof formData.occupantCount === 'string' ? parseInt(formData.occupantCount) : formData.occupantCount;
            if (isNaN(count)) {
                errors.occupantCount = 'Occupant count must be a valid number';
            } else if (count < 0) {
                errors.occupantCount = 'Occupant count cannot be negative';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            // Remove photo from form data for creation (will upload separately)
            const { photo, ...propertyData } = formData;

            // Normalize date fields to YYYY-MM-DD using shared utils
            const propertyDataNormalized: Partial<Property> = {
                ...propertyData,
                contractDate: formatDateForBackend(propertyData.contractDate as Date | string | null | undefined) as any,
                establishmentDate: formatDateForBackend(propertyData.establishmentDate as Date | string | null | undefined) as any,
            };

            // Create the property
            const newProperty = await propertyService.create(propertyDataNormalized as Omit<Property, "id" | "createdAt" | "updatedAt">);

            // Upload photo if one was selected
            if (_photoFile && newProperty.id) {
                try {
                    await propertyService.uploadPhoto(newProperty.id.toString(), _photoFile);
                } catch (photoError) {
                    console.error('Failed to upload photo:', photoError);
                    // Don't fail the entire operation if photo upload fails
                    setError('Property created successfully, but photo upload failed. You can upload a photo later.');
                }
            }

            // Handle navigation based on how page was opened
            handlePostCreateNavigation('property', newProperty.id.toString());
        } catch (err) {
            console.error('Failed to create property:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to create property';

            if (err instanceof Error) {
                errorMessage = err.message;
            }

            // Handle API client errors with more details
            if (err && typeof err === 'object' && 'originalError' in err) {
                const originalError = (err as { originalError?: { message?: string; error?: string } }).originalError;
                if (originalError && originalError.message) {
                    errorMessage = originalError.message;
                } else if (originalError && originalError.error) {
                    errorMessage = originalError.error;
                }
            }

            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        // Check if this page was opened in a new tab by looking for URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const isNewTab = urlParams.get("openedInNewTab") === "true";

        if (isNewTab) {
            // Try to close the current tab
            try {
                window.close();

                // If window.close() doesn't work (some browsers prevent it),
                // show a message or fallback to navigation
                setTimeout(() => {
                    // If we're still here after 100ms, window.close() didn't work
                    if (!window.closed) {
                        // Fallback: navigate to properties list
                        navigate('/residences');
                    }
                }, 100);
            } catch (error) {
                console.log("Could not close tab automatically:", error);
                // Fallback to normal navigation
                navigate('/residences');
            }
        } else {
            // Normal navigation behavior
            navigate('/residences');
        }
    };

    return (
        <DetailPageLayout
            title={t('detailPages.newPages.property.title')}
            isEditMode={true} // Always in edit mode for new records
            isLoading={false}
            error={error}
            onSave={handleSave}
            onCancel={handleCancel}
            onClose={createCloseHandler(false)}
            isSaving={isSaving}
            showEditButton={false} // No edit button needed
            showDeleteButton={false} // No delete button for new records
        >
            <div className={cn(
                'flex flex-col h-full',
                'safe-area-inset'
            )}>
                <div className={cn(
                    isDesktop || isLargeDesktop ? "flex gap-6" : "",
                    !(isDesktop || isLargeDesktop) && "space-y-4"
                )}>
                    {/* Photo upload section */}
                    {(isDesktop || isLargeDesktop) && (
                        <div className="w-80 flex-shrink-0">
                            <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
                                <PropertyHeaderSection
                                    property={{ ...formData, photo: photoPreview } as Property}
                                    isEditMode={true}
                                    onPhotoUpload={handlePhotoUpload}
                                    onFieldChange={handleFieldChange}
                                    getFieldError={getFieldError}
                                    photoUploadLoading={photoUploadLoading}
                                    photoUploadError={photoUploadError}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {!(isDesktop || isLargeDesktop) && (
                            <PropertyHeaderSection
                                property={{ ...formData, photo: photoPreview } as Property}
                                isEditMode={true}
                                onPhotoUpload={handlePhotoUpload}
                                onFieldChange={handleFieldChange}
                                getFieldError={getFieldError}
                                photoUploadLoading={photoUploadLoading}
                                photoUploadError={photoUploadError}
                            />
                        )}

                        <div className={cn(
                            isDesktop || isLargeDesktop ? "mt-0" : "mt-4"
                        )}>
                            <PropertyFormFields
                                formData={formData}
                                onFieldChange={handleFieldChange}
                                getFieldError={getFieldError}
                                isLoading={isSaving}
                                availableManagers={availableManagers}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DetailPageLayout>
    );
};
