// Dialog-specific utility hooks
export { useDialogState } from "./useDialogState";
export { useDialogForm } from "./useDialogForm";
export { useDialogFormatting } from "./useDialogFormatting";
export { useDialogValidation } from "./useDialogValidation";
export { useDialogUtils } from "./useDialogUtils";

// Re-export types for convenience
export type {
  DialogState,
  DialogActions,
  UseDialogStateOptions,
} from "./useDialogState";
export type {
  FormError,
  UseDialogFormOptions,
  UseDialogFormReturn,
} from "./useDialogForm";
export type {
  DialogField,
  DialogSection,
  StatusBadge,
  UseDialogFormattingReturn,
} from "./useDialogFormatting";
export type {
  ValidationRule,
  ValidationError,
  UseDialogValidationReturn,
} from "./useDialogValidation";
export type { UseDialogUtilsOptions } from "./useDialogUtils";
