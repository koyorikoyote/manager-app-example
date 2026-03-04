import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { DetailPageLayout } from '../layout/DetailPageLayout';
import { DestinationFormFields } from '../forms/DestinationFormFields';
import { ConfirmDialog } from '../ui/Dialog';
import { CompanyHeaderSection } from '../company/CompanyHeaderSection';
import { CompanyTabbedInterface } from '../company/CompanyTabbedInterface';
import { CompanyDetailPageSkeleton } from '../ui/CompanyDetailSkeletons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useResponsive } from '../../hooks/useResponsive';
import { formatDateForBackend } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { companyService } from '../../services/companyService';
import { FormValidator } from '../../../shared/validation/validator';
import { COMPANY_VALIDATION_SCHEMA } from '../../../shared/validation/schemas';
import {
    validateCorporateNumber,
    validateFuriganaName,
    validateEstablishmentDate,
    validatePostalCode,
    validateAddressComponent,
    validateWebsiteUrl,
    validateEmailAddress,
    validatePhoneNumber,
    validateHiringVacancies,
} from '../../../shared/validation/companyValidationUtils';
import { Company } from '../../../shared/types';

export const DestinationDetailPage: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { showError } = useToast();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { createCloseHandler, handlePostDeleteNavigation, handlePostUpdateNavigation } = useResponsiveNavigation();
    const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();
    const { isDesktop, isLargeDesktop } = useResponsive();

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
    const [destination, setDestination] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Company>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

    // Initialize form validator with useMemo to prevent re-creation on every render
    const formValidator = useMemo(() => new FormValidator(COMPANY_VALIDATION_SCHEMA), []);

    // Translate validation error messages
    const translateValidationError = useCallback((message: string): string => {
        if (message.startsWith('validationErrors.') || message.startsWith('photoUpload.')) {
            const [key, ...params] = message.split('|');
            const vars: Record<string, string> = {};

            params.forEach(param => {
                const [paramKey, paramValue] = param.split(':');
                if (paramKey && paramValue) {
                    vars[paramKey] = paramValue;
                }
            });

            return t(key as any, vars);
        }
        return message;
    }, [t]);

    // Form data for dropdowns
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
    const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
    const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);

    // Fetch destination data
    const fetchDestination = useCallback(async () => {
        if (!id) {
            setError('Destination ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const destinationData = await companyService.getCompany(parseInt(id));

            setDestination(destinationData);
            setFormData(destinationData);
        } catch (err) {
            console.error('Failed to fetch destination:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch destination details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch form data for dropdowns
    const fetchFormData = useCallback(async () => {
        try {
            // Fetch real users from the database
            const users = await companyService.getUsersForDropdown();
            const mockNationalities = ['Japanese', 'Filipino', 'Vietnamese', 'Indonesian', 'Thai', 'Other'];
            const mockIndustries = ['Manufacturing', 'Construction', 'Healthcare', 'Education', 'Technology'];

            setAvailableUsers(users);
            setAvailableNationalities(mockNationalities);
            setAvailableIndustries(mockIndustries);
        } catch (error) {
            console.error('Failed to fetch form data:', error);
            // Fallback to empty array if API fails
            setAvailableUsers([]);
        }
    }, []);

    // Initial fetch - wait for auth to be ready
    useEffect(() => {
        // Only fetch data when authentication is ready and user is authenticated
        if (!authLoading && isAuthenticated && user) {
            fetchDestination();
        }
    }, [fetchDestination, authLoading, isAuthenticated, user]);

    // Fetch form data (users, nationalities, industries) - no auth required
    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // Set document title for web view mode
    useEffect(() => {
        if ((isDesktop || isLargeDesktop) && destination?.name) {
            const title = isEditMode ? t("detailPages.newPages.destination.editingLabel") + ` ${destination.name}` : destination.name;
            document.title = title;
            return () => {
                document.title = t('header.managerApp');
            };
        }
    }, [isDesktop, isLargeDesktop, destination?.name, isEditMode, t]);



    // Handle edit mode toggle
    const handleEdit = () => {
        navigate(`/destinations/${id}?edit=true`);
    };

    // Handle cancel edit
    const handleCancel = () => {
        const baseUrl = `/destinations/${id}`;
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
                    backToListUrl: '/destinations'
                }
            });
        }

        setFormData(destination || {});
        setFormErrors({});
    };

    // Handle form field changes with comprehensive validation
    const handleFieldChange = useCallback((field: keyof Company, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Real-time validation using FormValidator and enhanced utilities
        const errors = { ...formErrors };

        // First, use the standard FormValidator
        const fieldError = formValidator.validateField(field, value);
        if (fieldError) {
            errors[field] = fieldError.message;
        } else {
            delete errors[field];
        }

        // Enhanced validation for specific fields
        if (field === 'corporateNumber' && typeof value === 'string') {
            const validationError = validateCorporateNumber(value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        if (field === 'furiganaName' && typeof value === 'string') {
            const validationError = validateFuriganaName(value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        if (field === 'establishmentDate' && value instanceof Date) {
            const validationError = validateEstablishmentDate(value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        if (field === 'postalCode' && typeof value === 'string') {
            const validationError = validatePostalCode(value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        // Address component validation
        if (field === 'address' && typeof value === 'string') {
            const validationError = validateAddressComponent(field, value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        if (field === 'website' && typeof value === 'string') {
            const validationError = validateWebsiteUrl(value);
            if (validationError) {
                errors[field] = validationError.message;
            } else {
                delete errors[field];
            }
        }

        if (field === 'email' && typeof value === 'string') {
            const validationError = validateEmailAddress(value);
            if (validationError) {
                errors[field] = translateValidationError(validationError.message);
            } else {
                delete errors[field];
            }
        }

        if (field === 'phone' && typeof value === 'string') {
            const validationError = validatePhoneNumber(value);
            if (validationError) {
                errors[field] = translateValidationError(validationError.message);
            } else {
                delete errors[field];
            }
        }

        if (field === 'hiringVacancies' && typeof value === 'number') {
            const validationError = validateHiringVacancies(value);
            if (validationError) {
                errors[field] = translateValidationError(validationError.message);
            } else {
                delete errors[field];
            }
        }

        setFormErrors(errors);
    }, [formErrors, formValidator, translateValidationError]);

    // Get field error
    const getFieldError = useCallback((field: string) => {
        return formErrors[field];
    }, [formErrors]);

    // Handle photo upload with comprehensive error handling
    const handlePhotoUpload = useCallback(async (file: File) => {
        if (!id) return;

        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            const { photoUrl } = await companyService.uploadPhoto(parseInt(id), file);

            setDestination(prev => prev ? { ...prev, photo: photoUrl } : null);
            setFormData(prev => ({ ...prev, photo: photoUrl }));
        } catch (err) {
            console.error('Failed to upload photo:', err);
            setPhotoUploadError(err instanceof Error ? err.message : 'Failed to upload photo');
        } finally {
            setPhotoUploadLoading(false);
        }
    }, [id]);

    // Comprehensive form validation using FormValidator and enhanced utilities
    const validateForm = (): boolean => {
        const validationResult = formValidator.validateForm(formData);

        // Convert validation errors to the format expected by the form
        const errors: Record<string, string> = {};
        validationResult.errors.forEach(error => {
            errors[error.field] = error.message;
        });

        // Enhanced validation for specific fields
        if (formData.corporateNumber && typeof formData.corporateNumber === 'string') {
            const validationError = validateCorporateNumber(formData.corporateNumber);
            if (validationError) {
                errors.corporateNumber = validationError.message;
            }
        }

        if (formData.furiganaName && typeof formData.furiganaName === 'string') {
            const validationError = validateFuriganaName(formData.furiganaName);
            if (validationError) {
                errors.furiganaName = validationError.message;
            }
        }

        if (formData.establishmentDate && formData.establishmentDate instanceof Date) {
            const validationError = validateEstablishmentDate(formData.establishmentDate);
            if (validationError) {
                errors.establishmentDate = validationError.message;
            }
        }

        // Validate address components
        ['country', 'region', 'prefecture', 'city'].forEach(field => {
            const value = formData[field as keyof Company];
            if (value && typeof value === 'string') {
                const validationError = validateAddressComponent(field, value);
                if (validationError) {
                    errors[field] = translateValidationError(validationError.message);
                }
            }
        });

        if (formData.website && typeof formData.website === 'string') {
            const validationError = validateWebsiteUrl(formData.website);
            if (validationError) {
                errors.website = translateValidationError(validationError.message);
            }
        }

        if (formData.email && typeof formData.email === 'string') {
            const validationError = validateEmailAddress(formData.email);
            if (validationError) {
                errors.email = translateValidationError(validationError.message);
            }
        }

        if (formData.phone && typeof formData.phone === 'string') {
            const validationError = validatePhoneNumber(formData.phone);
            if (validationError) {
                errors.phone = translateValidationError(validationError.message);
            }
        }

        if (formData.hiringVacancies && typeof formData.hiringVacancies === 'number') {
            const validationError = validateHiringVacancies(formData.hiringVacancies);
            if (validationError) {
                errors.hiringVacancies = translateValidationError(validationError.message);
            }
        }

        if (formData.postalCode && typeof formData.postalCode === 'string') {
            const validationError = validatePostalCode(formData.postalCode);
            if (validationError) {
                errors.postalCode = translateValidationError(validationError.message);
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Helper function to clean form data for server submission
    const cleanFormDataForSubmission = (data: Partial<Company>) => {
        const cleanedData: Record<string, unknown> = { ...data };

        // Clean all date fields - ensure they're in YYYY-MM-DD format or null
        const dateFields = ['establishmentDate'];
        dateFields.forEach(field => {
            if (cleanedData[field] !== undefined) {
                cleanedData[field] = formatDateForBackend(cleanedData[field] as Date | string | null);
            }
        });

        // Convert empty strings to null for optional fields
        const optionalStringFields = [
            'photo', 'corporateNumber', 'furiganaName', 'country', 'region', 'prefecture', 'city', 'postalCode',
            'preferredStatusOfResidence', 'preferredAge', 'preferredExperience', 'preferredQualifications',
            'preferredPersonality', 'preferredEducation', 'preferredJapaneseProficiency',
            'destinationWorkEnvironment', 'destinationAverageAge', 'destinationWorkPlace', 'destinationTransfer',
            'jobSelectionProcess', 'jobPastRecruitmentHistory', 'jobSalary', 'jobOvertimeRate',
            'jobSalaryIncreaseRate', 'jobSalaryBonus', 'jobAllowances', 'jobEmployeeBenefits',
            'jobRetirementBenefits', 'jobTermsAndConditions', 'jobDisputePreventionMeasures',
            'jobProvisionalHiringConditions', 'jobContractRenewalConditions', 'jobRetirementConditions'
        ];

        optionalStringFields.forEach(field => {
            if (cleanedData[field] === '' || cleanedData[field] === undefined) {
                cleanedData[field] = null;
            }
        });

        // Remove any fields that shouldn't be sent to the server
        delete cleanedData.id;
        delete cleanedData.createdAt;
        delete cleanedData.updatedAt;
        delete cleanedData.userInCharge;
        delete cleanedData.staff;

        return cleanedData;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateForm() || !id) {
            // Show validation errors as toast messages
            const errorMessages = Object.entries(formErrors)
                .map(([field, message]) => `${field}: ${translateValidationError(message)}`)
                .join('\n');

            if (errorMessages) {
                showError(
                    t("userManagement.validationErrors.formHasErrors"),
                    errorMessages
                );
            }
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
            console.log('Cleaned destination form data:', cleanedFormData);

            await companyService.updateCompany(parseInt(id), cleanedFormData);

            // Refresh data and handle navigation based on how page was opened
            await fetchDestination();
            handlePostUpdateNavigation('destination', id);
        } catch (err) {
            console.error('Failed to save destination:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to save destination';

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

            // Handle validation errors specifically
            if (err && typeof err === 'object' && 'response' in err) {
                const response = (err as { response?: { data?: { message?: string } } }).response;
                if (response && response.data && response.data.message) {
                    errorMessage = response.data.message;
                }
            }

            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle delete
    const handleDelete = () => {
        if (!destination) return;

        showConfirmDialog({
            title: t('common.actions.delete'),
            message: `Are you sure you want to delete ${destination.name}? This action cannot be undone.`,
            variant: 'destructive',
            confirmText: t('common.actions.delete'),
            cancelText: t('common.actions.cancel'),
            onConfirm: async () => {
                try {
                    await companyService.deleteCompany(destination.id);
                    // Handle navigation based on how page was opened
                    handlePostDeleteNavigation('destination');
                } catch (err) {
                    console.error('Failed to delete destination:', err);
                    setError(err instanceof Error ? err.message : 'Failed to delete destination');
                }
            },
        });
    };





    // Render destination details content with new tabbed interface
    const renderDestinationDetails = () => {
        if (!destination) return null;

        const isWebView = isDesktop || isLargeDesktop;

        if (isWebView) {
            return (
                <div className="flex gap-6 h-full">
                    {/* Left sidebar with header info */}
                    <div className="w-80 flex-shrink-0">
                        <div className="bg-gray-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                            <CompanyHeaderSection
                                company={destination}
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
                        <CompanyTabbedInterface
                            company={destination}
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
                // Enhanced mobile layout with safe area support
                'safe-area-inset'
            )}>
                {/* Header section for mobile/tablet */}
                <CompanyHeaderSection
                    company={destination}
                    isEditMode={false}
                    onPhotoUpload={handlePhotoUpload}
                    onFieldChange={handleFieldChange}
                    getFieldError={getFieldError}
                    photoUploadLoading={photoUploadLoading}
                    photoUploadError={photoUploadError}
                />

                {/* Tabbed interface with enhanced mobile support */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <CompanyTabbedInterface
                        company={destination}
                        isEditMode={false}
                        onFieldChange={handleFieldChange}
                        getFieldError={getFieldError}
                    />
                </div>
            </div>
        );
    };



    // Get page title
    const getPageTitle = () => {
        if (isEditMode) {
            return destination ? t("detailPages.newPages.destination.editingLabel") + ` ${destination.name}` : 'Edit Destination';
        }
        return destination ? destination.name : 'Destination Details';
    };

    // Show optimized skeleton while loading
    if (loading || authLoading) {
        return (
            <DetailPageLayout
                title="Loading..."
                isEditMode={false}
                isLoading={true}
                error={null}
                onEdit={() => { }}
                onDelete={() => { }}
                onSave={() => { }}
                onCancel={() => { }}
                onClose={() => { }}
                isSaving={false}
                showEditButton={false}
                showDeleteButton={false}
            >
                <CompanyDetailPageSkeleton />
            </DetailPageLayout>
        );
    }

    return (
        <>
            <DetailPageLayout
                title={getPageTitle()}
                isEditMode={isEditMode}
                isLoading={false}
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
                        // Enhanced mobile layout with safe area support
                        'safe-area-inset'
                    )}>
                        {/* Header section in edit mode */}
                        <div className={cn(
                            isDesktop || isLargeDesktop ? "flex gap-6" : "",
                            // Better mobile spacing
                            !(isDesktop || isLargeDesktop) && "space-y-4"
                        )}>
                            {(isDesktop || isLargeDesktop) && (
                                <div className="w-80 flex-shrink-0">
                                    <div className="bg-gray-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                                        <CompanyHeaderSection
                                            company={formData as Company}
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
                                    <CompanyHeaderSection
                                        company={formData as Company}
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
                                    <DestinationFormFields
                                        formData={formData}
                                        onFieldChange={handleFieldChange}
                                        getFieldError={getFieldError}
                                        isLoading={isSaving}
                                        isEditMode={isEditMode}
                                        availableUsers={availableUsers}
                                        availableNationalities={availableNationalities}
                                        availableIndustries={availableIndustries}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    renderDestinationDetails()
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
