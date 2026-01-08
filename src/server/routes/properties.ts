import express from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";

const router = express.Router();

// GET /api/properties - Get all properties with optional filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      type,
      status = "ACTIVE",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: Prisma.PropertyWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as "ACTIVE" | "INACTIVE";
    }

    if (type && typeof type === "string") {
      where.propertyType = type as
        | "RESIDENTIAL"
        | "COMMERCIAL"
        | "INDUSTRIAL"
        | "MIXED_USE";
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { propertyCode: { contains: search } },
        { address: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.property.count({ where });

    // Get properties with pagination
    const properties = await prisma.property.findMany({
      where,
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        staffAssignments: {
          where: { isActive: true },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
    });
  }
});

// GET /api/properties/:id - Get property by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        manager: {
          select: { id: true, name: true, email: true, role: true },
        },
        staffAssignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
                department: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch property",
    });
  }
});

// GET /api/properties/:id/staff - Get staff assigned to property
router.get("/:id/staff", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Get staff assignments for this property
    const assignments = await prisma.propertyStaffAssignment.findMany({
      where: { propertyId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
            department: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    res.json({
      success: true,
      data: {
        property,
        assignments,
      },
    });
  } catch (error) {
    console.error("Error fetching property staff:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch property staff",
    });
  }
});

// GET /api/properties/:id/documents - Get documents associated with property
router.get("/:id/documents", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Get documents related to this property
    const documents = await prisma.document.findMany({
      where: {
        propertyId: propertyId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching property documents:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch property documents",
    });
  }
});

// POST /api/properties - Create new property
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      propertyCode,
      name,
      address,
      propertyType,
      managerId,
      description,
      // New header fields
      photo,
      furiganaName,
      contractDate,
      establishmentDate,
      // New property information fields
      postalCode,
      country,
      region,
      prefecture,
      city,
      owner,
      ownerPhone,
      ownerEmail,
      ownerFax,
    } = req.body;

    // Validate required fields
    if (!propertyCode || !name || !address || !propertyType) {
      throw new ValidationError(
        "Property code, name, address, and property type are required fields"
      );
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: parseInt(managerId) },
      });
      if (!manager) {
        throw new ValidationError("Manager not found");
      }
    }

    const property = await prisma.property.create({
      data: {
        propertyCode,
        name,
        address,
        propertyType,
        managerId: managerId ? parseInt(managerId) : null,
        description: description || null,
        status: "ACTIVE",
        // New header fields
        photo: photo || null,
        furiganaName: furiganaName || null,
        establishmentDate: establishmentDate
          ? new Date(establishmentDate)
          : null,
        contractDate: contractDate ? new Date(contractDate) : null,
        // New property information fields
        postalCode: postalCode || null,
        country: country || null,
        region: region || null,
        prefecture: prefecture || null,
        city: city || null,
        owner: owner || null,
        ownerPhone: ownerPhone || null,
        ownerEmail: ownerEmail || null,
        ownerFax: ownerFax || null,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: property,
      message: "Property created successfully",
    });
  } catch (error) {
    console.error("Error creating property:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to create property",
    });
  }
});

// PUT /api/properties/:id - Update property
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    const {
      propertyCode,
      name,
      address,
      propertyType,
      managerId,
      description,
      status,
      // New header fields
      photo,
      furiganaName,
      contractDate,
      establishmentDate,
      // New property information fields
      postalCode,
      country,
      region,
      prefecture,
      city,
      owner,
      ownerPhone,
      ownerEmail,
      ownerFax,
    } = req.body;

    // Validate manager if provided
    if (managerId && managerId !== null) {
      const manager = await prisma.user.findUnique({
        where: { id: parseInt(managerId) },
      });
      if (!manager) {
        throw new ValidationError("Manager not found");
      }
    }

    // Build update data object
    const updateData: Prisma.PropertyUpdateInput = {};
    if (propertyCode !== undefined) updateData.propertyCode = propertyCode;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (managerId !== undefined) {
      if (managerId === null) {
        updateData.manager = { disconnect: true };
      } else {
        updateData.manager = { connect: { id: parseInt(managerId) } };
      }
    }
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;

    // New header fields
    if (photo !== undefined) updateData.photo = photo || null;
    if (furiganaName !== undefined)
      updateData.furiganaName = furiganaName || null;
    if (establishmentDate !== undefined)
      updateData.establishmentDate = establishmentDate
        ? new Date(establishmentDate)
        : null;
    if (contractDate !== undefined)
      updateData.contractDate = contractDate ? new Date(contractDate) : null;

    // New property information fields
    if (postalCode !== undefined) updateData.postalCode = postalCode || null;
    if (country !== undefined) updateData.country = country || null;
    if (region !== undefined) updateData.region = region || null;
    if (prefecture !== undefined) updateData.prefecture = prefecture || null;
    if (city !== undefined) updateData.city = city || null;
    if (owner !== undefined) updateData.owner = owner || null;
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone || null;
    if (ownerEmail !== undefined) updateData.ownerEmail = ownerEmail || null;
    if (ownerFax !== undefined) updateData.ownerFax = ownerFax || null;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        staffAssignments: {
          where: { isActive: true },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: property,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Property not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to update property",
    });
  }
});

