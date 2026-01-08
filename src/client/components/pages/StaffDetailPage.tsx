import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { DetailPageLayout } from '../layout/DetailPageLayout';
import { StaffFormFields } from '../forms/StaffFormFields';
import { ConfirmDialog } from '../ui/Dialog';
import { StaffHeaderSection, TabbedInterface } from '../staff';
import { StaffDetailSkeleton } from '../ui/StaffDetailSkeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useStaffFormValidation } from '../../hooks/useStaffFormValidation';
import { formatDateForBackend } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

import { staffService } from '../../services/staffService';
import { companyService } from '../../services/companyService';
import { Staff } from '../../../shared/types';

// Normalize date-like fields to Date objects for form usage in edit forms
const dateFieldKeys = ['hireDate', 'dateOfBirth', 'periodOfStayDateStart', 'periodOfStayDateEnd'] as const;

function toDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.trim()) {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/**
 * Returns a shallow copy of data with known date fields coerced to Date|null.
 * This prevents runtime errors in inputs that expect Date instances.
 */
function normalizeDateFields(data: Partial<Staff> | null | undefined): Partial<Staff> {
    const result: Record<string, unknown> = { ...(data || {}) };
    dateFieldKeys.forEach((key) => {
        if (key in result) {
            result[key] = toDate(result[key]);
        }
    });
    return result as Partial<Staff>;
}


export const StaffDetailPage: React.FC = () => {
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
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Staff>>({});
    const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

    // Track a pending photo removal when the user clears the photo in the UI.
    // Deletion of the file and clearing the DB field will only occur after a
    // successful save. We store the previous photo path so the server can delete it.
    const [pendingPhotoRemoval, setPendingPhotoRemoval] = useState<boolean>(false);
    const [_previousPhotoPath, setPreviousPhotoPath] = useState<string | null>(null);

    // Form validation
    const {
        errors: _validationErrors,
        isValid: _isValid,
        getFieldError,
        validateField,
        validateForm,
        clearAllErrors,
        showValidationErrors,
    } = useStaffFormValidation({
        initialData: formData,
        validateOnChange: true,
        validateOnBlur: true,
    });

    // Form data for dropdowns
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
    const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
    const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string }>>([]);

    // Fetch staff data
    const fetchStaff = useCallback(async () => {
        if (!id) {
            setError('Staff ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const staffData = await staffService.getStaffById(parseInt(id));
            setStaff(staffData);
            setFormData(normalizeDateFields(staffData));
        } catch (err) {
            console.error('Failed to fetch staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch staff details');
        } finally {
            setLoading(false);
        }
    }, [id]);

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
            setAvailableCompanies((companiesResp || []).map((c: any) => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Failed to fetch form data:', error);
        }
    }, []);

    // Initial fetch - wait for auth to be ready
    useEffect(() => {
        // Only fetch data when authentication is ready and user is authenticated
        if (!authLoading && isAuthenticated && user) {
            fetchStaff();
            fetchFormData();
        }
    }, [fetchStaff, fetchFormData, authLoading, isAuthenticated, user]);

    // Set document title for web view mode
    useEffect(() => {
        if ((isDesktop || isLargeDesktop) && staff?.name) {
            const title = isEditMode ? t("detailPages.newPages.staff.editingLabel") + ` ${staff.name}` : staff.name;
            document.title = title;
            return () => {
                document.title = t('header.managerApp');
            };
        }
    }, [isDesktop, isLargeDesktop, staff?.name, isEditMode, t]);



    // Handle edit mode toggle
    const handleEdit = () => {
        navigate(`/staff/${id}?edit=true`);
    };

    // Handle cancel edit
    const handleCancel = () => {
        const baseUrl = `/staff/${id}`;
        const isWebView = isDesktop || isLargeDesktop;

        if (isWebView) {
            // In web view, navigate to detail page with openedInNewTab parameter
            const urlWithParam = `${baseUrl}?openedInNewTab=true`;
            navigate(urlWithParam);
        } else {
            // In mobile view, navigate to detail page with special state
            navigate(baseUrl, {
                replace: true,
                state: {
                    fromCancelOperation: true,
                    backToListUrl: '/staff'
                }
            });
        }

        setFormData(normalizeDateFields(staff));
        clearAllErrors();
        setPhotoUploadError(null);
    };

    // Handle form field changes
    const handleFieldChange = useCallback((field: keyof Staff, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Trigger real-time validation
        validateField(field, value);
    }, [validateField]);

    // Handle photo upload
    const handlePhotoUpload = useCallback(async (file: File) => {
        if (!staff?.id) return;

        try {
            setPhotoUploadLoading(true);
            setPhotoUploadError(null);

            const photoResponse = await staffService.uploadPhoto(staff.id, file);

            // Update both staff and form data
            setStaff(prev => prev ? { ...prev, photo: photoResponse.photoUrl } : null);
            setFormData(prev => ({ ...prev, photo: photoResponse.photoUrl }));
        } catch (error) {
            console.error('Photo upload failed:', error);
            setPhotoUploadError(error instanceof Error ? error.message : 'Failed to upload photo');
        } finally {
            setPhotoUploadLoading(false);
        }
    }, [staff?.id]);

    // Handle photo removal (called when user clicks X). Mark photo for removal and clear preview.
    const handlePhotoRemove = useCallback(async (): Promise<void> => {
        // Capture the current server photo path (if any) so we can delete it later
        setPreviousPhotoPath(staff?.photo || null);

        // Mark for deferred deletion after successful save
        setPendingPhotoRemoval(true);

        // Clear preview / form immediately for UX; actual deletion happens after Save succeeds
        setFormData(prev => ({ ...prev, photo: null }));

        // Also update local staff object so UI immediately reflects removed preview
        setStaff(prev => (prev ? { ...prev, photo: null } : prev));
    }, [staff?.photo]);

    // Helper function to clean form data for server submission
    const cleanFormDataForSubmission = (data: Partial<Staff>): Partial<Staff> => {
        const cleanedData = { ...data } as Record<string, unknown>;

        // Clean userId - ensure it's a valid number or null
        if (cleanedData.userId !== undefined) {
            if (cleanedData.userId === null || cleanedData.userId === '' || cleanedData.userId === 0) {
                cleanedData.userId = null;
            } else {
                const userIdNum = parseInt(String(cleanedData.userId));
                cleanedData.userId = isNaN(userIdNum) ? null : userIdNum;
            }
        }

        // Clean all date fields - ensure they're in YYYY-MM-DD format or null
        const dateFields = ['hireDate', 'dateOfBirth', 'periodOfStayDateStart', 'periodOfStayDateEnd'];
        dateFields.forEach(field => {
            if (cleanedData[field] !== undefined) {
                cleanedData[field] = formatDateForBackend(cleanedData[field] as Date | string | null);
            }
        });

        // Prune dynamic group arrays (submit-time only) and normalize blanks → null
        const isEmptyValue = (v: unknown) =>
            v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

        const normalizeValue = (v: unknown) => {
            if (typeof v === 'string') {
                const trimmed = v.trim();
                if (trimmed === '') return null;
                return v;
            }
            return v ?? null;
        };

        // Education arrays: educationName, educationType (aligned)
        {
            const eduName = Array.isArray((cleanedData as any).educationName) ? [...(cleanedData as any).educationName as unknown[]] : [];
            const eduType = Array.isArray((cleanedData as any).educationType) ? [...(cleanedData as any).educationType as unknown[]] : [];
            const maxLen = Math.max(eduName.length, eduType.length);
            if (maxLen > 0) {
                const newEduName: unknown[] = [];
                const newEduType: unknown[] = [];
                for (let i = 0; i < maxLen; i++) {
                    const n = eduName[i];
                    const t = eduType[i];
                    const emptyGroup = isEmptyValue(n) && isEmptyValue(t);
                    if (!emptyGroup) {
                        newEduName.push(normalizeValue(n));
                        newEduType.push(normalizeValue(t));
                    }
                }
                (cleanedData as any).educationName = newEduName;
                (cleanedData as any).educationType = newEduType;
            }
        }

        // Work history arrays: aligned across all fields
        {
            const fields = [
                'workHistoryName',
                'workHistoryDateStart',
                'workHistoryDateEnd',
                'workHistoryCountryLocation',
                'workHistoryCityLocation',
                'workHistoryPosition',
                'workHistoryEmploymentType',
                'workHistoryDescription',
            ] as const;

            const lists: unknown[][] = fields.map((f) =>
                Array.isArray((cleanedData as any)[f]) ? [...(cleanedData as any)[f] as unknown[]] : []
            );
            const maxLen = lists.reduce((m, arr) => Math.max(m, arr.length), 0);
            if (maxLen > 0) {
                const newLists = fields.map(() => [] as unknown[]);
                for (let i = 0; i < maxLen; i++) {
                    const vals = lists.map((arr) => arr[i]);
                    const emptyGroup = vals.every(isEmptyValue);
                    if (!emptyGroup) {
                        vals.forEach((val, idx) => {
                            const fieldName = fields[idx];
                            if (fieldName === 'workHistoryDateStart' || fieldName === 'workHistoryDateEnd') {
                                newLists[idx].push(
                                    isEmptyValue(val) ? null : formatDateForBackend(val as Date | string | null)
                                );
                            } else {
                                newLists[idx].push(normalizeValue(val));
                            }
                        });
                    }
                }
                fields.forEach((f, idx) => {
                    (cleanedData as any)[f] = newLists[idx];
                });
            }
        }

        // Remove any fields that shouldn't be sent to the server
        delete cleanedData.id;
        delete cleanedData.createdAt;
        delete cleanedData.updatedAt;
        delete cleanedData.user;
        delete cleanedData.userInCharge;
        delete cleanedData.company;
        delete cleanedData.assignments;

        return cleanedData;
    };

    // Handle save
    const handleSave = async () => {
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

            // If the user marked the photo for deferred removal, remove the photo
            // field from the update payload so the PUT handler does not delete the file.
            // The photo will be deleted via the DELETE endpoint after the update succeeds.
            if (pendingPhotoRemoval) {
                delete (cleanedFormData as any).photo;
            }

            // Debug: Log the cleaned form data being sent
            console.log('Original form data:', formData);
            console.log('Cleaned form data being sent:', cleanedFormData);
            console.log('userId type and value:', typeof cleanedFormData.userId, cleanedFormData.userId);

            await staffService.updateStaff(parseInt(id), cleanedFormData);

            // If the user marked the photo for removal, perform deletion only after
            // the update succeeded. We call the existing DELETE endpoint which will
            // remove the file and set the DB photo field to null.
            if (pendingPhotoRemoval && staff?.id) {
                try {
                    await staffService.deletePhoto(staff.id);
                } catch (deleteErr) {
                    // Log the error but don't fail the whole save flow; surface a message.
                    console.error('Failed to delete photo after save:', deleteErr);
                    setError(
                        deleteErr instanceof Error ? deleteErr.message : 'Failed to delete photo after save'
                    );
                } finally {
                    setPendingPhotoRemoval(false);
                    setPreviousPhotoPath(null);
                }
            }

            // Refresh data and handle navigation based on how page was opened
            await fetchStaff();
            handlePostUpdateNavigation('staff', id);
        } catch (err) {
            console.error('Failed to save staff:', err);

            // Extract detailed error message from server response
            let errorMessage = 'Failed to save staff member';

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

    // Handle delete
    const handleDelete = () => {
        if (!staff) return;

        showConfirmDialog({
            title: t('common.actions.delete'),
            message: `Are you sure you want to delete ${staff.name}? This action cannot be undone.`,
            variant: 'destructive',
            confirmText: t('common.actions.delete'),
            cancelText: t('common.actions.cancel'),
            onConfirm: async () => {
                try {
                    // Use bulk-delete endpoint for single-item hard delete so record is removed from lists
                    await staffService.bulkDeleteStaff([staff.id]);
                    // Handle navigation based on how page was opened
                    handlePostDeleteNavigation('staff');
                } catch (err) {
                    console.error('Failed to delete staff:', err);
                    setError(err instanceof Error ? err.message : 'Failed to delete staff member');
                }
            },
        });
    };







    // Render staff details content
    const renderStaffDetails = () => {
        if (!staff) return null;

        const isWebView = isDesktop || isLargeDesktop;

        if (isWebView) {
            return (
                <div className="flex gap-6 h-full">
                    {/* Left sidebar with header info */}
                    <div className="w-80 flex-shrink-0">
                        <div className="bg-neutral-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                            <StaffHeaderSection
                                staff={staff}
                                isEditMode={false}
                                onPhotoUpload={handlePhotoUpload}
                                onPhotoRemove={handlePhotoRemove}
                                onFieldChange={handleFieldChange}
                                getFieldError={getFieldError}
                                photoUploadLoading={photoUploadLoading}
                                photoUploadError={photoUploadError}
                            />
                        </div>
                    </div>

                    {/* Main content with tabbed interface */}
                    <div className="flex-1 min-h-0">
                        <TabbedInterface
                            staff={staff}
                            isEditMode={false}
                            onFieldChange={handleFieldChange}
                            getFieldError={getFieldError}
                            availableUsers={availableUsers}
                            availableNationalities={availableNationalities}
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
                <StaffHeaderSection
                    staff={staff}
                    isEditMode={false}
                    onPhotoUpload={handlePhotoUpload}
                    onPhotoRemove={handlePhotoRemove}
                    onFieldChange={handleFieldChange}
                    getFieldError={getFieldError}
                    photoUploadLoading={photoUploadLoading}
                    photoUploadError={photoUploadError}
                />

                {/* Tabbed interface with enhanced mobile support */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <TabbedInterface
                        staff={staff}
                        isEditMode={false}
                        onFieldChange={handleFieldChange}
                        getFieldError={getFieldError}
                        availableUsers={availableUsers}
                        availableNationalities={availableNationalities}
                    />
                </div>
            </div>
        );
    };



    // Get page title
    const getPageTitle = () => {
        if (isEditMode) {
            return staff ? t("detailPages.newPages.staff.editingLabel") + ` ${staff.name}` : 'Edit Staff Member';
        }
        return staff ? staff.name : 'Staff Details';
    };

    return (
        <>
            <DetailPageLayout
                title={getPageTitle()}
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
                                    <div className="bg-neutral-50 p-6 rounded-lg sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                                        <StaffHeaderSection
                                            staff={formData as Staff}
                                            isEditMode={true}
                                            onPhotoUpload={handlePhotoUpload}
                                            onPhotoRemove={handlePhotoRemove}
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
                                    <StaffHeaderSection
                                        staff={formData as Staff}
                                        isEditMode={true}
                                        onPhotoUpload={handlePhotoUpload}
                                        onPhotoRemove={handlePhotoRemove}
                                        onFieldChange={handleFieldChange}
                                        getFieldError={getFieldError}
                                        photoUploadLoading={photoUploadLoading}
                                        photoUploadError={photoUploadError}
                                    />
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
                                        isEditMode={isEditMode}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (loading || authLoading) ? (
                    <StaffDetailSkeleton />
                ) : (
                    renderStaffDetails()
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
