import React, { useState, useCallback } from "react";
import {
  StandardFormDialog,
  FormField,
  FormInput,
  FormDateInput,
  FormSelect,
  FormTextarea,
  type FormError,
} from "./StandardFormDialog";
import { PhotoUpload } from "./PhotoUpload";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatDateForInput } from "../../utils/dateUtils";
import { dailyRecordValidator } from "../../../shared/validation";
import type { DailyRecordWithRelations } from "../../../shared/types";

interface DailyRecordFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record?: DailyRecordWithRelations | null;
  onSubmit: (data: Partial<DailyRecordWithRelations>) => Promise<void>;
  isLoading?: boolean;
  errors?: FormError[];
  availableStaff?: Array<{
    id: number;
    name: string;
    employeeId: string | null;
  }>;
}

interface DailyRecordFormFieldsProps {
  formData?: Partial<DailyRecordWithRelations>;
  onFieldChange?: (
    field: keyof DailyRecordWithRelations,
    value: unknown
  ) => void;
  getFieldError?: (field: string) => string | undefined;
  isLoading?: boolean;
  availableStaff?: Array<{
    id: number;
    name: string;
    employeeId: string | null;
  }>;
  [key: string]: unknown; // Allow additional props from StandardFormDialog
}

const DailyRecordFormFields: React.FC<DailyRecordFormFieldsProps> = React.memo(
  (props) => {
    const {
      formData = {},
      onFieldChange = () => { },
      getFieldError = () => undefined,
      isLoading = false,
      availableStaff = [],
    } = props;

    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    // Photo upload handler
    const handlePhotoUpload = useCallback(async (file: File) => {
      setPhotoUploading(true);
      setPhotoError(null);

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('photo', file);

        // Get auth token from localStorage
        const token = localStorage.getItem("authToken");

        // Upload to daily-records directory with authentication
        const response = await fetch('/api/upload/daily-records', {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        onFieldChange('photo', result.filePath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setPhotoError(errorMessage);
      } finally {
        setPhotoUploading(false);
      }
    }, [onFieldChange]);

    // Photo remove handler
    const handlePhotoRemove = useCallback(async () => {
      if (formData.photo) {
        try {
          // Get auth token from localStorage
          const token = localStorage.getItem("authToken");

          // Remove photo from server with authentication
          await fetch(`/api/upload/daily-records/${encodeURIComponent(formData.photo)}`, {
            method: 'DELETE',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
        } catch (error) {
          console.warn('Failed to remove photo from server:', error);
        }
      }
      onFieldChange('photo', null);
      setPhotoError(null);
    }, [formData.photo, onFieldChange]);

    // Condition status options
    const { t } = useLanguage();

    const conditionStatusOptions = [
      { value: "Excellent", label: t("dailyRecord.conditionStatus.Excellent") },
      { value: "Good", label: t("dailyRecord.conditionStatus.Good") },
      { value: "Fair", label: t("dailyRecord.conditionStatus.Fair") },
      { value: "Poor", label: t("dailyRecord.conditionStatus.Poor") },
    ];

    // Staff options for dropdown with name and employeeId display
    const staffOptions = [
      { value: "", label: t("detailPages.common.selectOption") },
      ...availableStaff.map((staff) => ({
        value: staff.id.toString(),
        label: `${staff.name} (${staff.employeeId})`,
      })),
    ];

    return (
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t("detailPages.staff.sections.basicInformation")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("dailyRecord.columns.dateOfRecord")}
              required
              error={getFieldError("dateOfRecord")}
            >
              <FormDateInput
                type="date"
                value={formatDateForInput(formData.dateOfRecord as Date | string | null | undefined)}
                displayValue={formatDateForInput(formData.dateOfRecord as Date | string | null | undefined)}
                onChange={(e) =>
                  onFieldChange(
                    "dateOfRecord",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("dateOfRecord")}
              />
            </FormField>

            <FormField
              label={t("dailyRecord.columns.staffName")}
              required
              error={getFieldError("staffId")}
            >
              <FormSelect
                value={formData.staffId?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  onFieldChange("staffId", value ? parseInt(value) : null);
                }}
                disabled={isLoading}
                error={!!getFieldError("staffId")}
                options={staffOptions}
                placeholder={t("detailPages.common.selectOption")}
              />
            </FormField>

            <FormField
              label={t("dailyRecord.columns.conditionStatus")}
              required
              error={getFieldError("conditionStatus")}
            >
              <FormSelect
                value={formData.conditionStatus || ""}
                onChange={(e) =>
                  onFieldChange("conditionStatus", e.target.value)
                }
                disabled={isLoading}
                error={!!getFieldError("conditionStatus")}
                options={conditionStatusOptions}
                placeholder={t("detailPages.common.selectOption")}
              />
            </FormField>

            <FormField
              label={t("dailyRecord.columns.contactNumber")}
              error={getFieldError("contactNumber")}
            >
              <FormInput
                type="tel"
                value={formData.contactNumber || ""}
                onChange={(e) =>
                  onFieldChange("contactNumber", e.target.value || null)
                }
                disabled={isLoading}
                error={!!getFieldError("contactNumber")}
                placeholder={t("detailPages.staff.placeholders.enterPhoneNumber")}
              />
            </FormField>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t("dailyRecord.columns.feedbackContent")}
          </h4>

          <FormField
            label={t("dailyRecord.columns.feedbackContent")}
            required
            error={getFieldError("feedbackContent")}
          >
            <FormTextarea
              value={formData.feedbackContent || ""}
              onChange={(e) => onFieldChange("feedbackContent", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("feedbackContent")}
              placeholder={t("interactions.placeholders.enterDetailedDescription")}
              rows={4}
            />
          </FormField>
        </div>

        {/* Photo Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t("photoUpload.labels.photo")}
          </h4>

          <FormField
            label={t("photoUpload.labels.uploadPhoto")}
            error={getFieldError("photo") || photoError || undefined}
          >
            <PhotoUpload
              currentPhoto={formData.photo}
              onPhotoUpload={handlePhotoUpload}
              onPhotoRemove={handlePhotoRemove}
              isEditMode={true}
              loading={photoUploading}
              error={photoError}
            />
          </FormField>
        </div>
      </div>
    );
  }
);

DailyRecordFormFields.displayName = "DailyRecordFormFields";

export const DailyRecordFormDialog: React.FC<DailyRecordFormDialogProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isLoading = false,
  errors = [],
  availableStaff = [],
}) => {
  const { t } = useLanguage();

  const title = record
    ? `${t("common.actions.edit")} ${t("dailyRecord.title")}`
    : `${t("common.actions.create")} ${t("dailyRecord.title")}`;

  // Ensure the record has the correct staffId when editing
  const processedRecord = React.useMemo(() => {
    if (!record) return null;

    return {
      ...record,
      // Ensure staffId is properly set from either staffId or staff.id
      staffId: record.staffId || record.staff?.id || 0,
    };
  }, [record]);

  return (
    <StandardFormDialog
      isOpen={isOpen}
      onClose={onClose}
      record={processedRecord}
      onSubmit={onSubmit}
      title={title}
      isLoading={isLoading}
      errors={errors}
      validator={dailyRecordValidator}
      enableRealTimeValidation={true}
      showSuccessMessage={true}
      successMessage={
        record
          ? t("common.messages.updateSuccess")
          : t("common.messages.createSuccess")
      }
      disableBackdropClick={true}
    >
      <DailyRecordFormFields availableStaff={availableStaff} />
    </StandardFormDialog>
  );
};
