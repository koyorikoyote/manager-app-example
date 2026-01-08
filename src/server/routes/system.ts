import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ValidationError } from "../middleware/errorHandler";
import photoCleanupService from "../services/PhotoCleanupService";

const router = express.Router();

// GET /api/system/themes - Get available themes from system configuration
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
          isDefault: true,
          isActive: true,
        },
        {
          id: "light-blue",
          name: "Light Blue",
          description: "Modern blue theme inspired by contemporary web design",
          isDefault: false,
          isActive: true,
        },
      ];

      return res.json({
        success: true,
        data: defaultThemes,
      });
    }

    let themes: any[];
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

// GET /api/system/photo-statistics - Get photo usage statistics
router.get(
  "/photo-statistics",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const statistics = await photoCleanupService.getPhotoStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Error fetching photo statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch photo statistics",
      });
    }
  }
);

// POST /api/system/cleanup-orphaned-photos - Clean up orphaned photo files
router.post(
  "/cleanup-orphaned-photos",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await photoCleanupService.cleanupAllOrphanedPhotos();

      res.json({
        success: true,
        data: result,
        message: `Cleanup completed: ${result.summary.totalDeleted} files deleted, ${result.summary.totalErrors} errors`,
      });
    } catch (error) {
      console.error("Error cleaning up orphaned photos:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup orphaned photos",
      });
    }
  }
);

// GET /api/system/verify-photo-integrity - Verify photo file integrity
router.get(
  "/verify-photo-integrity",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const integrity = await photoCleanupService.verifyPhotoIntegrity();

      res.json({
        success: true,
        data: integrity,
      });
    } catch (error) {
      console.error("Error verifying photo integrity:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify photo integrity",
      });
    }
  }
);

// POST /api/system/cleanup-missing-photo-references - Clean up database references to missing photos
router.post(
  "/cleanup-missing-photo-references",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await photoCleanupService.cleanupMissingPhotoReferences();

      res.json({
        success: true,
        data: result,
        message: `Database cleanup completed: ${result.dailyRecordsUpdated} daily records updated, ${result.staffUpdated} staff records updated`,
      });
    } catch (error) {
      console.error("Error cleaning up missing photo references:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup missing photo references",
      });
    }
  }
);

export default router;
