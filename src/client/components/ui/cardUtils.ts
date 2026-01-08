import { STATUS_COLORS, EMPTY_STATE } from "./cardStyles";
import { formatDateForTable } from "../../utils/localization";

/**
 * Get consistent color scheme for progress status
 */
export const getProgressStatusColor = (
  status: string
): (typeof STATUS_COLORS.progress)[keyof typeof STATUS_COLORS.progress] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.progress[
      normalizedStatus as keyof typeof STATUS_COLORS.progress
    ] || STATUS_COLORS.progress.default
  );
};

/**
 * Get consistent text for progress status
 */
export const getProgressStatusText = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "on_hold":
      return "On Hold";
    default:
      return status || EMPTY_STATE.placeholder;
  }
};

/**
 * Get consistent color scheme for condition status
 */
export const getConditionStatusColor = (
  status: string
): (typeof STATUS_COLORS.condition)[keyof typeof STATUS_COLORS.condition] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.condition[
      normalizedStatus as keyof typeof STATUS_COLORS.condition
    ] || STATUS_COLORS.condition.default
  );
};

/**
 * Get consistent color scheme for inquiry type
 */
export const getInquiryTypeColor = (
  type: string
): (typeof STATUS_COLORS.inquiryType)[keyof typeof STATUS_COLORS.inquiryType] => {
  const normalizedType = type?.toLowerCase();
  return (
    STATUS_COLORS.inquiryType[
      normalizedType as keyof typeof STATUS_COLORS.inquiryType
    ] || STATUS_COLORS.inquiryType.default
  );
};

/**
 * Format date consistently across all cards
 */
export const formatCardDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return EMPTY_STATE.placeholder;
  return formatDateForTable(date);
};

/**
 * Handle empty or missing data consistently
 */
export const getDisplayValue = (value: string | null | undefined): string => {
  return value || EMPTY_STATE.placeholder;
};

/**
 * Get consistent keyboard event handler for card interactions
 */
export const createCardKeyHandler =
  <T>(onClick: (item: T) => void, item: T) =>
  (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(item);
    }
  };

/**
 * Get consistent color scheme for staff status
 */
export const getStaffStatusColor = (
  status: string
): (typeof STATUS_COLORS.staffStatus)[keyof typeof STATUS_COLORS.staffStatus] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.staffStatus[
      normalizedStatus as keyof typeof STATUS_COLORS.staffStatus
    ] || STATUS_COLORS.staffStatus.default
  );
};

/**
 * Get consistent color scheme for company status
 */
export const getCompanyStatusColor = (
  status: string
): (typeof STATUS_COLORS.companyStatus)[keyof typeof STATUS_COLORS.companyStatus] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.companyStatus[
      normalizedStatus as keyof typeof STATUS_COLORS.companyStatus
    ] || STATUS_COLORS.companyStatus.default
  );
};

/**
 * Get consistent color scheme for property status
 */
export const getPropertyStatusColor = (
  status: string
): (typeof STATUS_COLORS.propertyStatus)[keyof typeof STATUS_COLORS.propertyStatus] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.propertyStatus[
      normalizedStatus as keyof typeof STATUS_COLORS.propertyStatus
    ] || STATUS_COLORS.propertyStatus.default
  );
};

/**
 * Get consistent color scheme for interaction type
 */
export const getInteractionTypeColor = (
  type: string
): (typeof STATUS_COLORS.interactionType)[keyof typeof STATUS_COLORS.interactionType] => {
  const normalizedType = type?.toLowerCase();
  return (
    STATUS_COLORS.interactionType[
      normalizedType as keyof typeof STATUS_COLORS.interactionType
    ] || STATUS_COLORS.interactionType.default
  );
};

/**
 * Get consistent color scheme for interaction status
 */
export const getInteractionStatusColor = (
  status: string
): (typeof STATUS_COLORS.interactionStatus)[keyof typeof STATUS_COLORS.interactionStatus] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.interactionStatus[
      normalizedStatus as keyof typeof STATUS_COLORS.interactionStatus
    ] || STATUS_COLORS.interactionStatus.default
  );
};

/**
 * Get consistent color scheme for complaint status
 */
export const getComplaintStatusColor = (
  status: string
): (typeof STATUS_COLORS.complaintStatus)[keyof typeof STATUS_COLORS.complaintStatus] => {
  const normalizedStatus = status?.toLowerCase();
  return (
    STATUS_COLORS.complaintStatus[
      normalizedStatus as keyof typeof STATUS_COLORS.complaintStatus
    ] || STATUS_COLORS.complaintStatus.default
  );
};

/**
 * Get consistent text for complaint status
 */
export const getComplaintStatusText = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "on_hold":
      return "On Hold";
    default:
      return status || EMPTY_STATE.placeholder;
  }
};

/**
 * Get consistent color scheme for urgency level
 */
