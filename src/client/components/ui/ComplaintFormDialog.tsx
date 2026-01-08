import React from "react";
import {
  StandardFormDialog,
  FormField,
  FormInput,
  FormDateInput,
  FormSelect,
  FormTextarea,
  type FormError,
} from "./StandardFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatDateForInput } from "../../utils/dateUtils";
import { complaintValidator } from "../../../shared/validation";
import type { ComplaintDetailWithRelations } from "../../../shared/types";

interface ComplaintFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record?: ComplaintDetailWithRelations | null;
  onSubmit: (data: Partial<ComplaintDetailWithRelations>) => Promise<void>;
  isLoading?: boolean;
  errors?: FormError[];
  availableUsers?: Array<{ id: number; name: string }>;
  availableCompanies?: Array<{ id: number; name: string }>;
  availableStaff?: Array<{ id: number; name: string; employeeId?: string }>;
}

interface ComplaintFormFieldsProps {
  formData?: Partial<ComplaintDetailWithRelations>;
  onFieldChange?: (
    field: keyof ComplaintDetailWithRelations,
    value: unknown
  ) => void;
  getFieldError?: (field: string) => string | undefined;
  isLoading?: boolean;
  availableUsers?: Array<{ id: number; name: string }>;
  availableCompanies?: Array<{ id: number; name: string }>;
  availableStaff?: Array<{ id: number; name: string; employeeId?: string }>;
  [key: string]: unknown; // Allow additional props from StandardFormDialog
}

