import { useState, useEffect, useCallback } from 'react';
import { SystemConfiguration } from '../../shared/types';
import { 
  systemConfigurationService, 
  SystemConfigurationSearchParams 
} from '../services/systemConfigurationService';

export interface UseSystemConfigurationsResult {
  configurations: SystemConfiguration[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  searchConfigurations: (params: SystemConfigurationSearchParams) => Promise<void>;
  refreshConfigurations: () => Promise<void>;
  createConfiguration: (configData: {
    key: string;
    value: string;
    description?: string;
    category: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  }) => Promise<SystemConfiguration>;
  updateConfiguration: (id: number, configData: {
    key?: string;
    value?: string;
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isActive?: boolean;
  }) => Promise<SystemConfiguration>;
  deleteConfiguration: (id: number) => Promise<void>;
  toggleConfiguration: (id: number) => Promise<SystemConfiguration>;
}

interface UseSystemConfigurationsOptions {
  initialConfigurations?: SystemConfiguration[];
  initialSearch?: SystemConfigurationSearchParams;
}

export const useSystemConfigurations = (
  options: UseSystemConfigurationsOptions = {}
): UseSystemConfigurationsResult => {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>(
    options.initialConfigurations || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const searchConfigurations = useCallback(async (params: SystemConfigurationSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.getAllConfigurations(params);
      if (result.success) {
        setConfigurations(result.data);
        setPagination(result.pagination);
      } else {
        throw new Error('Failed to fetch configurations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.getAllConfigurations();
      if (result.success) {
        setConfigurations(result.data);
        setPagination(result.pagination);
      } else {
        throw new Error('Failed to fetch configurations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConfiguration = useCallback(async (configData: {
    key: string;
    value: string;
    description?: string;
    category: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.createConfiguration(configData);
      if (result.success) {
        setConfigurations(prev => [result.data, ...prev]);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfiguration = useCallback(async (id: number, configData: {
    key?: string;
    value?: string;
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isActive?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.updateConfiguration(id, configData);
      if (result.success) {
        setConfigurations(prev => prev.map(config => 
          config.id === id ? result.data : config
        ));
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConfiguration = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.deleteConfiguration(id);
      if (result.success) {
        setConfigurations(prev => prev.filter(config => config.id !== id));
      } else {
        throw new Error(result.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleConfiguration = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.toggleConfiguration(id);
      if (result.success) {
        setConfigurations(prev => prev.map(config => 
          config.id === id ? result.data : config
        ));
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to toggle configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData = options.initialConfigurations && options.initialConfigurations.length > 0;
    
    if (!hasInitialData) {
      if (options.initialSearch) {
        searchConfigurations(options.initialSearch);
      } else {
        refreshConfigurations();
      }
    }
  }, []);

  return {
    configurations,
    loading,
    error,
    pagination,
    searchConfigurations,
    refreshConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    toggleConfiguration,
  };
};

export interface UseSystemConfigurationDetailResult {
  configuration: SystemConfiguration | null;
  loading: boolean;
  error: string | null;
  refreshConfiguration: () => Promise<void>;
  updateConfiguration: (configData: {
    key?: string;
    value?: string;
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isActive?: boolean;
  }) => Promise<SystemConfiguration>;
  deleteConfiguration: () => Promise<void>;
  toggleConfiguration: () => Promise<SystemConfiguration>;
}

interface UseSystemConfigurationDetailOptions {
  initialConfiguration?: SystemConfiguration | null;
}

export const useSystemConfigurationDetail = (
  id: number, 
  options: UseSystemConfigurationDetailOptions = {}
): UseSystemConfigurationDetailResult => {
  const [configuration, setConfiguration] = useState<SystemConfiguration | null>(
    options.initialConfiguration || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConfiguration = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.getConfigurationById(id);
      if (result.success) {
        setConfiguration(result.data);
      } else {
        throw new Error('Failed to fetch configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateConfiguration = useCallback(async (configData: {
    key?: string;
    value?: string;
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isActive?: boolean;
  }) => {
    if (!id) throw new Error('No configuration ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.updateConfiguration(id, configData);
      if (result.success) {
        setConfiguration(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const deleteConfiguration = useCallback(async () => {
    if (!id) throw new Error('No configuration ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.deleteConfiguration(id);
      if (result.success) {
        setConfiguration(null);
      } else {
        throw new Error(result.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const toggleConfiguration = useCallback(async () => {
    if (!id) throw new Error('No configuration ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await systemConfigurationService.toggleConfiguration(id);
      if (result.success) {
        setConfiguration(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to toggle configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData = options.initialConfiguration !== undefined;
    
    if (!hasInitialData) {
      refreshConfiguration();
    }
  }, [refreshConfiguration]);

  return {
    configuration,
    loading,
    error,
    refreshConfiguration,
    updateConfiguration,
    deleteConfiguration,
    toggleConfiguration,
  };
};