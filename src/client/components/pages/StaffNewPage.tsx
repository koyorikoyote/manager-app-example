import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../layout/DetailPageLayout';
import { StaffFormFields } from '../forms/StaffFormFields';
import { PhotoUpload } from '../ui/PhotoUpload';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { staffService } from '../../services/staffService';
import { companyService } from '../../services/companyService';
import { Staff } from '../../../shared/types';

export const StaffNewPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { createCloseHandler, handlePostCreateNavigation } = useResponsiveNavigation();
    const { isDesktop, isLargeDesktop } = useResponsive();

    // State management
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Staff>>({
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
    const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string }>>([]);

    // Fetch form data for dropdowns
    const fetchFormData = useCallback(async () => {
        try {
            const [users, countries, companiesResp] = await Promise.all([
                staffService.getAvailableUsers(),
                staffService.getAvailableCountries(),
                companyService.getAllCompanies()
            ]);
            setAvailableUsers(users);
            setAvailableNationalities(countries);
            setAvailableCompanies((companiesResp || []).map((c) => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Failed to fetch form data:', error);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // Generate display-only employeeId once on mount for new staff records.
    // This runs a single time and sets a formatted value (C + zero-padded 5 digits)
    // on the parent formData so the child form can display it without causing
    // render loops or extra network activity.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const allStaff = await staffService.getAllStaff();
                const maxId = (allStaff || []).reduce((m: number, s: any) => Math.max(m, s?.id ?? 0), 0);
                const next = maxId + 1;
                const formatted = `C${String(next).padStart(5, '0')}`;

                // Safely set formData only if employeeId is not already set.
                setFormData(prev => {
                    if (cancelled) return prev;
                    if (prev.employeeId) return prev;
                    return { ...prev, employeeId: formatted };
                });
            } catch (err) {
                console.error('Failed to generate employeeId:', err);
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
                document.title = t('detailPages.newPages.staff.title');
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
    const handleFieldChange = useCallback((field: keyof Staff, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Real-time validation for specific fields
        const errors = { ...formErrors };

        // Validate age in real-time
        if (field === 'age') {
            if (value !== undefined && value !== null && String(value) !== '') {
                const age = typeof value === 'string' ? parseInt(value) : (typeof value === 'number' ? value : NaN);
                if (isNaN(age)) {
                    errors.age = 'Age must be a valid number';
                } else if (age < 0 || age > 150) {
                    errors.age = 'Age must be between 0 and 150';
                } else {
                    delete errors.age;
                }
            } else {
                delete errors.age;
            }
        }

        // Validate email in real-time
        if (field === 'email') {
            if (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.email = 'Please enter a valid email address';
            } else {
                delete errors.email;
            }
        }

        // Validate phone in real-time
        if (field === 'phone') {
            if (value && typeof value === 'string' && !/^[\d\s\-+()]+$/.test(value)) {
                errors.phone = 'Please enter a valid phone number';
            } else {
                delete errors.phone;
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

    // Handle photo upload (store file for later upload after staff creation)
    const handlePhotoUpload = useCallback(async (file: File) => {
        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            // Store the file for later upload
            setPhotoFile(file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
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
            errors.name = 'Name is required';
        }

        if (!formData.employeeId?.trim()) {
            errors.employeeId = 'ID is required';
        }

        if (!formData.position?.trim()) {
            errors.position = 'Position is required';
        }

        if (!formData.department?.trim()) {
            errors.department = 'Department is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Validate age
        if (formData.age !== undefined && formData.age !== null && String(formData.age) !== '') {
            const age = typeof formData.age === 'string' ? parseInt(formData.age) : formData.age;
            if (isNaN(age)) {
                errors.age = 'Age must be a valid number';
            } else if (age < 0 || age > 150) {
                errors.age = 'Age must be between 0 and 150';
            }
        }

        // Validate phone number format if provided
        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }

        // Validate name length
        if (formData.name && formData.name.length > 255) {
            errors.name = 'Name must be 255 characters or less';
        }

        // Validate employee ID length
        if (formData.employeeId && formData.employeeId.length > 50) {
            errors.employeeId = 'ID must be 50 characters or less';
        }

        // Validate position length
        if (formData.position && formData.position.length > 100) {
            errors.position = 'Position must be 100 characters or less';
        }

        // Validate department length
        if (formData.department && formData.department.length > 100) {
            errors.department = 'Department must be 100 characters or less';
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

            // Include employeeId in payload so backend saves it to employee_id
            const payload = { ...formData } as any;

            // Create the staff member
            const newStaff = await staffService.createStaff(payload as Omit<Staff, "id" | "createdAt" | "updatedAt">);

            // Upload photo if one was selected
            if (photoFile && newStaff.id) {
                try {
                    await staffService.uploadPhoto(newStaff.id, photoFile);
                } catch (photoError) {
                    console.error('Failed to upload photo:', photoError);
                    // Don't fail the entire operation if photo upload fails
                    setError('Staff member created successfully, but photo upload failed. You can upload a photo later.');
                }
            }

            // Handle navigation based on how page was opened
            handlePostCreateNavigation('staff', newStaff.id.toString());
        } catch (err) {
            console.error('Failed to create staff:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to create staff member';

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
                        // Fallback: navigate to staff list
                        navigate('/staff');
                    }
                }, 100);
            } catch (error) {
                console.log("Could not close tab automatically:", error);
                // Fallback to normal navigation
                navigate('/staff');
            }
        } else {
            // Normal navigation behavior
            navigate('/staff');
        }
    };

    return (
        <DetailPageLayout
            title={t('detailPages.newPages.staff.title')}
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
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <PhotoUpload
                                        currentPhoto={photoPreview}
                                        onPhotoUpload={handlePhotoUpload}
                                        isEditMode={true}
                                        loading={photoUploadLoading}
                                        error={photoUploadError}
                                        compact={true}
                                    />
                                    <div className="w-full">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                            {t('detailPages.newPages.staff.headerTitle')}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {t('detailPages.newPages.staff.uploadPhotoDescription')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {!(isDesktop || isLargeDesktop) && (
                            <div className="bg-white border-b border-gray-200 p-4 safe-area-inset">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <PhotoUpload
                                            currentPhoto={photoPreview}
                                            onPhotoUpload={handlePhotoUpload}
                                            isEditMode={true}
                                            loading={photoUploadLoading}
                                            error={photoUploadError}
                                            compact={true}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg font-semibold text-gray-900 mb-1">
                                            {t('detailPages.newPages.staff.headerTitle')}
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            {t('detailPages.newPages.staff.fillDetailsDescription')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={cn(
                            isDesktop || isLargeDesktop ? "mt-0" : "mt-4"
                        )}>
                            <StaffFormFields
                                formData={formData}
                                onFieldChange={handleFieldChange}
                                getFieldError={getFieldError}
                                isLoading={isSaving}
                                availableUsers={availableUsers}
                                availableNationalities={availableNationalities}
                                availableCompanies={availableCompanies}
                                isEditMode={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DetailPageLayout>
    );
};
