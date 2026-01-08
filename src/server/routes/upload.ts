import express from "express";
import multer from "multer";
import path from "path";
import { uploadBufferToS3, deleteObjectFromS3 } from "../lib/awsS3";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Configure multer for file uploads to S3 (memory storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP) are allowed"));
    }
  },
});

// POST /api/upload/daily-records - Upload photo for daily record
router.post(
  "/daily-records",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Upload buffer to S3 and return public URL
      const ext = path.extname(req.file.originalname);
      const key = `uploads/daily-records/daily-record-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`;

      const fileUrl = await uploadBufferToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      res.json({
        success: true,
        filePath: fileUrl,
        message: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload photo",
      });
    }
  }
);

// DELETE /api/upload/daily-records/:filename - Delete photo
router.delete(
  "/daily-records/:filename",
  authenticateToken,
  async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);

      // Extract just the filename from the path if it's a full path
      const actualFilename = path.basename(filename);
      const key = `uploads/daily-records/${actualFilename}`;

      // Attempt to delete from S3 (idempotent)
      await deleteObjectFromS3(key).catch(() => {});

      res.json({
        success: true,
        message: "Photo deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete photo",
      });
    }
  }
);

export default router;
