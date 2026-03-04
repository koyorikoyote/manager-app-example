import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { DetailPageLayout } from '../layout/DetailPageLayout';
import { PropertyFormFields } from '../forms/PropertyFormFields';
import { ConfirmDialog } from '../ui/Dialog';
import { PropertyHeaderSection, PropertyTabbedInterface } from '../property';
import { PropertyDetailSkeleton } from '../ui';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePropertyFormValidation } from '../../hooks/usePropertyFormValidation';
import { cn } from '../../utils/cn';

import { propertyService } from '../../services/propertyService';
import { Property } from '../../../shared/types';
import { formatDateForBackend } from '../../utils/dateUtils';


export const PropertyDetailPage: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { showError } = useToast();
    const { isDesktop, isLargeDesktop } = useResponsive();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { createCloseHandler, handlePostDeleteNavigation, handlePostUpdateNavigation } = useResponsiveNavigation();
    const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();

    // Determine if we're in edit mode from URL params
    const isEditMode = searchParams.get('edit') === 'true';

    // Custom close handler that checks for special navigation state
    const customCloseHandler = useCallback(() => {
        const state = location.state as any;
        const isMobileView = !isDesktop && !isLargeDesktop;

        if (isMobileView && state && (state.fromSaveOperation || state.fromCancelOperation) && state.backToListUrl) {
            // If we came from save/cancel operation in mobile mode, go to list page
            navigate(state.backToListUrl);
        } else {
            // Use default close handler
            createCloseHandler(isEditMode)();
        }
    }, [location.state, isDesktop, isLargeDesktop, navigate, createCloseHandler, isEditMode]);

    // State management
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Property>>({});
    const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

    // Form validation
    const {
        errors: _validationErrors,
        isValid: _isValid,
        getFieldError,
        validateField,
        validateForm,
        clearAllErrors,
        showValidationErrors,
    } = usePropertyFormValidation({
        initialData: formData,
        validateOnChange: true,
        validateOnBlur: true,
    });

    // Form data for dropdowns (keeping for future use)
    const [_availableManagers, _setAvailableManagers] = useState<Array<{ id: number; name: string; email: string }>>([]);

    // Fetch property data
    const fetchProperty = useCallback(async () => {
        if (!id) {
            setError('Property ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const propertyData = await propertyService.getById(id);
            setProperty(propertyData);
            setFormData(propertyData);
        } catch (err) {
            console.error('Failed to fetch property:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch property details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch form data for dropdowns
    const fetchFormData = useCallback(async () => {
        try {
            // For now, use mock data. In a real implementation, this would fetch from an API
            // setAvailableManagers([
            //     { id: 1, name: 'John Manager', email: 'john@example.com' },
            //     { id: 2, name: 'Jane Manager', email: 'jane@example.com' }
            // ]);
        } catch (error) {
            console.error('Failed to fetch form data:', error);
        }
    }, []);

    // Initial fetch - wait for auth to be ready
    useEffect(() => {
        // Only fetch data when authentication is ready and user is authenticated
        if (!authLoading && isAuthenticated && user) {
            fetchProperty();
            fetchFormData();
        }
    }, [fetchProperty, fetchFormData, authLoading, isAuthenticated, user]);

    // Set document title for web view mode
    useEffect(() => {
        if ((isDesktop || isLargeDesktop) && property?.name) {
            const title = isEditMode ? t("detailPages.newPages.property.editingLabel") + ` ${property.name}` : property.name;
            document.title = title;
            return () => {
                document.title = t('header.managerApp');
            };
        }
    }, [isDesktop, isLargeDesktop, property?.name, isEditMode, t]);



    // Handle edit mode toggle
    const handleEdit = () => {
        navigate(`/residences/${id}?edit=true`);
    };

    // Handle cancel edit
    const handleCancel = () => {
        const baseUrl = `/residences/${id}`;
        const isWebView = isDesktop || isLargeDesktop;

        if (isWebView) {
            // In web view, navigate to detail page with openedInNewTab parameter
            const urlWithParam = `${baseUrl}?openedInNewTab=true`;
            navigate(urlWithParam);
        } else {
            // In mobile view, navigate to detail page but replace edit page in history
            navigate(baseUrl, { replace: true });

            // In mobile view, navigate to detail page with special state
            navigate(baseUrl, {
                replace: true,
                state: {
                    fromCancelOperation: true,
                    backToListUrl: '/residences'
                }
            });
        }

        setFormData(property || {});
        clearAllErrors();
        setPhotoUploadError(null);
    };

    // Handle form field changes
    const handleFieldChange = useCallback((field: keyof Property, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Trigger real-time validation
        validateField(field, value);
    }, [validateField]);

    // Handle photo upload
    const handlePhotoUpload = useCallback(async (file: File) => {
        if (!property?.id) return;

        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            const photoUrl = await propertyService.uploadPhoto(property.id.toString(), file);

            setProperty(prev => prev ? { ...prev, photo: photoUrl } : null);
            setFormData(prev => ({ ...prev, photo: photoUrl }));
        } catch (error) {
            console.error('Photo upload failed:', error);
            setPhotoUploadError(error instanceof Error ? error.message : 'Failed to upload photo');
        } finally {
            setPhotoUploadLoading(false);
        }
    }, [property?.id]);

    // Helper function to clean form data for server submission
    const cleanFormDataForSubmission = useCallback((data: Partial<Property>): Partial<Property> => {
        const cleanedData = { ...data } as Record<string, unknown>;

        // Normalize date fields to YYYY-MM-DD using shared utils
        if (cleanedData.contractDate !== undefined) {
            cleanedData.contractDate = formatDateForBackend(cleanedData.contractDate as Date | string | null | undefined);
        }
        if (cleanedData.establishmentDate !== undefined) {
            cleanedData.establishmentDate = formatDateForBackend(cleanedData.establishmentDate as Date | string | null | undefined);
        }

        // Remove any fields that shouldn't be sent to the server
        delete cleanedData.id;
        delete cleanedData.createdAt;
        delete cleanedData.updatedAt;
        delete cleanedData.manager;
        delete cleanedData.assignments;

        return cleanedData;
    }, []);

    // Handle save
    const handleSave = useCallback(async () => {
        // Validate form using the comprehensive validation system
        const isFormValid = validateForm(formData);

        if (!isFormValid || !id) {
            showValidationErrors(showError);
            return;
        }

        // Check if user has admin permissions (level 2 or higher)
        if (!user || user.role.level < 2) {
            setError('Admin access required to save changes');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            // Clean the form data before sending
            const cleanedFormData = cleanFormDataForSubmission(formData);

            await propertyService.update(id, cleanedFormData);

            // Refresh data and handle navigation based on how page was opened
            await fetchProperty();
            handlePostUpdateNavigation('property', id);
        } catch (err) {
            console.error('Failed to save property:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to save property';

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
    }, [validateForm, formData, id, user, showValidationErrors, showError, cleanFormDataForSubmission, fetchProperty, handlePostUpdateNavigation]);

    // Handle delete
    const handleDelete = useCallback(() => {
        if (!property) return;

        showConfirmDialog({
            title: t('common.actions.delete'),
            message: `Are you sure you want to delete ${property.name}? This action cannot be undone.`,
            variant: 'destructive',
            confirmText: t('common.actions.delete'),
            cancelText: t('common.actions.cancel'),
            onConfirm: async () => {
                try {
                    // Use bulk-delete endpoint for single-item hard delete so record is removed from lists
                    await propertyService.bulkDelete([property.id]);
                    // Handle navigation based on how page was opened
                    handlePostDeleteNavigation('property');
                } catch (err) {
                    console.error('Failed to delete property:', err);
                    setError(err instanceof Error ? err.message : 'Failed to delete property');
                }
            },
        });
    }, [property, t, showConfirmDialog, handlePostDeleteNavigation]);



    // Render property details content
    const renderPropertyDetails = useCallback(() => {
        if (!property) return null;

        const isWebView = isDesktop || isLargeDesktop;

        if (isWebView) {
            return (
                <div className="flex gap-6 h-full">
                    {/* Left sidebar with header info */}
                    <div className="w-80 flex-shrink-0">
                        <div className="bg-gray-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                            <PropertyHeaderSection
                                property={property}
                                isEditMode={false}
                                onPhotoUpload={handlePhotoUpload}
                                onFieldChange={handleFieldChange}
                                getFieldError={getFieldError}
                                photoUploadLoading={photoUploadLoading}
                                photoUploadError={photoUploadError}
                            />
                        </div>
                    </div>

                    {/* Main content with tabbed interface */}
                    <div className="flex-1 min-h-0">
                        <PropertyTabbedInterface
                            property={property}
                            isEditMode={false}
                            onFieldChange={handleFieldChange}
                            getFieldError={getFieldError}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className={cn(
                'flex flex-col h-full',
                'safe-area-inset'
            )}>
                {/* Header section for mobile/tablet */}
                <PropertyHeaderSection
                    property={property}
                    isEditMode={false}
                    onPhotoUpload={handlePhotoUpload}
                    onFieldChange={handleFieldChange}
                    getFieldError={getFieldError}
                    photoUploadLoading={photoUploadLoading}
                    photoUploadError={photoUploadError}
                />

                {/* Tabbed interface with enhanced mobile support */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <PropertyTabbedInterface
                        property={property}
                        isEditMode={false}
                        onFieldChange={handleFieldChange}
                        getFieldError={getFieldError}
                    />
                </div>
            </div>
        );
    }, [property, isDesktop, isLargeDesktop, handlePhotoUpload, handleFieldChange, getFieldError, photoUploadLoading, photoUploadError]);

    // Get page title
    const getPageTitle = useMemo(() => {
        if (isEditMode) {
            return property ? t("detailPages.newPages.property.editingLabel") + ` ${property.name}` : 'Edit Property';
        }
        return property ? property.name : 'Property Details';
    }, [isEditMode, property, t]);

    return (
        <>
            <DetailPageLayout
                title={getPageTitle}
                isEditMode={isEditMode}
                isLoading={loading || authLoading}
                error={error}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSave={handleSave}
                onCancel={handleCancel}
                onClose={customCloseHandler}
                isSaving={isSaving}
                showEditButton={!isEditMode && !!user && user.role.level >= 2}
                showDeleteButton={!isEditMode && !!user && user.role.level >= 2}
            >
                {isEditMode ? (
                    <div className={cn(
                        'flex flex-col h-full',
                        'safe-area-inset'
                    )}>
                        {/* Header section in edit mode */}
                        <div className={cn(
                            isDesktop || isLargeDesktop ? "flex gap-6" : "",
                            !(isDesktop || isLargeDesktop) && "space-y-4"
                        )}>
                            {(isDesktop || isLargeDesktop) && (
                                <div className="w-80 flex-shrink-0">
                                    <div className="bg-gray-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                                        <PropertyHeaderSection
                                            property={formData as Property}
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
                                        property={formData as Property}
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
                                        availableManagers={[]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (loading || authLoading) ? (
                    <PropertyDetailSkeleton />
                ) : (
                    renderPropertyDetails()
                )}
            </DetailPageLayout>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={dialogState.isOpen}
                onClose={hideConfirmDialog}
                onConfirm={handleConfirm}
                title={dialogState.title}
                message={dialogState.message}
                confirmText={dialogState.confirmText}
                cancelText={dialogState.cancelText}
                variant={dialogState.variant}
                isLoading={isDialogLoading}
            />
        </>
    );
};
