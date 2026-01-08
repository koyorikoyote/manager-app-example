import express from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/auth";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";
import {
  validateRequest,
  commonSchemas,
  systemConfigSchemas,
} from "../middleware/validation";

const router = express.Router();

// GET /api/system-configurations - Get all system configurations
router.get(
  "/",
  authenticateToken,
  validateRequest({ query: systemConfigSchemas.query }),
  async (req, res) => {
    try {
      const {
        category,
        isActive = "true",
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for filtering
      const where: Prisma.SystemConfigurationWhereInput = {};

      if (category && typeof category === "string") {
        where.category = category;
      }

      if (isActive !== "all") {
        where.isActive = isActive === "true";
      }

      // Get total count for pagination
      const total = await prisma.systemConfiguration.count({ where });

      // Get configurations with pagination
      const configurations = await prisma.systemConfiguration.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ category: "asc" }, { key: "asc" }],
        skip,
        take: limitNum,
      });

      res.json({
        success: true,
        data: configurations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching system configurations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch system configurations",
      });
    }
  }
);

// GET /api/system-configurations/categories - Get available categories
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.systemConfiguration.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { isActive: true },
      orderBy: { category: "asc" },
    });

    res.json({
      success: true,
      data: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Error fetching configuration categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configuration categories",
    });
  }
});

// GET /api/system-configurations/:id - Get system configuration by ID
router.get(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId)) {
        throw new ValidationError("Invalid configuration ID");
      }

      const configuration = await prisma.systemConfiguration.findUnique({
        where: { id: configId },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      if (!configuration) {
        throw new NotFoundError("System configuration not found");
      }

      res.json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      console.error("Error fetching system configuration:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch system configuration",
      });
    }
  }
);

// GET /api/system-configurations/key/:key - Get system configuration by key
router.get("/key/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    const configuration = await prisma.systemConfiguration.findUnique({
      where: {
        key,
        isActive: true,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!configuration) {
      throw new NotFoundError("System configuration not found");
    }

    res.json({
      success: true,
      data: configuration,
    });
  } catch (error) {
    console.error("Error fetching system configuration by key:", error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch system configuration",
    });
  }
});

// POST /api/system-configurations - Create new system configuration
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateRequest({ body: systemConfigSchemas.create }),
  async (req, res) => {
    try {
      const {
        key,
        value,
        description,
        category,
        dataType = "STRING",
      } = req.body;

      // Validation is now handled by middleware

      const configuration = await prisma.systemConfiguration.create({
        data: {
          key,
          value,
          description: description || null,
          category,
          dataType,
          createdBy: req.user!.id,
          isActive: true,
        },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: configuration,
        message: "System configuration created successfully",
      });
    } catch (error) {
      console.error("Error creating system configuration:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to create system configuration",
      });
    }
  }
);

// PUT /api/system-configurations/:id - Update system configuration
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateRequest({
    params: commonSchemas.idParam,
    body: systemConfigSchemas.update,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId)) {
        throw new ValidationError("Invalid configuration ID");
      }

      const { key, value, description, category, dataType, isActive } =
        req.body;

      // Validation is now handled by middleware

      // Build update data object
      const updateData: Prisma.SystemConfigurationUpdateInput = {};
      if (key !== undefined) updateData.key = key;
      if (value !== undefined) updateData.value = value;
      if (description !== undefined)
        updateData.description = description || null;
      if (category !== undefined) updateData.category = category;
      if (dataType !== undefined) updateData.dataType = dataType;
      if (isActive !== undefined) updateData.isActive = isActive;

      const configuration = await prisma.systemConfiguration.update({
        where: { id: configId },
        data: updateData,
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        success: true,
        data: configuration,
        message: "System configuration updated successfully",
      });
    } catch (error) {
      console.error("Error updating system configuration:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("System configuration not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to update system configuration",
      });
    }
  }
);

// DELETE /api/system-configurations/:id - Delete system configuration (super admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId)) {
        throw new ValidationError("Invalid configuration ID");
      }

      await prisma.systemConfiguration.delete({
        where: { id: configId },
      });

      res.json({
        success: true,
        message: "System configuration deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting system configuration:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("System configuration not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to delete system configuration",
      });
    }
  }
);

// POST /api/system-configurations/:id/toggle - Toggle configuration active status
router.post(
  "/:id/toggle",
  authenticateToken,
  requireAdmin,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId)) {
        throw new ValidationError("Invalid configuration ID");
      }

      // Get current configuration
      const currentConfig = await prisma.systemConfiguration.findUnique({
        where: { id: configId },
        select: { isActive: true },
      });

      if (!currentConfig) {
        throw new NotFoundError("System configuration not found");
      }

      // Toggle the active status
      const configuration = await prisma.systemConfiguration.update({
        where: { id: configId },
        data: { isActive: !currentConfig.isActive },
        include: {
          creator: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        success: true,
        data: configuration,
        message: `System configuration ${
          configuration.isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error toggling system configuration:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to toggle system configuration",
      });
    }
  }
);

// GET /api/system-configurations/themes - Get available themes from system configuration
router.get("/themes", authenticateToken, async (req, res) => {
  try {
    const themeConfig = await prisma.systemConfiguration.findUnique({
      where: {
        key: "ui.theme.available",
        isActive: true,
      },
    });

    if (!themeConfig) {
      // Return default themes if configuration not found
      const defaultThemes = [
        {
          id: "light-beige",
          name: "Light Beige",
          description: "Warm beige theme with soft tones",
          isDefault: false,
          isActive: true,
        },
        {
          id: "light-blue",
          name: "Light Blue",
          description: "Modern blue theme inspired by contemporary web design",
          isDefault: false,
          isActive: true,
        },
        {
          id: "light-silver",
          name: "Light Silver",
          description:
            "Clean, minimalist design with bluish silver accents and light aesthetics",
          isDefault: false,
          isActive: true,
        },
        {
          id: "glass-blue",
          name: "Glass Blue",
          description:
            "Modern glassmorphism design with blue gradients and frosted glass effects",
          isDefault: true,
          isActive: true,
        },
      ];

      return res.json({
        success: true,
        data: defaultThemes,
      });
    }

    let themes;
    try {
      themes = JSON.parse(themeConfig.value);
    } catch (parseError) {
      console.error("Error parsing theme configuration:", parseError);
      throw new ValidationError("Invalid theme configuration format");
    }

    // Filter only active themes
    const activeThemes = themes.filter((theme: any) => theme.isActive);

    res.json({
      success: true,
      data: activeThemes,
    });
  } catch (error) {
    console.error("Error fetching available themes:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch available themes",
    });
  }
});

export default router;
