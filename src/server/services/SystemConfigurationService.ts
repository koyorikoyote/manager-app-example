import { PrismaClient, Prisma, ConfigDataType } from '@prisma/client';
import prisma from '../lib/prisma';

export interface SystemConfigFilters {
  category?: string;
  isActive?: boolean;
  dataType?: ConfigDataType;
  search?: string;
}

export interface SystemConfigCreateData {
  key: string;
  value: string;
  description?: string;
  category: string;
  dataType?: ConfigDataType;
  isActive?: boolean;
  createdBy: number;
}

export interface SystemConfigUpdateData {
  value?: string;
  description?: string;
  category?: string;
  dataType?: ConfigDataType;
  isActive?: boolean;
}

export class SystemConfigurationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all system configurations with optional filtering
   */
  async getAllConfigurations(filters?: SystemConfigFilters) {
    const where: Prisma.SystemConfigurationWhereInput = {};

    if (filters?.category) {
      where.category = {
        contains: filters.category
      };
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.dataType) {
      where.dataType = filters.dataType;
    }

    if (filters?.search) {
      where.OR = [
        { key: { contains: filters.search } },
        { value: { contains: filters.search } },
        { description: { contains: filters.search } },
        { category: { contains: filters.search } }
      ];
    }

    return this.prisma.systemConfiguration.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });
  }

  /**
   * Get configuration by ID
   */
  async getConfigurationById(id: number) {
    return this.prisma.systemConfiguration.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Get configuration by key
   */
  async getConfigurationByKey(key: string) {
    return this.prisma.systemConfiguration.findUnique({
      where: { key },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Get configurations by category
   */
  async getConfigurationsByCategory(category: string, activeOnly = true) {
    const where: Prisma.SystemConfigurationWhereInput = {
      category
    };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.systemConfiguration.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        key: 'asc'
      }
    });
  }

  /**
   * Create new system configuration
   */
  async createConfiguration(data: SystemConfigCreateData) {
    return this.prisma.systemConfiguration.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        dataType: data.dataType || ConfigDataType.STRING,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Update system configuration
   */
  async updateConfiguration(id: number, data: SystemConfigUpdateData) {
    const updateData: Prisma.SystemConfigurationUpdateInput = {};

    if (data.value !== undefined) updateData.value = data.value;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.dataType !== undefined) updateData.dataType = data.dataType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.systemConfiguration.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Delete system configuration (soft delete by setting isActive to false)
   */
  async deleteConfiguration(id: number) {
    return this.prisma.systemConfiguration.update({
      where: { id },
      data: {
        isActive: false
      }
    });
  }

  /**
   * Get configuration value by key with type conversion
   */
  async getConfigValue<T = string>(key: string): Promise<T | null> {
    const config = await this.prisma.systemConfiguration.findUnique({
      where: { 
        key,
        isActive: true
      },
      select: {
        value: true,
        dataType: true
      }
    });

    if (!config) {
      return null;
    }

    return this.convertValue<T>(config.value, config.dataType);
  }

  /**
   * Set configuration value with automatic type detection
   */
  async setConfigValue(key: string, value: string | number | boolean | object, createdBy: number, category = 'general') {
    const dataType = this.detectDataType(value);
    const stringValue = this.convertToString(value, dataType);

    return this.prisma.systemConfiguration.upsert({
      where: { key },
      update: {
        value: stringValue,
        dataType
      },
      create: {
        key,
        value: stringValue,
        category,
        dataType,
        createdBy,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get all configuration categories
   */
  async getCategories() {
    const categories = await this.prisma.systemConfiguration.groupBy({
      by: ['category'],
      where: {
        isActive: true
      },
      _count: {
        id: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.id
    }));
  }

  /**
   * Bulk update configurations with transaction support
   */
  async bulkUpdateConfigurations(updates: Array<{
    key: string;
    value: string;
    dataType?: ConfigDataType;
  }>) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const update of updates) {
        const result = await tx.systemConfiguration.update({
          where: { key: update.key },
          data: {
            value: update.value,
            dataType: update.dataType
          }
        });
        results.push(result);
      }
      
      return results;
    });
  }

  /**
   * Export configurations for backup
   */
  async exportConfigurations(category?: string) {
    const where: Prisma.SystemConfigurationWhereInput = {
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    return this.prisma.systemConfiguration.findMany({
      where,
      select: {
        key: true,
        value: true,
        description: true,
        category: true,
        dataType: true
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });
  }

  /**
   * Import configurations from backup with transaction support
   */
  async importConfigurations(
    configurations: Array<{
      key: string;
      value: string;
      description?: string;
      category: string;
      dataType: ConfigDataType;
    }>,
    createdBy: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const config of configurations) {
        const result = await tx.systemConfiguration.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            description: config.description,
            category: config.category,
            dataType: config.dataType,
            isActive: true
          },
          create: {
            key: config.key,
            value: config.value,
            description: config.description,
            category: config.category,
            dataType: config.dataType,
            createdBy,
            isActive: true
          }
        });
        results.push(result);
      }
      
      return results;
    });
  }

  /**
   * Convert string value to appropriate type based on dataType
   */
  private convertValue<T>(value: string, dataType: ConfigDataType): T {
    switch (dataType) {
      case ConfigDataType.NUMBER:
        return Number(value) as T;
      case ConfigDataType.BOOLEAN:
        return (value.toLowerCase() === 'true') as T;
      case ConfigDataType.JSON:
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      case ConfigDataType.STRING:
      default:
        return value as T;
    }
  }

  /**
   * Detect data type from value
   */
  private detectDataType(value: string | number | boolean | object): ConfigDataType {
    if (typeof value === 'boolean') {
      return ConfigDataType.BOOLEAN;
    }
    if (typeof value === 'number') {
      return ConfigDataType.NUMBER;
    }
    if (typeof value === 'object' && value !== null) {
      return ConfigDataType.JSON;
    }
    return ConfigDataType.STRING;
  }

  /**
   * Convert value to string for storage
   */
  private convertToString(value: string | number | boolean | object, dataType: ConfigDataType): string {
    switch (dataType) {
      case ConfigDataType.JSON:
        return JSON.stringify(value);
      case ConfigDataType.BOOLEAN:
      case ConfigDataType.NUMBER:
        return String(value);
      case ConfigDataType.STRING:
      default:
        return String(value);
    }
  }
}

export default new SystemConfigurationService();