export const getUrgencyLevelColor = (
  urgency: string
): (typeof STATUS_COLORS.urgencyLevel)[keyof typeof STATUS_COLORS.urgencyLevel] => {
  const normalizedUrgency = urgency?.toLowerCase();
  return (
    STATUS_COLORS.urgencyLevel[
      normalizedUrgency as keyof typeof STATUS_COLORS.urgencyLevel
    ] || STATUS_COLORS.urgencyLevel.default
  );
};

// Dialog-specific utility functions

/**
 * Create status badges for dialog display with consistent formatting
 */
export const createStatusBadges = (
  statuses: Array<{ key: string; value: string; type?: string }>
): Array<{ text: string; className: string }> => {
  return statuses
    .filter(
      (status) => status.value && status.value !== EMPTY_STATE.placeholder
    )
    .map((status) => {
      let colorClass: string = STATUS_COLORS.progress.default;

      // Determine color based on status type and value
      switch (status.type) {
        case "progress":
          colorClass = getProgressStatusColor(status.value);
          break;
        case "condition":
          colorClass = getConditionStatusColor(status.value);
          break;
        case "inquiry":
          colorClass = getInquiryTypeColor(status.value);
          break;
        case "staff":
          colorClass = getStaffStatusColor(status.value);
          break;
        case "company":
          colorClass = getCompanyStatusColor(status.value);
          break;
        case "property":
          colorClass = getPropertyStatusColor(status.value);
          break;
        case "interaction":
          colorClass = getInteractionStatusColor(status.value);
          break;
        case "complaint":
          colorClass = getComplaintStatusColor(status.value);
          break;
        case "urgency":
          colorClass = getUrgencyLevelColor(status.value);
          break;
        default:
          colorClass = STATUS_COLORS.progress.default;
      }

      return {
        text: status.value,
        className: colorClass,
      };
    });
};

/**
 * Format dialog field value with consistent empty state handling
 */
export const formatDialogField = (
  value: string | number | Date | null | undefined,
  type: "text" | "date" | "number" = "text"
): string => {
  if (value === null || value === undefined || value === "") {
    return EMPTY_STATE.placeholder;
  }

  switch (type) {
    case "date":
      return formatCardDate(value as Date | string);
    case "number":
      return typeof value === "number" ? value.toString() : String(value);
    case "text":
    default:
      return String(value);
  }
};

/**
 * Create dialog field display object with label and formatted value
 */
export const createDialogField = (
  label: string,
  value: string | number | Date | null | undefined,
  type: "text" | "date" | "number" = "text"
): { label: string; value: string; isEmpty: boolean } => {
  const formattedValue = formatDialogField(value, type);
  return {
    label,
    value: formattedValue,
    isEmpty: formattedValue === EMPTY_STATE.placeholder,
  };
};

/**
 * Generate dialog title with record identifier
 */
export const createDialogTitle = (
  baseTitle: string,
  identifier?: string | number
): string => {
  if (!identifier) return baseTitle;
  return `${baseTitle} - ${identifier}`;
};

/**
 * Create consistent dialog action handlers with error handling
 */
export const createDialogActionHandlers = <T>(
  record: T,
  getRecordId: (record: T) => string,
  onEdit: (record: T) => void,
  onDelete: (id: string) => void,
  onClose: () => void
) => {
  return {
    handleEdit: () => {
      onEdit(record);
      onClose();
    },
    handleDelete: () => {
      onDelete(getRecordId(record));
      onClose();
    },
    handleClose: onClose,
  };
};

/**
 * Validate dialog form data and return errors
 */
export const validateDialogForm = <T>(
  data: Partial<T>,
  requiredFields: Array<keyof T>,
  customValidators?: Array<{
    field: keyof T;
    validator: (value: unknown) => string | null;
  }>
): Array<{ field?: string; message: string }> => {
  const errors: Array<{ field?: string; message: string }> = [];

  // Check required fields
  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === null || value === undefined || value === "") {
      errors.push({
        field: String(field),
        message: `${String(field)} is required`,
      });
    }
  });

  // Run custom validators
  customValidators?.forEach(({ field, validator }) => {
    const value = data[field];
    const error = validator(value);
    if (error) {
      errors.push({
        field: String(field),
        message: error,
      });
    }
  });

  return errors;
};

/**
 * Create consistent dialog content sections
 */
export const createDialogSections = (
  sections: Array<{
    title?: string;
    fields: Array<{
      label: string;
      value: string | number | Date | null | undefined;
      type?: "text" | "date" | "number";
    }>;
  }>
): Array<{
  title?: string;
  fields: Array<{ label: string; value: string; isEmpty: boolean }>;
}> => {
  return sections.map((section) => ({
    title: section.title,
    fields: section.fields.map((field) =>
      createDialogField(field.label, field.value, field.type)
    ),
  }));
};

/**
 * Get dialog size class based on content type
 */
export const getDialogSizeClass = (
  contentType: "detail" | "form" | "confirmation",
  hasLongContent: boolean = false
): string => {
  switch (contentType) {
    case "detail":
      return hasLongContent ? "max-w-4xl" : "max-w-2xl";
    case "form":
      return "max-w-lg";
    case "confirmation":
      return "max-w-md";
    default:
      return "max-w-2xl";
  }
};
