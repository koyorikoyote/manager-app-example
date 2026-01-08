import { useState, useCallback } from "react";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  confirmText?: string;
  cancelText?: string;
}

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const showConfirmDialog = useCallback(
    (config: Omit<ConfirmDialogState, "isOpen">) => {
      setDialogState({
        ...config,
        isOpen: true,
      });
    },
    []
  );

  const hideConfirmDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    setIsLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await dialogState.onConfirm();
      hideConfirmDialog();
    } catch (error) {
      console.error("Confirm action failed:", error);
      setIsLoading(false);
      // Don't hide dialog on error, let the user try again
    }
  }, [dialogState, hideConfirmDialog]);

  return {
    dialogState,
    isLoading,
    showConfirmDialog,
    hideConfirmDialog,
    handleConfirm,
  };
};
