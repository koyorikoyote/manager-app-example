import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormField, SelectField, TextAreaField } from '../ui/FormField';
import { useFormState } from '../../hooks/useFormState';
import { FormValidator } from '../../../shared/validation/validator';
import { systemConfigValidationSchemas } from '../../../shared/validation/schemas';
import { SystemConfiguration } from '../../../shared/types';

interface SystemConfigurationFormProps {
  initialData?: Partial<SystemConfiguration>;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

interface FormData {
  [key: string]: unknown;
  key: string;
  value: string;
  description?: string;
  category: string;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
}

const DATA_TYPE_OPTIONS = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'JSON', label: 'JSON' }
];

const CATEGORY_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'ui', label: 'User Interface' },
  { value: 'security', label: 'Security' },
  { value: 'notification', label: 'Notification' },
  { value: 'integration', label: 'Integration' },
  { value: 'performance', label: 'Performance' }
];

export const SystemConfigurationForm: React.FC<SystemConfigurationFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  mode
}) => {
  const navigate = useNavigate();

  const initialFormData: Partial<FormData> = {
    key: initialData.key || '',
    value: initialData.value || '',
    description: initialData.description || '',
    category: initialData.category || '',
    dataType: initialData.dataType || 'STRING'
  };

  const schema = mode === 'create'
    ? systemConfigValidationSchemas.create
    : systemConfigValidationSchemas.update;

  const validator = new FormValidator(schema as any);
  const form = useFormState<FormData>({
    initialData: initialFormData,
    validator,
    enableRealTimeValidation: true,
    onSubmit: async (data) => {
      await onSubmit(data as any);
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.setFormData({
        key: initialData.key || '',
        value: initialData.value || '',
        description: initialData.description || '',
        category: initialData.category || '',
        dataType: initialData.dataType || 'STRING'
      });
    }
  }, [initialData]);

  const handleCancel = () => {
    navigate('/system-configurations');
  };

  const getValuePlaceholder = (dataType: string) => {
    switch (dataType) {
      case 'NUMBER':
        return 'Enter a number (e.g., 42, 3.14)';
      case 'BOOLEAN':
        return 'Enter true or false';
      case 'JSON':
        return 'Enter valid JSON (e.g., {"key": "value"})';
      default:
        return 'Enter configuration value';
    }
  };

  const getValueHelpText = (dataType: string) => {
    switch (dataType) {
      case 'NUMBER':
        return 'Must be a valid number (integer or decimal)';
      case 'BOOLEAN':
        return 'Must be exactly "true" or "false" (case-insensitive)';
      case 'JSON':
        return 'Must be valid JSON format';
      default:
        return 'Any text value';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          {mode === 'create' ? 'Add System Configuration' : 'Edit System Configuration'}
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Key Field */}
            <FormField
              label="Configuration Key"
              name="key"
              value={(form.data.key as string) || ''}
              onChange={(e) => form.setFieldValue('key', e.target.value)}
              onBlur={() => form.validateField('key')}
              error={form.getFieldError('key')}
              hasError={!!form.getFieldError('key')}
              placeholder="e.g., app.theme.default"
              required
              disabled={isLoading}
              helpText="Unique identifier for this configuration. Use dot notation for hierarchical keys."
            />

            {/* Category Field */}
            <SelectField
              label="Category"
              name="category"
              value={(form.data.category as string) || ''}
              onChange={(e) => form.setFieldValue('category', e.target.value)}
              onBlur={() => form.validateField('category')}
              error={form.getFieldError('category')}
              hasError={!!form.getFieldError('category')}
              options={CATEGORY_OPTIONS}
              required
              disabled={isLoading}
              helpText="Logical grouping for this configuration"
            />

            {/* Data Type Field */}
            <SelectField
              label="Data Type"
              name="dataType"
              value={(form.data.dataType as string) || 'STRING'}
              onChange={(e) => form.setFieldValue('dataType', e.target.value)}
              onBlur={() => form.validateField('dataType')}
              error={form.getFieldError('dataType')}
              hasError={!!form.getFieldError('dataType')}
              options={DATA_TYPE_OPTIONS}
              required
              disabled={isLoading}
              helpText="Type of data stored in this configuration"
            />

            {/* Value Field */}
            <FormField
              label="Configuration Value"
              name="value"
              type={(form.data.dataType as string) === 'JSON' ? 'textarea' : 'text'}
              value={(form.data.value as string) || ''}
              onChange={(e) => form.setFieldValue('value', e.target.value)}
              onBlur={() => form.validateField('value')}
              error={form.getFieldError('value')}
              hasError={!!form.getFieldError('value')}
              placeholder={getValuePlaceholder((form.data.dataType as string) || 'STRING')}
              required
              disabled={isLoading}
              rows={(form.data.dataType as string) === 'JSON' ? 6 : 3}
              helpText={getValueHelpText((form.data.dataType as string) || 'STRING')}
            />

            {/* Description Field */}
            <TextAreaField
              label="Description"
              name="description"
              value={(form.data.description as string) || ''}
              onChange={(e) => form.setFieldValue('description', e.target.value)}
              onBlur={() => form.validateField('description')}
              error={form.getFieldError('description')}
              hasError={!!form.getFieldError('description')}
              placeholder="Describe what this configuration controls..."
              disabled={isLoading}
              rows={3}
              helpText="Optional description to help other administrators understand this configuration"
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !form.isValid || form.isSubmitting}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create Configuration' : 'Update Configuration'}
              </Button>
            </div>

            {/* Form Validation Summary */}
            {form.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {form.errors.map((error, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
