import { useDialogState, UseDialogStateOptions } from "./useDialogState";
import { useDialogForm, UseDialogFormOptions } from "./useDialogForm";
import { useDialogFormatting } from "./useDialogFormatting";
import { useDialogValidation } from "./useDialogValidation";

export interface UseDialogUtilsOptions<T> extends UseDialogStateOptions<T> {
  formOptions?: Omit<UseDialogFormOptions<T>, "onSubmit">;
}

export const useDialogUtils = <T>(options: UseDialogUtilsOptions<T> = {}) => {
  const { formOptions, ...stateOptions } = options;

  // Dialog state management
  const dialogState = useDialogState<T>(stateOptions);

  // Form management for the editing record
  const formHook = useDialogForm<T>({
    initialData: dialogState.editingRecord || {},
    onSubmit: dialogState.handleSubmit,
    onSuccess: () => {
      dialogState.closeForm();
    },
    onError: (errors) => {
      console.error("Form submission errors:", errors);
    },
    ...formOptions,
  });

  // Formatting utilities
  const formatting = useDialogFormatting();

  // Validation utilities
  const validation = useDialogValidation<T>();

  return {
    // State management
    ...dialogState,

    // Form management
    form: formHook,

    // Formatting utilities
    format: formatting,

    // Validation utilities
    validate: validation,

    // Convenience methods
    openEditForm: (record: T) => {
      dialogState.handleEdit(record);
      formHook.reset(record as Partial<T>);
    },

    openNewForm: () => {
      dialogState.openForm();
      formHook.reset({});
    },

    closeAllDialogs: () => {
      dialogState.closeDetail();
      dialogState.closeForm();
      formHook.reset();
    },
  };
};
