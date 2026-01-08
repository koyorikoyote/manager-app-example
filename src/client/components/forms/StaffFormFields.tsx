import React, { useCallback, useState } from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDateInput,
} from "../ui/StandardFormDialog";
import { DateOfBirthInput } from "../ui/DateOfBirthInput";
import { Button } from "../ui/Button";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  formatDateForInput,
  formatDateForBackend,
} from "../../utils/dateUtils";
// Validation is handled by the parent component's validation system
import type { Staff } from "../../../shared/types";

export interface StaffFormFieldsProps {
  formData?: Partial<Staff>;
  onFieldChange?: (field: keyof Staff, value: unknown) => void;
  getFieldError?: (field: string) => string | undefined;
  isLoading?: boolean;
  availableUsers?: Array<{ id: number; name: string }>;
  availableNationalities?: string[]; // Now contains country names
  availableCompanies?: Array<{ id: number; name: string }>;
  isEditMode?: boolean;
}

export const StaffFormFields: React.FC<StaffFormFieldsProps> = ({
  formData = {},
  onFieldChange = () => { },
  getFieldError = () => undefined,
  isLoading = false,
  availableUsers = [],
  availableNationalities = [],
  availableCompanies = [],
  isEditMode = false,
}) => {
  const { t } = useLanguage();
  // Keep isEditMode for API compatibility (read to avoid TS unused var warning)
  void isEditMode;

  // Toggle for enabling free text input for nationality
  const [isNationalityFreeText, setIsNationalityFreeText] = useState<boolean>(() => {
    const n = (formData.nationality as string | null | undefined) ?? "";
    return n !== "" && !availableNationalities.includes(n);
  });

  // EmployeeId is display-only here. Generation for new records is handled by the
  // parent page (StaffNewPage) to avoid extra network requests or render loops.


  // Handle date field changes with proper formatting
  const handleDateChange = useCallback(
    (field: keyof Staff, value: string) => {
      const formattedDate = formatDateForBackend(value);
      onFieldChange(field, formattedDate);
    },
    [onFieldChange]
  );

  // Handle date of birth change and age calculation
  const handleDateOfBirthChange = useCallback(
    (date: Date | null) => {
      onFieldChange("dateOfBirth", date);
    },
    [onFieldChange]
  );

  // Handle age calculation from date of birth
  const handleAgeCalculated = useCallback(
    (calculatedAge: number | null) => {
      onFieldChange("age", calculatedAge);
    },
    [onFieldChange]
  );

  // Real-time validation handlers
  const handleEmailValidation = useCallback(
    (field: keyof Staff, value: string) => {
      onFieldChange(field, value || null);
      // Validation is handled by the parent component's validation system
    },
    [onFieldChange]
  );

  const handlePhoneValidation = useCallback(
    (field: keyof Staff, value: string) => {
      onFieldChange(field, value || null);
      // Validation is handled by the parent component's validation system
    },
    [onFieldChange]
  );

  const handlePostalCodeValidation = useCallback(
    (value: string) => {
      onFieldChange("postalCode", value || null);
      // Validation is handled by the parent component's validation system
    },
    [onFieldChange]
  );



  const handleFuriganaValidation = useCallback(
    (value: string) => {
      onFieldChange("furiganaName", value || null);
      // Validation is handled by the parent component's validation system
    },
    [onFieldChange]
  );

  // Status options
  const statusOptions = [
    { value: "ACTIVE", label: t("staff.status.ACTIVE" as any) },
    { value: "INACTIVE", label: t("staff.status.INACTIVE" as any) },
    { value: "ON_LEAVE", label: t("staff.status.ON_LEAVE" as any) },
    { value: "TERMINATED", label: t("staff.status.TERMINATED" as any) },
  ];

  // User options for dropdowns
  const userOptions = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    ...availableUsers.map((user) => ({
      value: user.id.toString(),
      label: user.name,
    })),
  ];

  // Country options (stored in nationality field for backward compatibility)
  const nationalityOptions = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    ...availableNationalities.map((country) => {
      // Try to get translated country name, fallback to original name
      const translationKey = `staff.countries.${country}` as any;
      const translatedName = t(translationKey);
      return {
        value: country,
        label: translatedName !== translationKey ? translatedName : country,
      };
    }),
  ];

  const manualToggleLabelKey = "detailPages.staff.fields.useFreeText" as any;
  const manualToggleLabel = (() => {
    const v = t(manualToggleLabelKey);
    return v !== manualToggleLabelKey ? v : t("detailPages.staff.placeholders.enterManually");
  })();

  const enterNationalityKey = "detailPages.staff.placeholders.enterNationality" as any;
  const enterNationalityPlaceholder = (() => {
    const v = t(enterNationalityKey);
    return v !== enterNationalityKey ? v : t("detailPages.staff.placeholders.enterNationality");
  })();


  // Common residence status options
  // Company options (Destination Assigned)
  const companyOptions = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    ...availableCompanies.map((c) => ({ value: c.id.toString(), label: c.name })),
  ];

  const residenceStatusOptions = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    {
      value: "ENGINEER",
      label: t("detailPages.staff.options.ENGINEER"),
    },
    {
      value: "DESIGNATED_ACTIVITIES",
      label: t("detailPages.staff.options.DESIGNATED_ACTIVITIES"),
    },
    {
      value: "PERMANENT_RESIDENT",
      label: t("detailPages.staff.options.PERMANENT_RESIDENT"),
    },
    {
      value: "LONG_TERM_RESIDENT",
      label: t("detailPages.staff.options.LONG_TERM_RESIDENT"),
    },
    {
      value: "SPOUSE_OF_JAPANESE_NATIONAL",
      label: t("detailPages.staff.options.SPOUSE_OF_JAPANESE_NATIONAL"),
    },
    {
      value: "SPOUSE_OF_PERMANENT_RESIDENT",
      label: t("detailPages.staff.options.SPOUSE_OF_PERMANENT_RESIDENT"),
    },
    {
      value: "HIGHLY_SKILLED_PROFESSIONAL",
      label: t("detailPages.staff.options.HIGHLY_SKILLED_PROFESSIONAL"),
    },
    {
      value: "NURSING_CARE",
      label: t("detailPages.staff.options.NURSING_CARE"),
    },
    {
      value: "MEDICAL_CARE",
      label: t("detailPages.staff.options.MEDICAL_CARE"),
    },
    {
      value: "BUSINESS_MANAGEMENT",
      label: t("detailPages.staff.options.BUSINESS_MANAGEMENT"),
    },
    {
      value: "LEGAL_ACCOUNTING_SERVICES",
      label: t("detailPages.staff.options.LEGAL_ACCOUNTING_SERVICES"),
    },
    {
      value: "ARTIST",
      label: t("detailPages.staff.options.ARTIST"),
    },
    {
      value: "PROFESSOR",
      label: t("detailPages.staff.options.PROFESSOR"),
    },
    {
      value: "TEACHER",
      label: t("detailPages.staff.options.TEACHER"),
    },
    {
      value: "STUDENT",
      label: t("detailPages.staff.options.STUDENT"),
    },
    {
      value: "OTHER",
      label: t("detailPages.staff.options.OTHER"),
    },
  ];

  // Education/Work dynamic sections options and helpers
  const educationTypeOptionsForm = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    { value: "UNIVERSITY_POSTGRADUATE", label: t("detailPages.staff.options.UNIVERSITY_POSTGRADUATE") },
    { value: "UNIVERSITY_UNDERGRADUATE", label: t("detailPages.staff.options.UNIVERSITY_UNDERGRADUATE") },
    { value: "VOCATIONAL", label: t("detailPages.staff.options.VOCATIONAL") },
    { value: "HIGH_SCHOOL", label: t("detailPages.staff.options.HIGH_SCHOOL") },
    { value: "LANGUAGE_SCHOOL", label: t("detailPages.staff.options.LANGUAGE_SCHOOL") },
  ];

  const employmentTypeOptions = [
    { value: "", label: t("detailPages.staff.placeholders.selectAnOption") },
    { value: "FULL_TIME", label: t("detailPages.staff.options.FULL_TIME") },
    { value: "DISPATCH", label: t("detailPages.staff.options.DISPATCH") },
    { value: "PART_TIME", label: t("detailPages.staff.options.PART_TIME") },
    { value: "CONTRACT", label: t("detailPages.staff.options.CONTRACT") },
    { value: "OTHERS", label: t("detailPages.staff.options.OTHERS") },
  ];

  const getArray = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? [...arr] : []);

  const setArrayValue = (field: keyof Staff, index: number, value: unknown) => {
    const list = getArray<any>(formData[field] as any);
    while (list.length <= index) list.push(null);
    list[index] = value;
    onFieldChange(field, list);
  };

  const addEducationEntry = () => {
    const len = Math.max(
      getArray(formData.educationName).length,
      getArray(formData.educationType).length
    );
    setArrayValue("educationName", len, "");
    setArrayValue("educationType", len, "");
  };

  const removeEducationEntry = (index: number) => {
    const names = getArray(formData.educationName);
    const types = getArray(formData.educationType as any);
    if (index >= 0) {
      if (index < names.length) names.splice(index, 1);
      if (index < types.length) types.splice(index, 1);
    }
    onFieldChange("educationName", names);
    onFieldChange("educationType", types);
  };

  const addWorkHistoryEntry = () => {
    const len = Math.max(
      getArray(formData.workHistoryName).length,
      getArray(formData.workHistoryDateStart).length,
      getArray(formData.workHistoryDateEnd).length,
      getArray(formData.workHistoryCountryLocation).length,
      getArray(formData.workHistoryCityLocation).length,
      getArray(formData.workHistoryPosition).length,
      getArray(formData.workHistoryEmploymentType).length,
      getArray(formData.workHistoryDescription).length
    );
    setArrayValue("workHistoryName", len, "");
    setArrayValue("workHistoryDateStart", len, "");
    setArrayValue("workHistoryDateEnd", len, "");
    setArrayValue("workHistoryCountryLocation", len, "");
    setArrayValue("workHistoryCityLocation", len, "");
    setArrayValue("workHistoryPosition", len, "");
    setArrayValue("workHistoryEmploymentType", len, "");
    setArrayValue("workHistoryDescription", len, "");
  };

  const removeWorkHistoryEntry = (index: number) => {
    const names = getArray(formData.workHistoryName);
    const starts = getArray(formData.workHistoryDateStart);
    const ends = getArray(formData.workHistoryDateEnd);
    const countries = getArray(formData.workHistoryCountryLocation);
    const cities = getArray(formData.workHistoryCityLocation);
    const positions = getArray(formData.workHistoryPosition);
    const types = getArray(formData.workHistoryEmploymentType as any);
    const descriptions = getArray(formData.workHistoryDescription);

    const arrays = [names, starts, ends, countries, cities, positions, types as any[], descriptions];
    arrays.forEach(arr => {
      if (index >= 0 && index < arr.length) arr.splice(index, 1);
    });

    onFieldChange("workHistoryName", names);
    onFieldChange("workHistoryDateStart", starts);
    onFieldChange("workHistoryDateEnd", ends);
    onFieldChange("workHistoryCountryLocation", countries);
    onFieldChange("workHistoryCityLocation", cities);
    onFieldChange("workHistoryPosition", positions);
    onFieldChange("workHistoryEmploymentType", types);
    onFieldChange("workHistoryDescription", descriptions);
  };

  const educationCount = Math.max(
    getArray(formData.educationName).length,
    getArray(formData.educationType).length
  );

  const workCount = Math.max(
    getArray(formData.workHistoryName).length,
    getArray(formData.workHistoryDateStart).length,
    getArray(formData.workHistoryDateEnd).length,
    getArray(formData.workHistoryCountryLocation).length,
    getArray(formData.workHistoryCityLocation).length,
    getArray(formData.workHistoryPosition).length,
    getArray(formData.workHistoryEmploymentType).length,
    getArray(formData.workHistoryDescription).length
  );


  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.basicInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("detailPages.staff.fields.name")}
            required
            error={getFieldError("name")}
          >
            <FormInput
              type="text"
              value={formData.name || ""}
              onChange={(e) => onFieldChange("name", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("name")}
              placeholder={t("detailPages.staff.placeholders.enterFullName")}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.furiganaName")}
            error={getFieldError("furiganaName")}
          >
            <FormInput
              type="text"
              value={formData.furiganaName || ""}
              onChange={(e) => handleFuriganaValidation(e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("furiganaName")}
              placeholder={t(
                "detailPages.staff.placeholders.enterFuriganaReading"
              )}
              lang="ja"
            />
          </FormField>

          <FormField
            label={t("staff.employeeId")}
            error={getFieldError("employeeId")}
          >
            <FormInput
              type="text"
              // Display-only: when editing show the real employeeId from formData;
              // when creating a new staff show the generated nextEmployeeId.
              value={formData.employeeId || ""}
              // Keep the field disabled and uneditable so it won't be changed by user
              disabled={true}
              error={!!getFieldError("employeeId")}
              placeholder={t("detailPages.staff.placeholders.enterEmployeeId")}
            />
          </FormField>

          <FormField
            label={t("staff.position")}
            error={getFieldError("position")}
          >
            <FormInput
              type="text"
              value={formData.position || ""}
              onChange={(e) =>
                onFieldChange("position", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("position")}
              placeholder={t(
                "detailPages.staff.placeholders.enterPositionRole"
              )}
            />
          </FormField>

          <FormField
            label={t("staff.department")}
            error={getFieldError("department")}
          >
            <FormInput
              type="text"
              value={formData.department || ""}
              onChange={(e) =>
                onFieldChange("department", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("department")}
              placeholder={t("detailPages.staff.placeholders.enterDepartment")}
            />
          </FormField>

          <FormField
            label={t("detailPages.leftColumn.staff.status")}
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
            label={t("detailPages.leftColumn.staff.gender")}
            error={getFieldError("gender")}
          >
            <FormSelect
              value={formData.gender || ""}
              onChange={(e) => onFieldChange("gender", e.target.value || null)}
              disabled={isLoading}
              error={!!getFieldError("gender")}
              options={[
                {
                  value: "",
                  label: t("detailPages.staff.placeholders.selectAnOption"),
                },
                { value: "M", label: t("staff.gender.M") },
                { value: "F", label: t("staff.gender.F") },
              ]}
            />
          </FormField>

          <FormField
            label={t("staff.nationality")}
            error={getFieldError("nationality")}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {isNationalityFreeText ? (
                  <FormInput
                    type="text"
                    value={formData.nationality || ""}
                    onChange={(e) => onFieldChange("nationality", e.target.value || null)}
                    disabled={isLoading}
                    error={!!getFieldError("nationality")}
                    placeholder={enterNationalityPlaceholder}
                  />
                ) : (
                  <FormSelect
                    value={formData.nationality || ""}
                    onChange={(e) =>
                      onFieldChange("nationality", e.target.value || null)
                    }
                    disabled={isLoading}
                    error={!!getFieldError("nationality")}
                    options={nationalityOptions}
                    placeholder={t(
                      "detailPages.staff.placeholders.selectNationality"
                    )}
                  />
                )}
              </div>
              <label className="text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={isNationalityFreeText}
                  onChange={(e) => setIsNationalityFreeText(e.target.checked)}
                  disabled={isLoading}
                />
                <span>{manualToggleLabel}</span>
              </label>
            </div>
          </FormField>

          <FormField
            label={t("staff.hireDate")}
            error={getFieldError("hireDate")}
          >
            <FormDateInput
              value={formatDateForInput(formData.hireDate)}
              displayValue={formatDateForInput(formData.hireDate)}
              onChange={(e) => handleDateChange("hireDate", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("hireDate")}
            />
          </FormField>

          {/* Destination Assigned (select company) */}
          <FormField
            label={t("detailPages.staff.fields.destinationAssigned" as any)}
            error={getFieldError("companiesId")}
          >
            <FormSelect
              value={formData.companiesId?.toString() || ""}
              onChange={(e) =>
                onFieldChange(
                  "companiesId",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("companiesId")}
              options={companyOptions}
            />
          </FormField>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.contactInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={t("staff.email")} error={getFieldError("email")}>
            <FormInput
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleEmailValidation("email", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("email")}
              placeholder={t(
                "detailPages.staff.placeholders.enterEmailAddress"
              )}
            />
          </FormField>

          <FormField label={t("staff.phone")} error={getFieldError("phone")}>
            <FormInput
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => handlePhoneValidation("phone", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("phone")}
              placeholder={t("detailPages.staff.placeholders.enterPhoneNumber")}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.mobile")}
            error={getFieldError("mobile")}
          >
            <FormInput
              type="tel"
              value={formData.mobile || ""}
              onChange={(e) => handlePhoneValidation("mobile", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("mobile")}
              placeholder={t(
                "detailPages.staff.placeholders.enterMobilePhoneNumber"
              )}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.fax")}
            error={getFieldError("fax")}
          >
            <FormInput
              type="tel"
              value={formData.fax || ""}
              onChange={(e) => handlePhoneValidation("fax", e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("fax")}
              placeholder={t("detailPages.staff.placeholders.enterFaxNumber")}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.postalCode")}
            error={getFieldError("postalCode")}
          >
            <FormInput
              type="text"
              value={formData.postalCode || ""}
              onChange={(e) => handlePostalCodeValidation(e.target.value)}
              disabled={isLoading}
              error={!!getFieldError("postalCode")}
              placeholder={t("detailPages.staff.placeholders.postalCodeFormat")}
            />
          </FormField>
        </div>

        <FormField label={t("staff.address")} error={getFieldError("address")}>
          <FormTextarea
            value={formData.address || ""}
            onChange={(e) => onFieldChange("address", e.target.value || null)}
            disabled={isLoading}
            error={!!getFieldError("address")}
            placeholder={t("detailPages.staff.placeholders.enterFullAddress")}
            rows={3}
          />
        </FormField>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.personalInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("detailPages.staff.fields.dateOfBirth")}
            error={getFieldError("dateOfBirth")}
          >
            <DateOfBirthInput
              value={formData.dateOfBirth || null}
              onChange={handleDateOfBirthChange}
              onAgeCalculated={handleAgeCalculated}
              disabled={isLoading}
              error={getFieldError("dateOfBirth")}
            />
          </FormField>

          <FormField label={t("staff.age")} error={getFieldError("age")}>
            <FormInput
              type="number"
              value={formData.age?.toString() || ""}
              onChange={(e) => {
                if (!formData.dateOfBirth) {
                  const numValue = e.target.value.trim() === "" ? null : parseInt(e.target.value);
                  onFieldChange("age", numValue);
                }
              }}
              disabled={isLoading || !!formData.dateOfBirth}
              error={!!getFieldError("age")}
              placeholder={formData.dateOfBirth ? "Auto-calculated from date of birth" : "Enter age manually"}
              className={formData.dateOfBirth ? "bg-gray-50" : ""}
              min="0"
              max="150"
            />
            { }
          </FormField>

          <FormField
            label={t("staff.residenceStatus")}
            error={getFieldError("residenceStatus")}
          >
            <FormSelect
              value={formData.residenceStatus || ""}
              onChange={(e) =>
                onFieldChange("residenceStatus", e.target.value || null)
              }
              disabled={isLoading}
              error={!!getFieldError("residenceStatus")}
              options={residenceStatusOptions}
              placeholder={t(
                "detailPages.staff.placeholders.selectResidenceStatus"
              )}
            />
          </FormField>


          <FormField
            label={t("detailPages.staff.fields.periodOfStayStartDate")}
            error={getFieldError("periodOfStayDateStart")}
          >
            <FormDateInput
              value={formatDateForInput(formData.periodOfStayDateStart)}
              displayValue={formatDateForInput(formData.periodOfStayDateStart)}
              onChange={(e) =>
                handleDateChange("periodOfStayDateStart", e.target.value)
              }
              disabled={isLoading}
              error={!!getFieldError("periodOfStayDateStart")}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.periodOfStayEndDate")}
            error={getFieldError("periodOfStayDateEnd")}
          >
            <FormDateInput
              value={formatDateForInput(formData.periodOfStayDateEnd)}
              displayValue={formatDateForInput(formData.periodOfStayDateEnd)}
              onChange={(e) =>
                handleDateChange("periodOfStayDateEnd", e.target.value)
              }
              disabled={isLoading}
              error={!!getFieldError("periodOfStayDateEnd")}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.familyHasSpouse")}
            error={getFieldError("familySpouse")}
          >
            <FormSelect
              value={
                formData.familySpouse === null
                  ? ""
                  : formData.familySpouse
                    ? "true"
                    : "false"
              }
              onChange={(e) => {
                const value = e.target.value;
                onFieldChange(
                  "familySpouse",
                  value === "" ? null : value === "true"
                );
              }}
              disabled={isLoading}
              error={!!getFieldError("familySpouse")}
              options={[
                {
                  value: "",
                  label: t("detailPages.staff.placeholders.selectAnOption"),
                },
                {
                  value: "true",
                  label: t("detailPages.staff.placeholders.yes"),
                },
                {
                  value: "false",
                  label: t("detailPages.staff.placeholders.no"),
                },
              ]}
            />
          </FormField>

          <FormField
            label={t("detailPages.staff.fields.numberOfChildren")}
            error={getFieldError("familyChildren")}
          >
            <FormInput
              type="number"
              min="0"
              max="20"
              value={formData.familyChildren?.toString() || ""}
              onChange={(e) => {
                const value = e.target.value.trim();
                onFieldChange(
                  "familyChildren",
                  value === "" ? null : parseInt(value)
                );
              }}
              disabled={isLoading}
              error={!!getFieldError("familyChildren")}
              placeholder={t(
                "detailPages.staff.placeholders.enterNumberOfChildren"
              )}
            />
          </FormField>
        </div>

        <FormField
          label={t("detailPages.staff.fields.qualificationsAndLicenses")}
          error={getFieldError("qualificationsAndLicenses")}
        >
          <FormTextarea
            value={formData.qualificationsAndLicenses || ""}
            onChange={(e) =>
              onFieldChange("qualificationsAndLicenses", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("qualificationsAndLicenses")}
            placeholder={t(
              "detailPages.staff.placeholders.enterQualificationsAndLicenses"
            )}
            rows={3}
          />
        </FormField>

        <FormField
          label={t("detailPages.staff.fields.japaneseProficiency")}
          error={getFieldError("japaneseProficiency")}
        >
          <FormTextarea
            value={formData.japaneseProficiency || ""}
            onChange={(e) =>
              onFieldChange("japaneseProficiency", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("japaneseProficiency")}
            placeholder={t(
              "detailPages.staff.placeholders.enterJapaneseProficiencyLevel"
            )}
            rows={3}
          />
        </FormField>

        <FormField
          label={t("detailPages.staff.fields.japaneseProficiencyRemarks")}
          error={getFieldError("japaneseProficiencyRemarks")}
        >
          <FormTextarea
            value={formData.japaneseProficiencyRemarks || ""}
            onChange={(e) =>
              onFieldChange(
                "japaneseProficiencyRemarks",
                e.target.value || null
              )
            }
            disabled={isLoading}
            error={!!getFieldError("japaneseProficiencyRemarks")}
            placeholder={t(
              "detailPages.staff.placeholders.additionalRemarksJapaneseProficiency"
            )}
            rows={2}
          />
        </FormField>

        <FormField
          label={t("detailPages.staff.fields.reasonForApplying")}
          error={getFieldError("reasonForApplying")}
        >
          <FormTextarea
            value={formData.reasonForApplying || ""}
            onChange={(e) =>
              onFieldChange("reasonForApplying", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("reasonForApplying")}
            placeholder={t(
              "detailPages.staff.placeholders.enterReasonForApplying"
            )}
            rows={3}
          />
        </FormField>

        <FormField
          label={t("detailPages.staff.fields.motivationToComeJapan")}
          error={getFieldError("motivationToComeJapan")}
        >
          <FormTextarea
            value={formData.motivationToComeJapan || ""}
            onChange={(e) =>
              onFieldChange("motivationToComeJapan", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("motivationToComeJapan")}
            placeholder={t(
              "detailPages.staff.placeholders.enterMotivationForJapan"
            )}
            rows={3}
          />
        </FormField>

        <FormField
          label={t("detailPages.staff.fields.hobbiesAndInterests")}
          error={getFieldError("hobbyAndInterests")}
        >
          <FormTextarea
            value={formData.hobbyAndInterests || ""}
            onChange={(e) =>
              onFieldChange("hobbyAndInterests", e.target.value || null)
            }
            disabled={isLoading}
            error={!!getFieldError("hobbyAndInterests")}
            placeholder={t(
              "detailPages.staff.placeholders.enterHobbiesAndInterests"
            )}
            rows={3}
          />
        </FormField>
      </div>

      {/* Emergency Contacts Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.emergencyContacts")}
        </h4>

        <div className="space-y-4">
          <h5 className="text-md font-medium text-gray-700">
            {t("detailPages.staff.fields.primaryEmergencyContact")}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("detailPages.staff.fields.name")}
              error={getFieldError("emergencyContactPrimaryName")}
            >
              <FormInput
                type="text"
                value={formData.emergencyContactPrimaryName || ""}
                onChange={(e) =>
                  onFieldChange(
                    "emergencyContactPrimaryName",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactPrimaryName")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterPrimaryContactName"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.relationship")}
              error={getFieldError("emergencyContactPrimaryRelationship")}
            >
              <FormInput
                type="text"
                value={formData.emergencyContactPrimaryRelationship || ""}
                onChange={(e) =>
                  onFieldChange(
                    "emergencyContactPrimaryRelationship",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactPrimaryRelationship")}
                placeholder={t(
                  "detailPages.staff.placeholders.spouseParentSibling"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.phoneNumber")}
              error={getFieldError("emergencyContactPrimaryNumber")}
            >
              <FormInput
                type="tel"
                value={formData.emergencyContactPrimaryNumber || ""}
                onChange={(e) =>
                  handlePhoneValidation(
                    "emergencyContactPrimaryNumber",
                    e.target.value
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactPrimaryNumber")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterPhoneNumber"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.emailAddress")}
              error={getFieldError("emergencyContactPrimaryEmail")}
            >
              <FormInput
                type="email"
                value={formData.emergencyContactPrimaryEmail || ""}
                onChange={(e) =>
                  handleEmailValidation(
                    "emergencyContactPrimaryEmail",
                    e.target.value
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactPrimaryEmail")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterEmailAddress"
                )}
              />
            </FormField>
          </div>

          <h5 className="text-md font-medium text-gray-700 pt-4">
            {t("detailPages.staff.fields.secondaryEmergencyContact")}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("detailPages.staff.fields.name")}
              error={getFieldError("emergencyContactSecondaryName")}
            >
              <FormInput
                type="text"
                value={formData.emergencyContactSecondaryName || ""}
                onChange={(e) =>
                  onFieldChange(
                    "emergencyContactSecondaryName",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactSecondaryName")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterSecondaryContactName"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.relationship")}
              error={getFieldError("emergencyContactSecondaryRelationship")}
            >
              <FormInput
                type="text"
                value={formData.emergencyContactSecondaryRelationship || ""}
                onChange={(e) =>
                  onFieldChange(
                    "emergencyContactSecondaryRelationship",
                    e.target.value || null
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactSecondaryRelationship")}
                placeholder={t(
                  "detailPages.staff.placeholders.friendColleague"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.phoneNumber")}
              error={getFieldError("emergencyContactSecondaryNumber")}
            >
              <FormInput
                type="tel"
                value={formData.emergencyContactSecondaryNumber || ""}
                onChange={(e) =>
                  handlePhoneValidation(
                    "emergencyContactSecondaryNumber",
                    e.target.value
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactSecondaryNumber")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterPhoneNumber"
                )}
              />
            </FormField>

            <FormField
              label={t("detailPages.staff.fields.emailAddress")}
              error={getFieldError("emergencyContactSecondaryEmail")}
            >
              <FormInput
                type="email"
                value={formData.emergencyContactSecondaryEmail || ""}
                onChange={(e) =>
                  handleEmailValidation(
                    "emergencyContactSecondaryEmail",
                    e.target.value
                  )
                }
                disabled={isLoading}
                error={!!getFieldError("emergencyContactSecondaryEmail")}
                placeholder={t(
                  "detailPages.staff.placeholders.enterEmailAddress"
                )}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Employment Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.employmentInformation")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("detailPages.staff.fields.salary")}
            error={getFieldError("salary")}
          >
            <FormInput
              type="number"
              min="0"
              step="0.01"
              value={formData.salary || ""}
              onChange={(e) =>
                onFieldChange(
                  "salary",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              disabled={isLoading}
              error={!!getFieldError("salary")}
              placeholder={t(
                "detailPages.staff.placeholders.enterSalaryAmount"
              )}
            />
          </FormField>

          <FormField
            label={t("staff.userInCharge")}
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
              placeholder={t(
                "detailPages.staff.placeholders.selectUserInCharge"
              )}
            />
          </FormField>
        </div>
      </div>

      {/* Education History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-lg font-medium text-gray-900">
            {t("detailPages.staff.sections.educationHistory")}
          </h4>
          <Button type="button" onClick={addEducationEntry}>
            + {t("common.actions.add")}
          </Button>
        </div>

        {educationCount === 0 ? (
          <p className="text-sm text-gray-500">{t("detailPages.common.notSpecified")}</p>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: educationCount }).map((_, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex justify-end mb-2">
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeEducationEntry(idx)}>
                    {t("common.actions.delete")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={t("detailPages.staff.fields.institutionName")}>
                    <FormInput
                      type="text"
                      value={formData.educationName?.[idx] || ""}
                      onChange={(e) => setArrayValue("educationName", idx, e.target.value || null)}
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.educationType")}>
                    <FormSelect
                      value={(formData.educationType?.[idx] as any) || ""}
                      onChange={(e) => setArrayValue("educationType", idx, e.target.value || null)}
                      options={educationTypeOptionsForm}
                      placeholder={t("detailPages.staff.placeholders.selectAnOption")}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-lg font-medium text-gray-900">
            {t("detailPages.staff.sections.workHistory")}
          </h4>
          <Button type="button" onClick={addWorkHistoryEntry}>
            + {t("common.actions.add")}
          </Button>
        </div>

        {workCount === 0 ? (
          <p className="text-sm text-gray-500">{t("detailPages.common.notSpecified")}</p>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: workCount }).map((_, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex justify-end mb-2">
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeWorkHistoryEntry(idx)}>
                    {t("common.actions.delete")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label={t("detailPages.staff.fields.companyName")}>
                    <FormInput
                      type="text"
                      value={formData.workHistoryName?.[idx] || ""}
                      onChange={(e) => setArrayValue("workHistoryName", idx, e.target.value || null)}
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.position")}>
                    <FormInput
                      type="text"
                      value={formData.workHistoryPosition?.[idx] || ""}
                      onChange={(e) => setArrayValue("workHistoryPosition", idx, e.target.value || null)}
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.employmentType")}>
                    <FormSelect
                      value={(formData.workHistoryEmploymentType?.[idx] as any) || ""}
                      onChange={(e) =>
                        setArrayValue("workHistoryEmploymentType", idx, e.target.value || null)
                      }
                      options={employmentTypeOptions}
                      placeholder={t("detailPages.staff.placeholders.selectAnOption")}
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.startDate")}>
                    <FormDateInput
                      value={formatDateForInput(formData.workHistoryDateStart?.[idx])}
                      displayValue={formatDateForInput(formData.workHistoryDateStart?.[idx])}
                      onChange={(e) =>
                        setArrayValue("workHistoryDateStart", idx, formatDateForBackend(e.target.value))
                      }
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.endDate")}>
                    <FormDateInput
                      value={formatDateForInput(formData.workHistoryDateEnd?.[idx])}
                      displayValue={formatDateForInput(formData.workHistoryDateEnd?.[idx])}
                      onChange={(e) =>
                        setArrayValue("workHistoryDateEnd", idx, formatDateForBackend(e.target.value))
                      }
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.country")}>
                    <FormInput
                      type="text"
                      value={formData.workHistoryCountryLocation?.[idx] || ""}
                      onChange={(e) =>
                        setArrayValue("workHistoryCountryLocation", idx, e.target.value || null)
                      }
                    />
                  </FormField>
                  <FormField label={t("detailPages.staff.fields.city")}>
                    <FormInput
                      type="text"
                      value={formData.workHistoryCityLocation?.[idx] || ""}
                      onChange={(e) =>
                        setArrayValue("workHistoryCityLocation", idx, e.target.value || null)
                      }
                    />
                  </FormField>
                  <FormField
                    label={t("detailPages.staff.fields.description")}
                    className="lg:col-span-3 md:col-span-2 col-span-1"
                  >
                    <FormTextarea
                      value={formData.workHistoryDescription?.[idx] || ""}
                      onChange={(e) =>
                        setArrayValue("workHistoryDescription", idx, e.target.value || null)
                      }
                      rows={3}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          {t("detailPages.staff.sections.additionalInformation")}
        </h4>

        <FormField
          label={t("detailPages.staff.fields.remarks")}
          error={getFieldError("remarks")}
        >
          <FormTextarea
            value={formData.remarks || ""}
            onChange={(e) => onFieldChange("remarks", e.target.value || null)}
            disabled={isLoading}
            error={!!getFieldError("remarks")}
            placeholder={t(
              "detailPages.staff.placeholders.enterAdditionalRemarks"
            )}
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
};
