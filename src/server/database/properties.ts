import { PrismaClient } from '@prisma/client';
import { Property } from '../../shared/types';

const prisma = new PrismaClient();

// Convert Prisma Property to our Property interface
function convertPrismaProperty(prismaProperty: any): Property {
  return {
    id: prismaProperty.id,
    propertyCode: prismaProperty.propertyCode,
    name: prismaProperty.name,
    address: prismaProperty.address,
    propertyType: prismaProperty.propertyType,
    managerId: prismaProperty.managerId,
    status: prismaProperty.status,
    description: prismaProperty.description,
    createdAt: prismaProperty.createdAt,
    updatedAt: prismaProperty.updatedAt,
    manager: prismaProperty.manager,
  };
}

export const propertyService = {
  async getAllProperties(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{ properties: Property[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { propertyCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          manager: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const convertedProperties = properties.map(convertPrismaProperty);

    return {
      properties: convertedProperties,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return null;
    }

    const property = await prisma.property.findUnique({
      where: { id: numericId },
      include: {
        manager: {
          include: {
            role: true,
          },
        },
      },
    });

    if (property) {
      return convertPrismaProperty(property);
    }

    return null;
  },

  async createProperty(
    propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Property> {
    const property = await prisma.property.create({
      data: {
        propertyCode: propertyData.propertyCode,
        name: propertyData.name,
        address: propertyData.address,
        propertyType: propertyData.propertyType,
        managerId: propertyData.managerId,
        status: propertyData.status,
        description: propertyData.description,
      },
      include: {
        manager: {
          include: {
            role: true,
          },
        },
      },
    });

    return convertPrismaProperty(property);
  },

  async updateProperty(
    id: string,
    propertyData: Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Property | null> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return null;
    }

    try {
      const updatedProperty = await prisma.property.update({
        where: { id: numericId },
        data: {
          propertyCode: propertyData.propertyCode,
          name: propertyData.name,
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          managerId: propertyData.managerId,
          status: propertyData.status,
          description: propertyData.description,
        },
        include: {
          manager: {
            include: {
              role: true,
            },
          },
        },
      });

      return convertPrismaProperty(updatedProperty);
    } catch (error) {
      return null;
    }
  },

  async deleteProperty(id: string): Promise<boolean> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return false;
    }

    try {
      await prisma.property.delete({
        where: { id: numericId },
      });
      return true;
    } catch (error) {
      return false;
    }
  },
};