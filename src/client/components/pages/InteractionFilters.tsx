import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { InteractionRecord } from '../../../shared/types';
import { InteractionFilters } from '../../services/interactionService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatDateForInput, parseDateFromInput } from '../../utils/dateUtils';

interface InteractionFiltersComponentProps {
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
  activeTab: InteractionRecord['type'] | 'all';
}

export const InteractionFiltersComponent: React.FC<InteractionFiltersComponentProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<InteractionFilters>(filters);

  const statusOptions: Array<{ value: InteractionRecord['status']; label: string }> = [
    { value: 'OPEN', label: t('interactions.open') },
    { value: 'IN_PROGRESS', label: t('interactions.inProgress') },
    { value: 'RESOLVED', label: t('interactions.resolved') },
  ];

  const sortOptions: Array<{ value: keyof InteractionRecord; label: string }> = [
    { value: 'date', label: t('interactions.columns.date') },
    { value: 'type', label: t('interactions.type') },
    { value: 'status', label: t('interactions.status.label') },
    { value: 'createdAt', label: t('interactions.createdAt') },
    { value: 'updatedAt', label: t('interactions.updatedAt') },
  ];

  const handleFilterChange = (field: keyof InteractionFilters, value: string | Date | undefined) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: InteractionFilters = {
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };


  return (
    <Card className="search-component-spacing">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700">{t('search.filter')}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-secondary-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {t('interactions.filterByStatus')}
                  </label>
                  <select
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('interactions.allStatuses')}</option>
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {t('interactions.dateFrom')}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(localFilters.dateFrom)}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value ? (parseDateFromInput(e.target.value) || undefined) : undefined)}
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {t('interactions.dateTo')}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(localFilters.dateTo)}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value ? (parseDateFromInput(e.target.value) || undefined) : undefined)}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {t('interactions.sortBy')}
                  </label>
                  <select
                    value={localFilters.sortBy || 'date'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value as keyof InteractionRecord)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {t('interactions.sortOrder')}
                  </label>
                  <select
                    value={localFilters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="desc">{t('interactions.descending')}</option>
                    <option value="asc">{t('interactions.ascending')}</option>
                  </select>
                </div>

                {/* Staff ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Person Involved Staff ID (Optional)
                  </label>
                  <Input
                    type="text"
                    value={localFilters.personInvolvedStaffId || ''}
                    onChange={(e) => handleFilterChange('personInvolvedStaffId', e.target.value || undefined)}
                    placeholder="Enter person involved staff ID..."
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-secondary-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-secondary-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('interactions.clearFilters')}
                </Button>
                <Button
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
