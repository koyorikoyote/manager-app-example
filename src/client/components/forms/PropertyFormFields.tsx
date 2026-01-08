import React from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDateInput,
} from "../ui/StandardFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import type { Property } from "../../../shared/types";

export interface PropertyFormFieldsProps {
  formData?: Partial<Property>;
  onFieldChange?: (field: keyof Property, value: unknown) => void;
  getFieldError?: (field: string) => string | undefined;
  isLoading?: boolean;
  availableManagers?: Array<{ id: number; name: string; email: string }>;
}

export const PropertyFormFields: React.FC<PropertyFormFieldsProps> = ({
  formData = {},
  onFieldChange = () => { },
  getFieldError = () => undefined,
  isLoading = false,
  availableManagers = [],
}) => {
  const { t } = useLanguage();

  // Helper function to format date for input
  const formatDateForInput = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";
    if (typeof date === "string") {
      return date.split("T")[0];
    }
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Property type options
  const propertyTypeOptions = [
    { value: "RESIDENTIAL", label: t("properties.residential") },
    { value: "COMMERCIAL", label: t("properties.commercial") },
    { value: "INDUSTRIAL", label: t("properties.industrial") },
    { value: "MIXED_USE", label: t("properties.mixedUse") },
  ];

  // Status options
  const statusOptions = [
    { value: "ACTIVE", label: t("properties.active") },
    { value: "INACTIVE", label: t("properties.inactive") },
    { value: "UNDER_CONSTRUCTION", label: t("properties.underConstruction") },
    { value: "SOLD", label: t("properties.sold") },
  ];

  // Manager options for dropdown
  const managerOptions = [
    { value: "", label: t("properties.selectManagerOptional") },
    ...availableManagers.map((manager) => ({
      value: manager.id.toString(),
      label: `${manager.name} (${manager.email})`,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("properties.basicInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("properties.propertyCode")}
            required
            error={getFieldError("propertyCode")}
          >
            <FormInput
              type="text"
              value={formData.propertyCode || ""}
              onChange={(e) => onFieldChange("propertyCode", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("propertyCode")}
              placeholder={t("properties.enterUniquePropertyCode")}
            />
          </FormField>

          <FormField
            label={t("properties.propertyName")}
            required
            error={getFieldError("name")}
          >
            <FormInput
              type="text"
              value={formData.name || ""}
              onChange={(e) => onFieldChange("name", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("name")}
              placeholder={t("properties.enterPropertyName")}
            />
          </FormField>

          <FormField
            label={t("properties.furiganaName")}
            error={getFieldError("furiganaName")}
          >
            <FormInput
              type="text"
              value={formData.furiganaName || ""}
              onChange={(e) =>
                onFieldChange("furiganaName", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("furiganaName")}
              placeholder={t("properties.enterFuriganaName")}
            />
          </FormField>

          <FormField
            label={t("residences.type")}
            required
            error={getFieldError("propertyType")}
          >
            <FormSelect
              value={formData.propertyType || "RESIDENTIAL"}
              onChange={(e) => onFieldChange("propertyType", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("propertyType")}
              options={propertyTypeOptions}
            />
          </FormField>

          <FormField
            label={t("properties.establishmentDate")}
            error={getFieldError("establishmentDate")}
          >
            <FormDateInput
              value={formatDateForInput(formData.establishmentDate)}
              displayValue={formatDateForInput(formData.establishmentDate)}
              onChange={(e) =>
                onFieldChange("establishmentDate", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("establishmentDate")}
            />
          </FormField>

          <FormField
            label={t("properties.propertyStatus")}
            error={getFieldError("status")}
          >
            <FormSelect
              value={formData.status || "ACTIVE"}
              onChange={(e) => onFieldChange("status", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("status")}
              options={statusOptions}
            />
          </FormField>
        </div>

        {/* Postal Code + Address side-by-side (postal before address) */}
        <div className="col-span-full">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-32 shrink-0">
              <FormField label={t("detailPages.property.fields.postalCode")} error={getFieldError("postalCode" as any)}>
                <FormInput
                  type="text"
                  value={(formData as any).postalCode || ""}
                  onChange={(e) => onFieldChange("postalCode" as keyof Property, e.target.value || null)}
                  disabled={isLoading}
                  error={!!getFieldError("postalCode" as any)}
                  placeholder={t("detailPages.staff.placeholders.postalCodeFormat")}
                />
              </FormField>
            </div>
            <div className="flex-1">
              <FormField
                label={t("company.address")}
                required
                error={getFieldError("address")}
              >
                <FormTextarea
                  value={formData.address || ""}
                  onChange={(e) => onFieldChange("address", e.target.value)}
                  disabled={isLoading}
                  error={!!getFieldError("address")}
                  placeholder={t("properties.enterCompletePropertyAddress")}
                  rows={3}
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* Management Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("properties.managementInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("properties.propertyManager")}
            error={getFieldError("managerId")}
          >
            <FormSelect
              value={formData.managerId?.toString() || ""}
              onChange={(e) =>
                onFieldChange(
                  "managerId",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("managerId")}
              options={managerOptions}
              placeholder={t("properties.selectPropertyManager")}
            />
          </FormField>

          <FormField
            label={t("residences.contractDate")}
            error={getFieldError("contractDate")}
          >
            <FormDateInput
              value={formatDateForInput(formData.contractDate)}
              displayValue={formatDateForInput(formData.contractDate)}
              onChange={(e) =>
                onFieldChange("contractDate", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("contractDate")}
            />
          </FormField>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("properties.additionalInformation")}
        </h4>

        <FormField
          label={t("properties.description")}
          error={getFieldError("description")}
        >
          <FormTextarea
            value={formData.description || ""}
            onChange={(e) =>
              onFieldChange("description", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("description")}
            placeholder={t("properties.enterPropertyDescription")}
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
};
