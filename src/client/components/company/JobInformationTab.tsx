import React, { useEffect, useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { useLanguage } from "../../contexts/LanguageContext";
import { cn } from "../../utils/cn";
import { AddressClickableField } from "../ui/AddressClickableField";
import { useResponsiveNavigation } from "../../hooks/useResponsiveNavigation";
import { staffService } from "../../services/staffService";
import type { Company, Staff } from "../../../shared/types";

export interface JobInformationTabProps {
  company: Company;
  isEditMode: boolean;
  onFieldChange?: (field: keyof Company, value: unknown) => void;
  getFieldError?: (field: string) => string | undefined;
}

export const JobInformationTab: React.FC<JobInformationTabProps> = ({
  company,
  isEditMode: _isEditMode,
  onFieldChange: _onFieldChange,
  getFieldError: _getFieldError,
}) => {
  const { t } = useLanguage();
  const { isMobile, isTablet } = useResponsive();
  const { navigateToDetail } = useResponsiveNavigation();

  type StatusTranslationKey =
    | "destinations.status.ACTIVE"
    | "destinations.status.INACTIVE"
    | "destinations.status.SUSPENDED";

  const STATUS_MAP: Record<string, StatusTranslationKey> = {
    ACTIVE: "destinations.status.ACTIVE",
    INACTIVE: "destinations.status.INACTIVE",
    PENDING: "destinations.status.SUSPENDED",
    // add more
  };

  // Local state: staff (crew) hired for this company
  const [hiredCrew, setHiredCrew] = useState<Staff[]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        // Minimal implementation: fetch all staff and filter by company
        const all = await staffService.getAllStaff(controller.signal);
        const filtered = all.filter(
          (s) => (s.company?.id || s.companiesId) === company.id
        );
        if (!cancelled) setHiredCrew(filtered);
      } catch {
        if (!cancelled) setHiredCrew([]);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [company.id]);

  // Format date values
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return t("detailPages.common.notSpecified");
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // Format number values
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return t("detailPages.common.notSpecified");
    return value.toString();
  };

  // Render field sections
  const renderFieldSection = (
    title: string,
    fields: Array<{
      label: string;
      value: string | number | Date | null | undefined;
      key: string;
      type?: "text" | "number" | "date" | "foreign_key";
      foreignKeyDisplay?: string;
    }>
  ) => {
    // Separate full-width fields from regular grid fields
    const fullWidthFields = fields.filter(
      (field) => field.key === "website"
    );
    const gridFields = fields.filter(
      (field) => field.key !== "website" && field.key !== "address" && field.key !== "postalCode" && field.key !== "hiredCrew"
    );

    // Pull out Company Name and Company ID to render first in a 2-column layout
    const specialOrder = ["name", "companyId"];
    const specialFields = gridFields
      .filter((f) => specialOrder.includes(f.key))
      .sort((a, b) => specialOrder.indexOf(a.key) - specialOrder.indexOf(b.key));
    const remainingGridFields = gridFields.filter((f) => !specialOrder.includes(f.key));

    const renderDisplayValue = (
      type: string | undefined,
      value: string | number | Date | null | undefined,
      foreignKeyDisplay?: string
    ) => {
      switch (type) {
        case "date":
          return formatDate(value as Date);
        case "number":
          return formatNumber(value as number);
        case "foreign_key":
          return foreignKeyDisplay || t("detailPages.common.notAssigned");
        default:
          return (value as string) || t("detailPages.common.notSpecified");
      }
    };

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        {/* Render Company Name & ID first as a 2-column grid */}
        {specialFields.length > 0 && (
          <div
            className={cn(
              "grid gap-4 mb-4",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {specialFields.map(({ label, value, key, type = "text", foreignKeyDisplay }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {renderDisplayValue(type, value, foreignKeyDisplay)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Postal Code + Address side-by-side (postal first, address expands) */}
        {(() => {
          const postal = fields.find((f) => f.key === "postalCode")?.value as string | undefined;
          const address = fields.find((f) => f.key === "address")?.value as string | undefined;
          if (!postal && !address) return null;
          const formatPostal = (pc?: string) => (pc ? (pc.startsWith("〒") ? pc : `〒${pc}`) : t("detailPages.common.notSpecified"));
          return (
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-baseline">
                <div className="w-24 shrink-0">
                  <dt className={cn('font-medium text-gray-700 whitespace-nowrap', isMobile ? 'text-xs' : 'text-sm')}>
                    {t("detailPages.staff.fields.postalCode")}
                  </dt>
                  <dd className={cn('text-gray-900 inline-block align-baseline', isMobile ? 'text-sm' : 'text-sm')}>
                    {formatPostal(postal)}
                  </dd>
                </div>
                <div className="flex-1 min-w-0">
                  <dt className={cn('font-medium text-gray-700 whitespace-nowrap', isMobile ? 'text-xs' : 'text-sm')}>
                    {t("detailPages.destination.fields.address")}
                  </dt>
                  <dd className={cn('text-gray-900 inline-block align-baseline', isMobile ? 'text-sm' : 'text-sm')}>
                    <AddressClickableField address={address || ""} />
                  </dd>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Render remaining full-width fields (e.g., website) */}
        {fullWidthFields.length > 0 && (
          <div className="space-y-4 mb-6">
            {fullWidthFields.map(({ label, value, key, type = "text", foreignKeyDisplay }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {renderDisplayValue(type, value, foreignKeyDisplay)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render the remaining grid fields after full-width fields */}
        {remainingGridFields.length > 0 && (
          <div
            className={cn(
              "grid gap-4",
              isMobile
                ? "grid-cols-1"
                : isTablet
                  ? "grid-cols-2"
                  : "grid-cols-3"
            )}
          >
            {remainingGridFields.map(({ label, value, key, type = "text", foreignKeyDisplay }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {renderDisplayValue(type, value, foreignKeyDisplay)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render hired crew as a separate full-width field LAST in this section */}
        {fields.some((f) => f.key === "hiredCrew") && (
          <div className="space-y-1 mt-6">
            <label className="text-sm font-medium text-gray-700">
              {t("detailPages.destination.fields.hiredCrew")}
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
              {(() => {
                const list = hiredCrew.filter((s) => !!s.employeeId);
                if (list.length === 0) {
                  return <span>{t("detailPages.common.notSpecified")}</span>;
                }
                return (
                  <span>
                    {list.map((s, idx) => (
                      <React.Fragment key={s.id}>
                        <button
                          type="button"
                          className="text-blue-600 hover:underline focus:outline-none p-0 bg-transparent cursor-pointer"
                          onClick={() => navigateToDetail(String(s.id), "staff")}
                          title={s.name || undefined}
                        >
                          {s.employeeId as string}
                        </button>
                        {idx < list.length - 1 && <span className="text-gray-500">, </span>}
                      </React.Fragment>
                    ))}
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Basic company information fields (existing fields except id, created_at, updated_at)
  const basicCompanyFields = [
    {
      label: t("detailPages.destination.fields.companyName"),
      value: company.name,
      key: "name",
    },
    {
      label: t("detailPages.destination.fields.companyId"),
      value: company.companyId,
      key: "companyId",
    },
    {
      label: t("detailPages.staff.fields.postalCode"),
      value: company.postalCode,
      key: "postalCode",
    },
    {
      label: t("detailPages.destination.fields.address"),
      value: company.address,
      key: "address",
    },
    {
      label: t("detailPages.destination.fields.website"),
      value: company.website,
      key: "website",
    },
    {
      label: t("detailPages.destination.fields.contactPerson"),
      value: company.contactPerson,
      key: "contactPerson",
    },
    {
      label: t("detailPages.destination.fields.phone"),
      value: company.phone,
      key: "phone",
    },
    {
      label: t("detailPages.destination.fields.email"),
      value: company.email,
      key: "email",
    },
    {
      label: t("detailPages.destination.fields.hiringVacancies"),
      value: company.hiringVacancies,
      key: "hiringVacancies",
      type: "number" as const,
    },
    {
      label: t("detailPages.destination.fields.preferredNationality"),
      value: company.preferredNationality,
      key: "preferredNationality",
    },
    {
      label: t("detailPages.destination.fields.description"),
      value: company.description,
      key: "description",
    },
    {
      label: t("detailPages.destination.fields.industry"),
      value: company.industry,
      key: "industry",
    },
    {
      label: t("detailPages.destination.fields.userInCharge"),
      value: company.userInChargeId,
      key: "userInChargeId",
      type: "foreign_key" as const,
      foreignKeyDisplay: company.userInCharge?.name,
    },
    {
      label: t("detailPages.destination.fields.status"),
      value: company.status
        ? t(STATUS_MAP[String(company.status).toUpperCase()])
        : t("detailPages.common.notSpecified"),
      key: "status",
    },
    // Placeholder entry to mark where the Hired Crew full-width field should render last
    {
      label: t("detailPages.destination.fields.hiredCrew"),
      value: "",
      key: "hiredCrew",
    },
  ];

  // Preferred candidate criteria fields
  const preferredCandidateFields = [
    {
      label: t("detailPages.destination.fields.statusOfResidence"),
      value: company.preferredStatusOfResidence,
      key: "preferredStatusOfResidence",
    },
    {
      label: t("detailPages.destination.fields.age"),
      value: company.preferredAge,
      key: "preferredAge",
    },
    {
      label: t("detailPages.destination.fields.experience"),
      value: company.preferredExperience,
      key: "preferredExperience",
    },
    {
      label: t("detailPages.destination.fields.qualifications"),
      value: company.preferredQualifications,
      key: "preferredQualifications",
    },
    {
      label: t("detailPages.destination.fields.personality"),
      value: company.preferredPersonality,
      key: "preferredPersonality",
    },
    {
      label: t("detailPages.destination.fields.education"),
      value: company.preferredEducation,
      key: "preferredEducation",
    },
    {
      label: t("detailPages.destination.fields.japaneseProficiency"),
      value: company.preferredJapaneseProficiency,
      key: "preferredJapaneseProficiency",
    },
  ];

  // Destination work environment fields
  const destinationWorkFields = [
    {
      label: t("detailPages.destination.fields.workEnvironment"),
      value: company.destinationWorkEnvironment,
      key: "destinationWorkEnvironment",
    },
    {
      label: t("detailPages.destination.fields.averageAge"),
      value: company.destinationAverageAge,
      key: "destinationAverageAge",
    },
    {
      label: t("detailPages.destination.fields.workPlace"),
      value: company.destinationWorkPlace,
      key: "destinationWorkPlace",
    },
    {
      label: t("detailPages.destination.fields.transfer"),
      value: company.destinationTransfer,
      key: "destinationTransfer",
    },
  ];

  // Job selection and history fields
  const jobSelectionFields = [
    {
      label: t("detailPages.destination.fields.selectionProcess"),
      value: company.jobSelectionProcess,
      key: "jobSelectionProcess",
    },
    {
      label: t("detailPages.destination.fields.pastRecruitmentHistory"),
      value: company.jobPastRecruitmentHistory,
      key: "jobPastRecruitmentHistory",
    },
  ];

  // Employment terms fields
  const employmentTermsFields = [
    {
      label: t("detailPages.destination.fields.salary"),
      value: company.jobSalary,
      key: "jobSalary",
    },
    {
      label: t("detailPages.destination.fields.overtimeRate"),
      value: company.jobOvertimeRate,
      key: "jobOvertimeRate",
    },
    {
      label: t("detailPages.destination.fields.salaryIncreaseRate"),
      value: company.jobSalaryIncreaseRate,
      key: "jobSalaryIncreaseRate",
    },
    {
      label: t("detailPages.destination.fields.salaryBonus"),
      value: company.jobSalaryBonus,
      key: "jobSalaryBonus",
    },
    {
      label: t("detailPages.destination.fields.allowances"),
      value: company.jobAllowances,
      key: "jobAllowances",
    },
    {
      label: t("detailPages.destination.fields.employeeBenefits"),
      value: company.jobEmployeeBenefits,
      key: "jobEmployeeBenefits",
    },
    {
      label: t("detailPages.destination.fields.retirementBenefits"),
      value: company.jobRetirementBenefits,
      key: "jobRetirementBenefits",
    },
    {
      label: t("detailPages.destination.fields.termsAndConditions"),
      value: company.jobTermsAndConditions,
      key: "jobTermsAndConditions",
    },
    {
      label: t("detailPages.destination.fields.disputePreventionMeasures"),
      value: company.jobDisputePreventionMeasures,
      key: "jobDisputePreventionMeasures",
    },
    {
      label: t("detailPages.destination.fields.provisionalHiringConditions"),
      value: company.jobProvisionalHiringConditions,
      key: "jobProvisionalHiringConditions",
    },
    {
      label: t("detailPages.destination.fields.contractRenewalConditions"),
      value: company.jobContractRenewalConditions,
      key: "jobContractRenewalConditions",
    },
    {
      label: t("detailPages.destination.fields.retirementConditions"),
      value: company.jobRetirementConditions,
      key: "jobRetirementConditions",
    },
  ];

  return (
    <div className="space-y-6">
      {renderFieldSection(
        t("detailPages.destination.sections.companyInformation"),
        basicCompanyFields
      )}
      {renderFieldSection(
        t("detailPages.destination.sections.preferredCandidateCriteria"),
        preferredCandidateFields
      )}
      {renderFieldSection(
        t("detailPages.destination.sections.destinationWorkEnvironment"),
        destinationWorkFields
      )}
      {renderFieldSection(
        t("detailPages.destination.sections.jobSelectionHistory"),
        jobSelectionFields
      )}
      {renderFieldSection(
        t("detailPages.destination.sections.employmentTerms"),
        employmentTermsFields
      )}
    </div>
  );
};
