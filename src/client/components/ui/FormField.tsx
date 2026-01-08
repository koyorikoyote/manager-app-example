import React from 'react';
import { Input } from './Input';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
  hasError?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  rows?: number;
  className?: string;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hasError,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  className = '',
  helpText
}) => {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${hasError 
      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
      : 'border-gray-300 bg-white hover:border-gray-400'
    }
    ${className}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
            aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
            aria-invalid={hasError}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
            aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
            aria-invalid={hasError}
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
            aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
            aria-invalid={hasError}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <div 
          id={errorId}
          className="flex items-center space-x-1 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <p 
          id={helpId}
          className="text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

// Specialized form field components
export const EmailField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="email" />
);

export const PasswordField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="password" />
);

export const NumberField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="number" />
);

export const DateField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="date" />
);

export const TextAreaField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="textarea" />
);

export const SelectField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="select" />
);