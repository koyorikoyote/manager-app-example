import React, { useCallback } from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDateInput,
} from "../ui/StandardFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  formatDateForInput,
  formatDateForBackend,
} from "../../utils/dateUtils";
import type { Company } from "../../../shared/types";

export interface DestinationFormFieldsProps {
  formData?: Partial<Company>;
  onFieldChange?: (field: keyof Company, value: unknown) => void;
  getFieldError?: (field: string) => string | undefined;
  isLoading?: boolean;
  isEditMode?: boolean;
  availableUsers?: Array<{ id: number; name: string }>;
  availableNationalities?: string[];
  availableIndustries?: string[];
}

export const DestinationFormFields: React.FC<DestinationFormFieldsProps> = ({
  formData = {},
  onFieldChange = () => { },
  getFieldError = () => undefined,
  isLoading = false,
  isEditMode: _isEditMode = false,
  availableUsers = [],
  availableNationalities = [],
  availableIndustries = [],
}) => {
  const { t } = useLanguage();

  // Handle date field changes with proper formatting
  const handleDateChange = useCallback(
    (field: keyof Company, value: string) => {
      const formattedDate = formatDateForBackend(value);
      onFieldChange(field, formattedDate);
    },
    [onFieldChange]
  );

  // Status options
  const statusOptions = [
    { value: "active", label: t("destinations.active") },
    { value: "inactive", label: t("destinations.inactive") },
    { value: "suspended", label: t("destinations.suspended") },
  ];

  // User options for dropdowns
  const userOptions = [
    { value: "", label: t("destinations.selectAnOption") },
    ...availableUsers.map((user) => ({
      value: user.id.toString(),
      label: user.name,
    })),
  ];

  // Nationality options
  const nationalityOptions = [
    { value: "", label: t("destinations.selectAnOption") },
    ...availableNationalities.map((nationality) => ({
      value: nationality,
      label: nationality,
    })),
  ];

  // Industry options
  const industryOptions = [
    { value: "", label: t("destinations.selectAnOption") },
    ...availableIndustries.map((industry) => ({
      value: industry,
      label: industry,
    })),
  ];

  // Default industry options if none provided
  const defaultIndustryOptions = [
    { value: "", label: t("destinations.selectAnOption") },
    { value: "Manufacturing", label: t("destinations.manufacturing") },
    { value: "Construction", label: t("destinations.construction") },
    { value: "Healthcare", label: t("destinations.healthcare") },
    { value: "Education", label: t("destinations.education") },
    { value: "Retail", label: t("destinations.retail") },
    { value: "Technology", label: t("destinations.technology") },
    { value: "Finance", label: t("destinations.finance") },
    { value: "Transportation", label: t("destinations.transportation") },
    { value: "Hospitality", label: t("destinations.hospitality") },
    { value: "Agriculture", label: t("destinations.agriculture") },
    { value: "Other", label: t("destinations.other") },
  ];

  const finalIndustryOptions =
    industryOptions.length > 1 ? industryOptions : defaultIndustryOptions;

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.basicInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.companyName")}
            required
            error={getFieldError("name")}
          >
            <FormInput
              type="text"
              value={formData.name || ""}
              onChange={(e) => onFieldChange("name", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("name")}
              placeholder={t("destinations.enterCompanyName")}
            />
          </FormField>

          <FormField
            label={t("destinations.furiganaName")}
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
              placeholder={t("destinations.enterFuriganaName")}
            />
          </FormField>

          <FormField
            label={t("company.companyId")}
            error={getFieldError("companyId")}
          >
            <FormInput
              type="text"
              // Display-only: company ID is generated for new records and readonly
              value={formData.companyId || ""}
              disabled={true}
              error={!!getFieldError("companyId")}
              placeholder={t("company.companyId")}
            />
          </FormField>

          <FormField
            label={t("destinations.corporateNumber")}
            error={getFieldError("corporateNumber")}
          >
            <FormInput
              type="text"
              value={formData.corporateNumber || ""}
              onChange={(e) =>
                onFieldChange("corporateNumber", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("corporateNumber")}
              placeholder={t("destinations.enterCorporateNumber")}
              maxLength={20}
            />
          </FormField>

          <FormField
            label={t("destinations.establishmentDate")}
            error={getFieldError("establishmentDate")}
          >
            <FormDateInput
              value={formatDateForInput(formData.establishmentDate)}
              displayValue={formatDateForInput(formData.establishmentDate)}
              onChange={(e) =>
                handleDateChange("establishmentDate", e.target.value)
              }
              disabled={isLoading}
              error={!!getFieldError("establishmentDate")}
            />
          </FormField>

          <FormField
            label={t("destinations.country")}
            error={getFieldError("country")}
          >
            <FormInput
              type="text"
              value={formData.country || ""}
              onChange={(e) => onFieldChange("country", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("country")}
              placeholder={t("destinations.enterCountry")}
            />
          </FormField>

          <FormField
            label={t("destinations.region")}
            error={getFieldError("region")}
          >
            <FormInput
              type="text"
              value={formData.region || ""}
              onChange={(e) => onFieldChange("region", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("region")}
              placeholder={t("destinations.enterRegion")}
            />
          </FormField>

          <FormField
            label={t("destinations.prefecture")}
            error={getFieldError("prefecture")}
          >
            <FormInput
              type="text"
              value={formData.prefecture || ""}
              onChange={(e) =>
                onFieldChange("prefecture", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("prefecture")}
              placeholder={t("destinations.enterPrefecture")}
            />
          </FormField>

          <FormField
            label={t("destinations.city")}
            error={getFieldError("city")}
          >
            <FormInput
              type="text"
              value={formData.city || ""}
              onChange={(e) => onFieldChange("city", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("city")}
              placeholder={t("destinations.enterCity")}
            />
          </FormField>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.companyInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.industry")}
            error={getFieldError("industry")}
          >
            <FormSelect
              value={formData.industry || ""}
              onChange={(e) =>
                onFieldChange("industry", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("industry")}
              options={finalIndustryOptions}
              placeholder={t("destinations.selectIndustry")}
            />
          </FormField>

          <FormField
            label={t("destinations.status.label")}
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

          <FormField
            label={t("destinations.contactPerson")}
            error={getFieldError("contactPerson")}
          >
            <FormInput
              type="text"
              value={formData.contactPerson || ""}
              onChange={(e) =>
                onFieldChange("contactPerson", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("contactPerson")}
              placeholder={t("destinations.enterContactPerson")}
            />
          </FormField>

          <FormField
            label={t("destinations.userInCharge")}
            error={getFieldError("userInChargeId")}
          >
            <FormSelect
              value={formData.userInChargeId?.toString() || ""}
              onChange={(e) =>
                onFieldChange(
                  "userInChargeId",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("userInChargeId")}
              options={userOptions}
              placeholder={t("destinations.selectUserInCharge")}
            />
          </FormField>
        </div>

        {/* Postal Code + Address side-by-side (postal before address) */}
        <div className="col-span-full">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-32 shrink-0">
              <FormField label={t("detailPages.staff.fields.postalCode")} error={getFieldError("postalCode")}>
                <FormInput
                  type="text"
                  value={(formData as any).postalCode || ""}
                  onChange={(e) => onFieldChange("postalCode" as keyof Company, e.target.value || null)}
                  disabled={isLoading}
                  error={!!getFieldError("postalCode")}
                  placeholder={t("detailPages.staff.placeholders.postalCodeFormat")}
                />
              </FormField>
            </div>
            <div className="flex-1">
              <FormField
                label={t("destinations.address")}
                required
                error={getFieldError("address")}
              >
                <FormTextarea
                  value={formData.address || ""}
                  onChange={(e) => onFieldChange("address", e.target.value)}
                  disabled={isLoading}
                  error={!!getFieldError("address")}
                  placeholder={t("destinations.enterAddress")}
                  rows={3}
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.contactInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.email")}
            error={getFieldError("email")}
          >
            <FormInput
              type="email"
              value={formData.email || ""}
              onChange={(e) => onFieldChange("email", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("email")}
              placeholder={t("destinations.enterEmailAddress")}
            />
          </FormField>

          <FormField
            label={t("destinations.phone")}
            error={getFieldError("phone")}
          >
            <FormInput
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => onFieldChange("phone", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("phone")}
              placeholder={t("destinations.enterPhoneNumber")}
            />
          </FormField>

          <FormField
            label={t("destinations.website")}
            error={getFieldError("website")}
            className="md:col-span-2"
          >
            <FormInput
              type="url"
              value={formData.website || ""}
              onChange={(e) => onFieldChange("website", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("website")}
              placeholder={t("destinations.enterWebsiteURL")}
            />
          </FormField>
        </div>
      </div>

      {/* Job Information Section - Preferred Candidate Criteria */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.preferredCandidateCriteria")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.preferredStatusOfResidence")}
            error={getFieldError("preferredStatusOfResidence")}
          >
            <FormInput
              type="text"
              value={formData.preferredStatusOfResidence || ""}
              onChange={(e) =>
                onFieldChange(
                  "preferredStatusOfResidence",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("preferredStatusOfResidence")}
              placeholder={t("destinations.enterPreferredStatusOfResidence")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredAge")}
            error={getFieldError("preferredAge")}
          >
            <FormInput
              type="text"
              value={formData.preferredAge || ""}
              onChange={(e) =>
                onFieldChange("preferredAge", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredAge")}
              placeholder={t("destinations.enterPreferredAgeRange")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredNationality")}
            error={getFieldError("preferredNationality")}
          >
            <FormSelect
              value={formData.preferredNationality || ""}
              onChange={(e) =>
                onFieldChange("preferredNationality", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredNationality")}
              options={nationalityOptions}
              placeholder={t("destinations.selectPreferredNationality")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredExperience")}
            error={getFieldError("preferredExperience")}
          >
            <FormInput
              type="text"
              value={formData.preferredExperience || ""}
              onChange={(e) =>
                onFieldChange("preferredExperience", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredExperience")}
              placeholder={t("destinations.enterPreferredExperience")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredQualifications")}
            error={getFieldError("preferredQualifications")}
          >
            <FormInput
              type="text"
              value={formData.preferredQualifications || ""}
              onChange={(e) =>
                onFieldChange("preferredQualifications", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredQualifications")}
              placeholder={t("destinations.enterPreferredQualifications")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredPersonality")}
            error={getFieldError("preferredPersonality")}
          >
            <FormInput
              type="text"
              value={formData.preferredPersonality || ""}
              onChange={(e) =>
                onFieldChange("preferredPersonality", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredPersonality")}
              placeholder={t("destinations.enterPreferredPersonalityTraits")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredEducation")}
            error={getFieldError("preferredEducation")}
          >
            <FormInput
              type="text"
              value={formData.preferredEducation || ""}
              onChange={(e) =>
                onFieldChange("preferredEducation", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("preferredEducation")}
              placeholder={t("destinations.enterPreferredEducationLevel")}
            />
          </FormField>

          <FormField
            label={t("destinations.preferredJapaneseProficiency")}
            error={getFieldError("preferredJapaneseProficiency")}
          >
            <FormInput
              type="text"
              value={formData.preferredJapaneseProficiency || ""}
              onChange={(e) =>
                onFieldChange(
                  "preferredJapaneseProficiency",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("preferredJapaneseProficiency")}
              placeholder={t(
                "destinations.enterPreferredJapaneseProficiencyLevel"
              )}
            />
          </FormField>
        </div>
      </div>

      {/* Job Information Section - Destination Work Environment */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.destinationWorkEnvironmentSection")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.destinationWorkEnvironment")}
            error={getFieldError("destinationWorkEnvironment")}
          >
            <FormInput
              type="text"
              value={formData.destinationWorkEnvironment || ""}
              onChange={(e) =>
                onFieldChange(
                  "destinationWorkEnvironment",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("destinationWorkEnvironment")}
              placeholder={t("destinations.describeWorkEnvironment")}
            />
          </FormField>

          <FormField
            label={t("destinations.destinationAverageAge")}
            error={getFieldError("destinationAverageAge")}
          >
            <FormInput
              type="text"
              value={formData.destinationAverageAge || ""}
              onChange={(e) =>
                onFieldChange("destinationAverageAge", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("destinationAverageAge")}
              placeholder={t("destinations.enterAverageAgeOfEmployees")}
            />
          </FormField>

          <FormField
            label={t("destinations.destinationWorkPlace")}
            error={getFieldError("destinationWorkPlace")}
          >
            <FormInput
              type="text"
              value={formData.destinationWorkPlace || ""}
              onChange={(e) =>
                onFieldChange("destinationWorkPlace", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("destinationWorkPlace")}
              placeholder={t("destinations.describeWorkPlace")}
            />
          </FormField>

          <FormField
            label={t("destinations.destinationTransfer")}
            error={getFieldError("destinationTransfer")}
          >
            <FormInput
              type="text"
              value={formData.destinationTransfer || ""}
              onChange={(e) =>
                onFieldChange("destinationTransfer", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("destinationTransfer")}
              placeholder={t("destinations.describeTransferPolicy")}
            />
          </FormField>
        </div>
      </div>

      {/* Job Information Section - Selection Process & History */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.selectionProcessHistory")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.jobSelectionProcess")}
            error={getFieldError("jobSelectionProcess")}
          >
            <FormTextarea
              value={formData.jobSelectionProcess || ""}
              onChange={(e) =>
                onFieldChange("jobSelectionProcess", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobSelectionProcess")}
              placeholder={t("destinations.describeSelectionProcess")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("destinations.jobPastRecruitmentHistory")}
            error={getFieldError("jobPastRecruitmentHistory")}
          >
            <FormTextarea
              value={formData.jobPastRecruitmentHistory || ""}
              onChange={(e) =>
                onFieldChange(
                  "jobPastRecruitmentHistory",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("jobPastRecruitmentHistory")}
              placeholder={t("destinations.describePastRecruitmentHistory")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("destinations.hiringVacancies")}
            error={getFieldError("hiringVacancies")}
            className="md:col-span-2"
          >
            <FormInput
              type="number"
              min="0"
              max="999"
              value={formData.hiringVacancies || ""}
              onChange={(e) =>
                onFieldChange(
                  "hiringVacancies",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("hiringVacancies")}
              placeholder={t("destinations.enterNumberOfVacancies")}
            />
          </FormField>
        </div>
      </div>

      {/* Job Information Section - Employment Terms */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.employmentTermsCompensation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.jobSalary")}
            error={getFieldError("jobSalary")}
          >
            <FormInput
              type="text"
              value={formData.jobSalary || ""}
              onChange={(e) =>
                onFieldChange("jobSalary", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobSalary")}
              placeholder={t("destinations.enterSalaryInformation")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobOvertimeRate")}
            error={getFieldError("jobOvertimeRate")}
          >
            <FormInput
              type="text"
              value={formData.jobOvertimeRate || ""}
              onChange={(e) =>
                onFieldChange("jobOvertimeRate", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobOvertimeRate")}
              placeholder={t("destinations.enterOvertimeRate")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobSalaryIncreaseRate")}
            error={getFieldError("jobSalaryIncreaseRate")}
          >
            <FormInput
              type="text"
              value={formData.jobSalaryIncreaseRate || ""}
              onChange={(e) =>
                onFieldChange("jobSalaryIncreaseRate", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobSalaryIncreaseRate")}
              placeholder={t("destinations.enterSalaryIncreaseRate")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobSalaryBonus")}
            error={getFieldError("jobSalaryBonus")}
          >
            <FormInput
              type="text"
              value={formData.jobSalaryBonus || ""}
              onChange={(e) =>
                onFieldChange("jobSalaryBonus", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobSalaryBonus")}
              placeholder={t("destinations.enterBonusInformation")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobAllowances")}
            error={getFieldError("jobAllowances")}
          >
            <FormInput
              type="text"
              value={formData.jobAllowances || ""}
              onChange={(e) =>
                onFieldChange("jobAllowances", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobAllowances")}
              placeholder={t("destinations.enterAllowancesInformation")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobEmployeeBenefits")}
            error={getFieldError("jobEmployeeBenefits")}
          >
            <FormInput
              type="text"
              value={formData.jobEmployeeBenefits || ""}
              onChange={(e) =>
                onFieldChange("jobEmployeeBenefits", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobEmployeeBenefits")}
              placeholder={t("destinations.enterEmployeeBenefits")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobRetirementBenefits")}
            error={getFieldError("jobRetirementBenefits")}
          >
            <FormInput
              type="text"
              value={formData.jobRetirementBenefits || ""}
              onChange={(e) =>
                onFieldChange("jobRetirementBenefits", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobRetirementBenefits")}
              placeholder={t("destinations.enterRetirementBenefits")}
            />
          </FormField>

          <FormField
            label={t("destinations.jobTermsAndConditions")}
            error={getFieldError("jobTermsAndConditions")}
          >
            <FormInput
              type="text"
              value={formData.jobTermsAndConditions || ""}
              onChange={(e) =>
                onFieldChange("jobTermsAndConditions", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobTermsAndConditions")}
              placeholder={t("destinations.enterTermsAndConditions")}
            />
          </FormField>
        </div>
      </div>

      {/* Job Information Section - Contract Conditions */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.contractConditionsPolicies")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("destinations.jobDisputePreventionMeasures")}
            error={getFieldError("jobDisputePreventionMeasures")}
          >
            <FormTextarea
              value={formData.jobDisputePreventionMeasures || ""}
              onChange={(e) =>
                onFieldChange(
                  "jobDisputePreventionMeasures",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("jobDisputePreventionMeasures")}
              placeholder={t("destinations.describeDisputePreventionMeasures")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("destinations.jobProvisionalHiringConditions")}
            error={getFieldError("jobProvisionalHiringConditions")}
          >
            <FormTextarea
              value={formData.jobProvisionalHiringConditions || ""}
              onChange={(e) =>
                onFieldChange(
                  "jobProvisionalHiringConditions",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("jobProvisionalHiringConditions")}
              placeholder={t(
                "destinations.describeProvisionalHiringConditions"
              )}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("destinations.jobContractRenewalConditions")}
            error={getFieldError("jobContractRenewalConditions")}
          >
            <FormTextarea
              value={formData.jobContractRenewalConditions || ""}
              onChange={(e) =>
                onFieldChange(
                  "jobContractRenewalConditions",
                  e.target.value || null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("jobContractRenewalConditions")}
              placeholder={t("destinations.describeContractRenewalConditions")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("destinations.jobRetirementConditions")}
            error={getFieldError("jobRetirementConditions")}
          >
            <FormTextarea
              value={formData.jobRetirementConditions || ""}
              onChange={(e) =>
                onFieldChange("jobRetirementConditions", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("jobRetirementConditions")}
              placeholder={t("destinations.describeRetirementConditions")}
              rows={3}
            />
          </FormField>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("destinations.additionalInformation")}
        </h4>

        <FormField
          label={t("destinations.description")}
          error={getFieldError("description")}
        >
          <FormTextarea
            value={formData.description || ""}
            onChange={(e) =>
              onFieldChange("description", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("description")}
            placeholder={t("destinations.enterCompanyDescription")}
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
};