// DELETE /api/properties/:id - Soft delete property (set status to INACTIVE)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    // Soft delete by updating status to INACTIVE
    const _property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: "INACTIVE",
        // Also deactivate any active staff assignments
        staffAssignments: {
          updateMany: {
            where: { isActive: true },
            data: {
              isActive: false,
              endDate: new Date(),
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Property deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating property:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Property not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to deactivate property",
    });
  }
});

// POST /api/properties/:propertyId/documents/:documentId - Associate document with property
router.post(
  "/:propertyId/documents/:documentId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { propertyId, documentId } = req.params;
      const propertyIdNum = parseInt(propertyId);
      const documentIdNum = parseInt(documentId);

      if (isNaN(propertyIdNum) || isNaN(documentIdNum)) {
        throw new ValidationError("Invalid property or document ID");
      }

      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyIdNum },
      });

      if (!property) {
        throw new NotFoundError("Property not found");
      }

      // Verify document exists
      const document = await prisma.document.findUnique({
        where: { id: documentIdNum },
      });

      if (!document) {
        throw new NotFoundError("Document not found");
      }

      // Update document to associate with property
      await prisma.document.update({
        where: { id: documentIdNum },
        data: {
          propertyId: propertyIdNum,
          type: "PROPERTY",
        },
      });

      // Return updated property
      const updatedProperty = await prisma.property.findUnique({
        where: { id: propertyIdNum },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          staffAssignments: {
            where: { isActive: true },
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  employeeId: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedProperty,
        message: "Document associated with property successfully",
      });
    } catch (error) {
      console.error("Error associating document with property:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to associate document with property",
      });
    }
  }
);

// DELETE /api/properties/:propertyId/documents/:documentId - Remove document association from property
router.delete(
  "/:propertyId/documents/:documentId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { propertyId, documentId } = req.params;
      const propertyIdNum = parseInt(propertyId);
      const documentIdNum = parseInt(documentId);

      if (isNaN(propertyIdNum) || isNaN(documentIdNum)) {
        throw new ValidationError("Invalid property or document ID");
      }

      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyIdNum },
      });

      if (!property) {
        throw new NotFoundError("Property not found");
      }

      // Update document to remove property association
      await prisma.document.update({
        where: { id: documentIdNum },
        data: {
          propertyId: null,
          type: "COMPANY", // Default to company type when removing property association
        },
      });

      // Return updated property
      const updatedProperty = await prisma.property.findUnique({
        where: { id: propertyIdNum },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          staffAssignments: {
            where: { isActive: true },
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  employeeId: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedProperty,
        message: "Document association removed from property successfully",
      });
    } catch (error) {
      console.error("Error removing document from property:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to remove document from property",
      });
    }
  }
);

// POST /api/properties/:id/photo - Upload property photo
router.post("/:id/photo", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw new ValidationError("Invalid property ID");
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // For now, we'll accept the photo URL/path in the request body
    // In a real implementation, you would handle file upload here
    const { photoUrl } = req.body;

    if (!photoUrl) {
      throw new ValidationError("Photo URL is required");
    }

    // Update property with new photo
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: { photo: photoUrl },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      data: updatedProperty,
      message: "Property photo updated successfully",
    });
  } catch (error) {
    console.error("Error uploading property photo:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to upload property photo",
    });
  }
});

// POST /api/properties/bulk-delete - Bulk delete properties
router.post("/bulk-delete", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }

    // Validate all IDs are numbers
    const validIds = ids.filter((id) => typeof id === "number" && !isNaN(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ error: "All IDs must be valid numbers" });
    }

    // Hard delete properties from database
    const result = await prisma.property.deleteMany({
      where: {
        id: {
          in: validIds,
        },
      },
    });

    res.json({ deletedCount: result.count });
  } catch (error: unknown) {
    console.error("Error bulk deleting properties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
