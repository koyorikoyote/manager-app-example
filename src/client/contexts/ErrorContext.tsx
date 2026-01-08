import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ApiClientError, NetworkError, TimeoutError, getErrorMessage, getErrorCode } from '../services/apiClient';

export interface ErrorInfo {
  id: string;
  message: string;
  code?: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  dismissed: boolean;
  retryable: boolean;
  context?: string; // Additional context about where the error occurred
}

interface ErrorContextType {
  errors: ErrorInfo[];
  addError: (error: any, context?: string, type?: 'error' | 'warning' | 'info') => string;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  getActiveErrors: () => ErrorInfo[];
  hasErrors: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number; // Maximum number of errors to keep in memory
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  maxErrors = 10 
}) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((
    error: any, 
    context?: string, 
    type: 'error' | 'warning' | 'info' = 'error'
  ): string => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      message: getErrorMessage(error),
      code: getErrorCode(error),
      type,
      timestamp: new Date(),
      dismissed: false,
      retryable: isRetryableError(error),
      context
    };

    setErrors(prevErrors => {
      const newErrors = [errorInfo, ...prevErrors];
      // Keep only the most recent errors
      return newErrors.slice(0, maxErrors);
    });

    // Auto-dismiss info messages after 5 seconds
    if (type === 'info') {
      setTimeout(() => {
        dismissError(errorId);
      }, 5000);
    }

    // Log error for debugging
    console.error('Error added to context:', {
      id: errorId,
      message: errorInfo.message,
      code: errorInfo.code,
      context,
      error
    });

    return errorId;
  }, [maxErrors]);

  const dismissError = useCallback((id: string) => {
    setErrors(prevErrors =>
      prevErrors.map(error =>
        error.id === id ? { ...error, dismissed: true } : error
      )
    );
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getActiveErrors = useCallback(() => {
    return errors.filter(error => !error.dismissed);
  }, [errors]);

  const hasErrors = getActiveErrors().length > 0;

  const value: ErrorContextType = {
    errors,
    addError,
    dismissError,
    clearErrors,
    getActiveErrors,
    hasErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Helper function to determine if an error is retryable
function isRetryableError(error: any): boolean {
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }
  if (error instanceof ApiClientError) {
    // Retry on server errors (5xx) but not client errors (4xx)
    return error.statusCode >= 500;
  }
  return false;
}

// Hook for handling async operations with error context
export const useAsyncError = () => {
  const { addError } = useError();

  const handleAsyncError = useCallback(async (
    operation: () => Promise<any>,
    context?: string,
    errorType: 'error' | 'warning' | 'info' = 'error'
  ): Promise<any | null> => {
    try {
      return await operation();
    } catch (error) {
      addError(error, context, errorType);
      return null;
    }
  }, [addError]);

  return { handleAsyncError };
};

// Hook for handling form errors specifically
export const useFormError = () => {
  const { addError } = useError();

  const handleFormError = useCallback((error: any, formName?: string) => {
    const context = formName ? `Form: ${formName}` : 'Form submission';
    
    // Handle validation errors differently
    if (error instanceof ApiClientError && error.code === 'VALIDATION_ERROR') {
      addError(error, context, 'warning');
    } else {
      addError(error, context, 'error');
    }
  }, [addError]);

  return { handleFormError };
};