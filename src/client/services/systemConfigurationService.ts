import { SystemConfiguration } from '../../shared/types';

const API_BASE = '/api/system-configurations';

export interface SystemConfigurationSearchParams {
  category?: string;
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
}

export interface SystemConfigurationListResponse {
  success: boolean;
  data: SystemConfiguration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SystemConfigurationResponse {
  success: boolean;
  data: SystemConfiguration;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

class SystemConfigurationService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAllConfigurations(params: SystemConfigurationSearchParams = {}): Promise<SystemConfigurationListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.category) {
      searchParams.append('category', params.category);
    }
    
    if (params.isActive !== undefined) {
      searchParams.append('isActive', params.isActive === 'all' ? 'all' : params.isActive.toString());
    }
    
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }
    
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
    return this.request<SystemConfigurationListResponse>(url);
  }

  async getConfigurationById(id: number): Promise<SystemConfigurationResponse> {
    return this.request<SystemConfigurationResponse>(`${API_BASE}/${id}`);
  }

  async getConfigurationByKey(key: string): Promise<SystemConfigurationResponse> {
    return this.request<SystemConfigurationResponse>(`${API_BASE}/key/${key}`);
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>(`${API_BASE}/categories`);
  }

  async createConfiguration(configData: {
    key: string;
    value: string;
    description?: string;
    category: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  }): Promise<SystemConfigurationResponse> {
    return this.request<SystemConfigurationResponse>(API_BASE, {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  async updateConfiguration(id: number, configData: {
    key?: string;
    value?: string;
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isActive?: boolean;
  }): Promise<SystemConfigurationResponse> {
    return this.request<SystemConfigurationResponse>(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  async deleteConfiguration(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleConfiguration(id: number): Promise<SystemConfigurationResponse> {
    return this.request<SystemConfigurationResponse>(`${API_BASE}/${id}/toggle`, {
      method: 'POST',
    });
  }
}

export const systemConfigurationService = new SystemConfigurationService();