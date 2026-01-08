import { useState, useCallback } from "react";

export interface DialogState<T> {
  isDetailOpen: boolean;
  isFormOpen: boolean;
  selectedRecord: T | null;
  editingRecord: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface DialogActions<T> {
  openDetail: (record: T) => void;
  closeDetail: () => void;
  openForm: (record?: T) => void;
  closeForm: () => void;
  handleEdit: (record: T) => void;
  handleDelete: (id: string) => Promise<void>;
  handleSubmit: (data: Partial<T>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface UseDialogStateOptions<T> {
  onDelete?: (id: string) => Promise<void>;
  onSubmit?: (data: Partial<T>) => Promise<void>;
  onError?: (error: string) => void;
}

export const useDialogState = <T>(
  options: UseDialogStateOptions<T> = {}
): DialogState<T> & DialogActions<T> => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDetail = useCallback((record: T) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
    setError(null);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedRecord(null);
    setError(null);
  }, []);

  const openForm = useCallback((record?: T) => {
    setEditingRecord(record || null);
    setIsFormOpen(true);
    setError(null);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setError(null);
  }, []);

  const handleEdit = useCallback(
    (record: T) => {
      closeDetail();
      openForm(record);
    },
    [closeDetail, openForm]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!options.onDelete) {
        console.warn("No onDelete handler provided to useDialogState");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await options.onDelete(id);
        closeDetail();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Delete operation failed";
        setError(errorMessage);
        if (options.onError) {
          options.onError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options, closeDetail]
  );

  const handleSubmit = useCallback(
    async (data: Partial<T>) => {
      if (!options.onSubmit) {
        console.warn("No onSubmit handler provided to useDialogState");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await options.onSubmit(data);
        closeForm();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Submit operation failed";
        setError(errorMessage);
        if (options.onError) {
          options.onError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options, closeForm]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isDetailOpen,
    isFormOpen,
    selectedRecord,
    editingRecord,
    isLoading,
    error,
    // Actions
    openDetail,
    closeDetail,
    openForm,
    closeForm,
    handleEdit,
    handleDelete,
    handleSubmit,
    setLoading: setIsLoading,
    setError,
    clearError,
  };
};
