import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../layout/DetailPageLayout';
import { DestinationFormFields } from '../forms/DestinationFormFields';
import { CompanyHeaderSection } from '../company/CompanyHeaderSection';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { companyService } from '../../services/companyService';
import { Company } from '../../../shared/types';

export const DestinationNewPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { createCloseHandler, handlePostCreateNavigation } = useResponsiveNavigation();
    const { isDesktop, isLargeDesktop } = useResponsive();

    // State management
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Company>>({
        status: 'ACTIVE', // Default status
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

    // Form data for dropdowns
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
    const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
    const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);

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

    // Initial fetch
    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // Generate display-only companyId once on mount for new destination records.
    // This runs a single time and sets a formatted value (C + zero-padded 5 digits)
    // on the parent formData so the child form can display it without causing
    // render loops or extra network activity.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const allCompanies = await companyService.getAllCompanies();
                const maxId = (allCompanies || []).reduce((m: number, c: any) => Math.max(m, c?.id ?? 0), 0);
                const next = maxId + 1;
                const formatted = `C${String(next).padStart(5, '0')}`;

                setFormData(prev => {
                    if (cancelled) return prev;
                    if (prev.companyId) return prev;
                    return { ...prev, companyId: formatted };
                });
            } catch (err) {
                console.error('Failed to generate companyId:', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Set document title for web view mode
    useEffect(() => {
        if (isDesktop || isLargeDesktop) {
            return () => {
                document.title = t('detailPages.newPages.destination.title');
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
    const handleFieldChange = useCallback((field: keyof Company, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Real-time validation for specific fields
        const errors = { ...formErrors };

        // Validate email in real-time
        if (field === 'email') {
            if (value && typeof value === 'string') {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.email = 'Please enter a valid email address';
                } else if (value.length > 255) {
                    errors.email = 'Email must be 255 characters or less';
                } else {
                    delete errors.email;
                }
            } else {
                delete errors.email;
            }
        }

        // Validate phone in real-time
        if (field === 'phone') {
            if (value && typeof value === 'string') {
                if (!/^[\d\s\-+()]+$/.test(value)) {
                    errors.phone = 'Please enter a valid phone number';
                } else if (value.length > 20) {
                    errors.phone = 'Phone number must be 20 characters or less';
                } else {
                    delete errors.phone;
                }
            } else {
                delete errors.phone;
            }
        }

        // Validate website in real-time
        if (field === 'website') {
            if (value && typeof value === 'string') {
                if (!/^https?:\/\/.+/.test(value)) {
                    errors.website = 'Please enter a valid website URL';
                } else if (value.length > 255) {
                    errors.website = 'Website URL must be 255 characters or less';
                } else {
                    delete errors.website;
                }
            } else {
                delete errors.website;
            }
        }

        // Validate name length in real-time
        if (field === 'name') {
            if (value && typeof value === 'string' && value.length > 255) {
                errors.name = 'Company name must be 255 characters or less';
            } else if (!value || (typeof value === 'string' && !value.trim())) {
                errors.name = 'Company name is required';
            } else {
                delete errors.name;
            }
        }

        // Validate address length in real-time
        if (field === 'address') {
            if (value && typeof value === 'string' && value.length > 500) {
                errors.address = 'Address must be 500 characters or less';
            } else if (!value || (typeof value === 'string' && !value.trim())) {
                errors.address = 'Address is required';
            } else {
                delete errors.address;
            }
        }

        // Validate description length in real-time
        if (field === 'description') {
            if (value && typeof value === 'string' && value.length > 1000) {
                errors.description = 'Description must be 1000 characters or less';
            } else {
                delete errors.description;
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

    // Handle photo upload (store file for later upload after destination creation)
    const handlePhotoUpload = useCallback(async (file: File) => {
        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            // Store the file for later upload
            setPhotoFile(file);

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
            errors.name = 'Company name is required';
        }

        if (!formData.address?.trim()) {
            errors.address = 'Address is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            errors.website = 'Please enter a valid website URL';
        }

        // Validate field lengths
        if (formData.name && formData.name.length > 255) {
            errors.name = 'Company name must be 255 characters or less';
        }

        if (formData.address && formData.address.length > 500) {
            errors.address = 'Address must be 500 characters or less';
        }

        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }

        if (formData.phone && formData.phone.length > 20) {
            errors.phone = 'Phone number must be 20 characters or less';
        }

        if (formData.email && formData.email.length > 255) {
            errors.email = 'Email must be 255 characters or less';
        }

        if (formData.website && formData.website.length > 255) {
            errors.website = 'Website URL must be 255 characters or less';
        }

        if (formData.description && formData.description.length > 1000) {
            errors.description = 'Description must be 1000 characters or less';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Helper function to clean form data for server submission
    const cleanFormDataForSubmission = (data: Partial<Company>) => {
        const cleanedData: Record<string, unknown> = { ...data };

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

        return cleanedData;
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
            const { photo, ...destinationData } = formData;

            // Clean the form data before sending
            const cleanedFormData = cleanFormDataForSubmission(destinationData);

            // Create the destination
            const newDestination = await companyService.createCompany(cleanedFormData as Omit<Company, "id" | "createdAt" | "updatedAt">);

            // Upload photo if one was selected
            if (photoFile && newDestination.id) {
                try {
                    await companyService.uploadPhoto(newDestination.id, photoFile);
                } catch (photoError) {
                    console.error('Failed to upload photo:', photoError);
                    // Don't fail the entire operation if photo upload fails
                    setError('Destination created successfully, but photo upload failed. You can upload a photo later.');
                }
            }

            // Handle navigation based on how page was opened
            handlePostCreateNavigation('destination', newDestination.id.toString());
        } catch (err) {
            console.error('Failed to create destination:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to create destination';

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
                        // Fallback: navigate to destinations list
                        navigate('/destinations');
                    }
                }, 100);
            } catch (error) {
                console.log("Could not close tab automatically:", error);
                // Fallback to normal navigation
                navigate('/destinations');
            }
        } else {
            // Normal navigation behavior
            navigate('/destinations');
        }
    };

    return (
        <DetailPageLayout
            title={t('detailPages.newPages.destination.title')}
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
                                <CompanyHeaderSection
                                    company={{ ...formData, photo: photoPreview } as Company}
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
                                company={{ ...formData, photo: photoPreview } as Company}
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
                                isEditMode={true}
                                availableUsers={availableUsers}
                                availableNationalities={availableNationalities}
                                availableIndustries={availableIndustries}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DetailPageLayout>
    );
};
