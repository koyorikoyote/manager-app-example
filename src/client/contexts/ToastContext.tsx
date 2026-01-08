import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer } from '../components/ui/Toast';

export interface ToastMessage {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (title: string, description?: string, duration?: number) => void;
  showError: (title: string, description?: string, duration?: number) => void;
  showWarning: (title: string, description?: string, duration?: number) => void;
  showInfo: (title: string, description?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    const newToast: ToastMessage = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });
  }, [generateId, maxToasts]);

  const showSuccess = useCallback((title: string, description?: string, duration?: number) => {
    showToast({ variant: 'success', title, description, duration });
  }, [showToast]);

  const showError = useCallback((title: string, description?: string, duration?: number) => {
    showToast({ variant: 'error', title, description, duration });
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string, duration?: number) => {
    showToast({ variant: 'warning', title, description, duration });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string, duration?: number) => {
    showToast({ variant: 'info', title, description, duration });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      <ToastContainer position={position}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};