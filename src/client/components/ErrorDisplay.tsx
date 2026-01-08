import React from 'react';
import { useError, ErrorInfo } from '../contexts/ErrorContext';

interface ErrorDisplayProps {
  className?: string;
  maxVisible?: number;
  showDismissButton?: boolean;
  showTimestamp?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  className = '',
  maxVisible = 3,
  showDismissButton = true,
  showTimestamp = false
}) => {
  const { getActiveErrors, dismissError, clearErrors } = useError();
  const activeErrors = getActiveErrors().slice(0, maxVisible);

  if (activeErrors.length === 0) {
    return null;
  }

  return (
    <div className={`error-display ${className}`}>
      {activeErrors.map((error) => (
        <ErrorItem
          key={error.id}
          error={error}
          onDismiss={showDismissButton ? () => dismissError(error.id) : undefined}
          showTimestamp={showTimestamp}
        />
      ))}
      {activeErrors.length > 1 && (
        <div className="error-actions">
          <button
            onClick={clearErrors}
            className="clear-all-button"
            type="button"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

interface ErrorItemProps {
  error: ErrorInfo;
  onDismiss?: () => void;
  showTimestamp?: boolean;
}

const ErrorItem: React.FC<ErrorItemProps> = ({ error, onDismiss, showTimestamp }) => {
  const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return '';
      default:
        return '❌';
    }
  };

  const getErrorClass = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'error':
        return 'error-item error-item--error';
      case 'warning':
        return 'error-item error-item--warning';
      case 'info':
        return 'error-item error-item--info';
      default:
        return 'error-item error-item--error';
    }
  };

  return (
    <div className={getErrorClass(error.type)} role="alert">
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon" aria-hidden="true">
            {getErrorIcon(error.type)}
          </span>
          <span className="error-message">{error.message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="error-dismiss"
              type="button"
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>

        {(error.code || error.context || showTimestamp) && (
          <div className="error-details">
            {error.code && (
              <span className="error-code">Code: {error.code}</span>
            )}
            {error.context && (
              <span className="error-context">Context: {error.context}</span>
            )}
            {showTimestamp && (
              <span className="error-timestamp">
                {error.timestamp.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Toast-style error display for temporary notifications
export const ErrorToast: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`error-toast ${className}`}>
      <ErrorDisplay
        maxVisible={1}
        showDismissButton={true}
        showTimestamp={false}
      />
    </div>
  );
};

// Inline error display for forms
export const InlineError: React.FC<{
  message?: string;
  code?: string;
  className?: string
}> = ({ message, code, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`inline-error ${className}`} role="alert">
      <span className="inline-error-icon" aria-hidden="true">⚠️</span>
      <span className="inline-error-message">{message}</span>
      {code && <span className="inline-error-code">({code})</span>}
    </div>
  );
};