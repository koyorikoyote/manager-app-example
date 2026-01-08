import React, { useState, useEffect } from 'react';
import { InteractionRecord } from '../../../shared/types';
import { interactionService, CreateInteractionData, UpdateInteractionData } from '../../services/interactionService';
import { staffService } from '../../services/staffService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { formatDateForInput, parseDateFromInput } from '../../utils/dateUtils';

interface InteractionFormProps {
  record?: InteractionRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  record,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: number; name: string; employeeId: string | null }>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    type: record?.type || 'daily' as InteractionRecord['type'],
    date: record?.date ? formatDateForInput(record.date) : formatDateForInput(new Date()),
    description: record?.description || '',
    status: record?.status || 'open' as InteractionRecord['status'],
    name: record?.name || '',
    title: record?.title || '',
    personInvolvedStaffId: record?.personInvolvedStaffId?.toString() || '',
    userInChargeId: record?.userInChargeId?.toString() || '',
    personConcerned: record?.personConcerned || '',
  });

  const interactionTypes: Array<{ value: InteractionRecord['type']; label: string }> = [
    { value: 'DISCUSSION', label: t('interactions.types.DISCUSSION') },
    { value: 'INTERVIEW', label: t('interactions.types.INTERVIEW') },
    { value: 'CONSULTATION', label: t('interactions.types.CONSULTATION') },
    { value: 'OTHER', label: t('interactions.types.OTHER') },
  ];

  const statusOptions: Array<{ value: InteractionRecord['status']; label: string }> = [
    { value: 'OPEN', label: t('interactions.open') },
    { value: 'IN_PROGRESS', label: t('interactions.inProgress') },
    { value: 'RESOLVED', label: t('interactions.resolved') },
  ];

  useEffect(() => {
    loadStaffList();
    loadAvailableStaff();
    loadAvailableUsers();
  }, []);

  const loadStaffList = async () => {
    try {
      await staffService.getAllStaff();
      // Staff list loaded for reference
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await fetch('/api/interactions/available-staff');
      const result = await response.json();
      if (result.success) {
        setAvailableStaff(result.data);
      }
    } catch (error) {
      console.error('Failed to load available staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/interactions/available-users');
      const result = await response.json();
      if (result.success) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error('Failed to load available users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (record) {
        // Update existing record
        const updateData: UpdateInteractionData = {
          type: formData.type,
          date: (parseDateFromInput(formData.date) as Date),
          description: formData.description,
          status: formData.status,
          name: formData.name || undefined,
          title: formData.title || undefined,
          personInvolvedStaffId: formData.personInvolvedStaffId || undefined,
          userInChargeId: formData.userInChargeId ? parseInt(formData.userInChargeId) : undefined,
          personConcerned: formData.personConcerned || undefined,
        };
        await interactionService.updateInteraction(String(record.id), updateData);
      } else {
        // Create new record
        const createData: CreateInteractionData = {
          type: formData.type,
          date: (parseDateFromInput(formData.date) as Date),
          description: formData.description,
          status: formData.status,
          name: formData.name || undefined,
          title: formData.title || undefined,
          personInvolvedStaffId: formData.personInvolvedStaffId || undefined,
          userInChargeId: formData.userInChargeId ? parseInt(formData.userInChargeId) : undefined,
          personConcerned: formData.personConcerned || undefined,
          createdBy: 1, // This should come from auth context - using admin user ID for now
        };
        await interactionService.createInteraction(createData);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Text variant="h1" className="text-xl font-bold">
            {record ? t('interactions.editRecord') : t('interactions.addNew')}
          </Text>
          <Button variant="ghost" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <Text variant="body" className="text-red-700">
              {error}
            </Text>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interactions.type')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {interactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter interaction name"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter interaction title"
            />
          </div>

          {/* Person Concerned */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interactions.columns.personConcerned')}
            </label>
            <Input
              type="text"
              value={formData.personConcerned}
              onChange={(e) => handleInputChange('personConcerned', e.target.value)}
              placeholder="Enter person concerned"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interactions.columns.date')} *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interactions.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="Enter detailed description..."
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('interactions.status.label')} *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Person Involved */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person Involved
            </label>
            <select
              value={formData.personInvolvedStaffId}
              onChange={(e) => handleInputChange('personInvolvedStaffId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingStaff}
            >
              <option value="">Select person involved...</option>
              {availableStaff.map((staff) => (
                <option key={staff.id} value={staff.id.toString()}>
                  {staff.name} ({staff.employeeId})
                </option>
              ))}
            </select>
            {loadingStaff && (
              <p className="text-sm text-gray-500 mt-1">Loading staff...</p>
            )}
          </div>

          {/* User In Charge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User In Charge
            </label>
            <select
              value={formData.userInChargeId}
              onChange={(e) => handleInputChange('userInChargeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingUsers}
            >
              <option value="">Select user in charge...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name}
                </option>
              ))}
            </select>
            {loadingUsers && (
              <p className="text-sm text-gray-500 mt-1">Loading users...</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? t('common.status.loading') : t('common.actions.save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