const ComplaintFormFields: React.FC<ComplaintFormFieldsProps> = React.memo(
  (props) => {
    const {
      formData = {},
      onFieldChange = () => { },
      getFieldError = () => undefined,
      isLoading = false,
      availableUsers = [],
      availableCompanies = [],
      availableStaff = [],
    } = props;

    const { t } = useLanguage();

    // Status options
    const statusOptions = [
      { value: "OPEN", label: t("complaintDetails.statusOpen") },
      { value: "ON_HOLD", label: t("complaintDetails.statusOnHold") },
      { value: "CLOSED", label: t("complaintDetails.statusClosed") },
    ];

    // Urgency level options
    const urgencyOptions = [
      { value: "High", label: t("complaintDetails.urgencyLevel.High") },
      { value: "Medium", label: t("complaintDetails.urgencyLevel.Medium") },
      { value: "Low", label: t("complaintDetails.urgencyLevel.Low") },
    ];

    // User options for responder dropdown
    const userOptions = [
      { value: "", label: t("complaintDetails.placeholders.selectResponder") },
      ...availableUsers.map((user) => ({
        value: user.id.toString(),
        label: user.name,
      })),
    ];

    // Company options
    const companyOptions = [
      { value: "", label: t("complaintDetails.placeholders.selectCompany") },
      ...availableCompanies.map((company) => ({
        value: company.id.toString(),
        label: company.name,
      })),
    ];

    // Staff options for recorder dropdown
    const staffOptions = [
      { value: "", label: t("complaintDetails.placeholders.selectRecorder") },
      ...availableStaff.map((staff) => ({
        value: staff.id.toString(),
        label: staff.employeeId
          ? `${staff.name} (${staff.employeeId})`
          : staff.name,
      })),
    ];

    return (
      <div className="space-y-6">
        {/* Basic Information Section - Standardized header */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
            {t("interactions.sections.basicInformation")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("complaintDetails.columns.dateOfOccurrence")}
              required
              error={getFieldError("dateOfOccurrence")}
            >
              <FormDateInput
                type="date"
                value={formatDateForInput(formData.dateOfOccurrence as Date | string | null | undefined)}
                displayValue={formatDateForInput(formData.dateOfOccurrence as Date | string | null | undefined)}
                onChange={(e) =>
                  onFieldChange(
                    "dateOfOccurrence",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("dateOfOccurrence")}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.columns.complainerName")}
              required
              error={getFieldError("complainerName")}
            >
              <FormInput
                type="text"
                value={formData.complainerName || ""}
                onChange={(e) =>
                  onFieldChange("complainerName", e.target.value)
                }
                disabled={isLoading}
                error={!!getFieldError("complainerName")}
                placeholder={t("detailPages.staff.placeholders.enterFullName")}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.columns.contactInfo")}
              error={getFieldError("complainerContact")}
            >
              <FormInput
                type="text"
                value={formData.complainerContact || ""}
                onChange={(e) =>
                  onFieldChange("complainerContact", e.target.value)
                }
                disabled={isLoading}
                error={!!getFieldError("complainerContact")}
                placeholder={t("company.contactInformation")}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.fields.personInvolved")}
              error={getFieldError("personInvolved")}
            >
              <FormInput
                type="text"
                value={formData.personInvolved || ""}
                onChange={(e) =>
                  onFieldChange("personInvolved", e.target.value)
                }
                disabled={isLoading}
                error={!!getFieldError("personInvolved")}
                placeholder={t("interactions.placeholders.enterPersonConcerned")}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.columns.urgencyLevel")}
              required
              error={getFieldError("urgencyLevel")}
            >
              <FormSelect
                value={formData.urgencyLevel || "Medium"}
                onChange={(e) => onFieldChange("urgencyLevel", e.target.value)}
                disabled={isLoading}
                error={!!getFieldError("urgencyLevel")}
                options={urgencyOptions}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.columns.progressStatus")}
              error={getFieldError("progressStatus")}
            >
              <FormSelect
                value={formData.progressStatus || "OPEN"}
                onChange={(e) =>
                  onFieldChange("progressStatus", e.target.value)
                }
                disabled={isLoading}
                error={!!getFieldError("progressStatus")}
                options={statusOptions}
              />
            </FormField>
          </div>
        </div>

        {/* Complaint Content Section - Standardized header */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
            {t("interactions.sections.description")}
          </h4>

          <FormField
            label={t("complaintDetails.columns.complaintContent")}
            required
            error={getFieldError("complaintContent")}
          >
            <FormTextarea
              value={formData.complaintContent || ""}
              onChange={(e) =>
                onFieldChange("complaintContent", e.target.value)
              }
              disabled={isLoading}
              error={!!getFieldError("complaintContent")}
              placeholder={t("interactions.placeholders.enterDetailedDescription")}
              rows={4}
            />
          </FormField>
        </div>

        {/* Assignment Section - Standardized header */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
            {t("interactions.sections.assignment")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("complaintDetails.fields.responder")} error={getFieldError("responderId")}>
              <FormSelect
                value={formData.responderId?.toString() || ""}
                onChange={(e) =>
                  onFieldChange(
                    "responderId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("responderId")}
                options={userOptions}
              />
            </FormField>

            <FormField label={t("complaintDetails.fields.company")} error={getFieldError("companyId")}>
              <FormSelect
                value={formData.companyId?.toString() || ""}
                onChange={(e) =>
                  onFieldChange(
                    "companyId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("companyId")}
                options={companyOptions}
              />
            </FormField>

            <FormField
              label={t("complaintDetails.fields.recorder")}
              required
              error={getFieldError("recorderId")}
            >
              <FormSelect
                value={formData.recorderId?.toString() || ""}
                onChange={(e) =>
                  onFieldChange(
                    "recorderId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("recorderId")}
                options={staffOptions}
              />
            </FormField>
          </div>
        </div>

        {/* Resolution Section - Only show for existing complaints, standardized header */}
        {formData.id && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              {t("complaintDetails.sections.resolution")}
            </h4>

            <FormField
              label={t("complaintDetails.fields.resolutionDate")}
              error={getFieldError("resolutionDate")}
            >
              <FormDateInput
                type="date"
                value={formatDateForInput(formData.resolutionDate as Date | string | null | undefined)}
                displayValue={formatDateForInput(formData.resolutionDate as Date | string | null | undefined)}
                onChange={(e) =>
                  onFieldChange(
                    "resolutionDate",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("resolutionDate")}
              />
            </FormField>
          </div>
        )}
      </div>
    );
  }
);

ComplaintFormFields.displayName = "ComplaintFormFields";

export const ComplaintFormDialog: React.FC<ComplaintFormDialogProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isLoading = false,
  errors = [],
  availableUsers = [],
  availableCompanies = [],
  availableStaff = [],
}) => {
  const { t } = useLanguage();

  const title = record
    ? `${t("common.actions.edit")} ${t("complaintDetails.title")}`
    : `${t("common.actions.create")} ${t("complaintDetails.title")}`;

  // Ensure the record has the correct IDs extracted from nested objects when editing
  const processedRecord = React.useMemo(() => {
    if (!record) return null;

    return {
      ...record,
      // Ensure responderId is properly set from either responderId or responder.id
      responderId: record.responderId || record.responder?.id,
      // Ensure companyId is properly set from either companyId or company.id
      companyId: record.companyId || record.company?.id,
      // Ensure recorderId is properly set from either recorderId or recorder.id
      recorderId: record.recorderId || record.recorder?.id,
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
      validator={complaintValidator}
      enableRealTimeValidation={true}
      showSuccessMessage={true}
      successMessage={
        record
          ? t("common.messages.updateSuccess")
          : t("common.messages.createSuccess")
      }
    >
      <ComplaintFormFields
        availableUsers={availableUsers}
        availableCompanies={availableCompanies}
        availableStaff={availableStaff}
      />
    </StandardFormDialog>
  );
};
