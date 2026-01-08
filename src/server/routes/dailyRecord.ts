import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadBufferToS3,
  deleteObjectFromS3,
  keyFromUrlOrPath,
} from "../lib/awsS3";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { dailyRecordEnhancedSchemas } from "../middleware/enhancedValidation";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";
import dailyRecordService from "../services/DailyRecordService";
import dailyRecordRepliesRouter from "./dailyRecordReplies";

const router = express.Router();

// Mount replies router
router.use("/:id/replies", dailyRecordRepliesRouter);

// Configure multer for daily record photo uploads (S3 memory storage)
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
      );
    }
  },
});

// GET /api/daily-record - Get all daily records
router.get("/", authenticateToken, async (req, res) => {
  try {
    const dailyRecords = await dailyRecordService.getDailyRecords();

    res.json({
      success: true,
      data: dailyRecords,
    });
  } catch (error) {
    console.error("Error fetching daily records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily records",
    });
  }
});

// GET /api/daily-record/staff/:staffId - Get daily records by staff ID
router.get("/staff/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const staffIdNum = parseInt(staffId);

    if (isNaN(staffIdNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const dailyRecords = await dailyRecordService.getDailyRecordsByStaff(
      staffIdNum
    );

    res.json({
      success: true,
      data: dailyRecords,
    });
  } catch (error) {
    console.error("Error fetching daily records by staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily records",
    });
  }
});

// GET /api/daily-record/:id - Get daily record by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid daily record ID",
      });
    }

    const dailyRecord = await dailyRecordService.getDailyRecordById(recordId);

    if (!dailyRecord) {
      return res.status(404).json({
        success: false,
        message: "Daily record not found",
      });
    }

    res.json({
      success: true,
      data: dailyRecord,
    });
  } catch (error) {
    console.error("Error fetching daily record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily record",
    });
  }
});

// POST /api/daily-record - Create daily record
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: dailyRecordEnhancedSchemas.create }),
  async (req, res) => {
    try {
      const createData = req.body;

      // Validate required fields
      if (createData.dateOfRecord) {
        createData.dateOfRecord = new Date(createData.dateOfRecord);
      }

      const newRecord = await dailyRecordService.createDailyRecord(createData);

      res.status(201).json({
        success: true,
        data: newRecord,
      });
    } catch (error) {
      console.error("Error creating daily record:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create daily record",
      });
    }
  }
);

// PUT /api/daily-record/:id - Update daily record
router.put(
  "/:id",
  authenticateToken,
  validateRequest({ body: dailyRecordEnhancedSchemas.update }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const recordId = parseInt(id);

      if (isNaN(recordId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid daily record ID",
        });
      }

      const updateData = req.body;

      // Validate required fields if provided
      if (updateData.dateOfRecord) {
        updateData.dateOfRecord = new Date(updateData.dateOfRecord);
      }

      const updatedRecord = await dailyRecordService.updateDailyRecord(
        recordId,
        updateData
      );

      res.json({
        success: true,
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Error updating daily record:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update daily record",
      });
    }
  }
);

// POST /api/daily-record/:id/photo - Upload photo for daily record
router.post(
  "/:id/photo",
  authenticateToken,
  photoUpload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const recordId = parseInt(id);

      if (isNaN(recordId)) {
        throw new ValidationError("Invalid daily record ID");
      }

      if (!req.file) {
        throw new ValidationError("No photo file uploaded");
      }

      // Verify daily record exists
      const record = await dailyRecordService.getDailyRecordById(recordId);

      if (!record) {
        throw new NotFoundError("Daily record not found");
      }

      // Delete old photo from S3 if it exists
      if (record.photo) {
        const oldKey = keyFromUrlOrPath(record.photo);
        await deleteObjectFromS3(oldKey).catch(() => {});
      }

      // Upload new photo to S3 and update record with URL
      const ext = path.extname(req.file.originalname);
      const key = `uploads/daily-records/daily-record-${Date.now()}-${uuidv4()}${ext}`;
      const photoUrl = await uploadBufferToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });
      const updatedRecord = await dailyRecordService.updateDailyRecord(
        recordId,
        {
          photo: photoUrl,
        }
      );

      res.json({
        success: true,
        data: { photoUrl, record: updatedRecord },
        message: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading daily record photo:", error);

      // No local file cleanup needed when using memoryStorage + S3.

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to upload photo",
      });
    }
  }
);

// DELETE /api/daily-record/:id/photo - Delete daily record photo
router.delete("/:id/photo", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);

    if (isNaN(recordId) || recordId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid daily record ID",
        message: "Daily record ID must be a positive integer",
      });
    }

    // Verify daily record exists and has a photo
    const record = await dailyRecordService.getDailyRecordById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Daily record not found",
        message: `Daily record with ID ${recordId} does not exist`,
      });
    }

    if (!record.photo) {
      return res.status(400).json({
        success: false,
        error: "No photo to delete",
        message: "Daily record does not have a photo",
      });
    }

    // Delete photo from S3
    const key = keyFromUrlOrPath(record.photo);
    await deleteObjectFromS3(key).catch(() => {
      console.warn(`Failed to delete S3 object: ${key}`);
    });

    // Update daily record to remove photo
    const updatedRecord = await dailyRecordService.updateDailyRecord(recordId, {
      photo: null,
    });

    res.json({
      success: true,
      message: "Daily record photo deleted successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error deleting daily record photo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete photo",
      message: "An error occurred while deleting the daily record photo",
    });
  }
});

// POST /api/daily-record/bulk-delete - Bulk delete daily records
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

    // Delete daily records using the service
    const deletedCount = await dailyRecordService.bulkDeleteDailyRecords(
      validIds
    );

    res.json({ deletedCount });
  } catch (error: unknown) {
    console.error("Error bulk deleting daily records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
