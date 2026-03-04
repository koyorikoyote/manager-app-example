import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadBufferToStorage as uploadBufferToDrive,
  deleteFileFromStorage as deleteFileFromDrive,
  fileKeyFromUrl as fileIdFromUrl,
} from "../lib/cloudStorage";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
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

      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `daily-record-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const fileUrl = await uploadBufferToDrive({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        filename,
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
      await deleteFileFromDrive(fileIdFromUrl(filename) ?? filename).catch(() => { });

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

// POST /api/upload/companies - Upload photo for company/destination
router.post(
  "/companies",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `company-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const fileUrl = await uploadBufferToDrive({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        filename,
      });

      res.json({ success: true, filePath: fileUrl, message: "Photo uploaded successfully" });
    } catch (error) {
      console.error("Error uploading company photo:", error);
      res.status(500).json({ success: false, message: "Failed to upload photo" });
    }
  }
);

// POST /api/upload/properties - Upload photo for property
router.post(
  "/properties",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `property-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const fileUrl = await uploadBufferToDrive({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        filename,
      });

      res.json({ success: true, filePath: fileUrl, message: "Photo uploaded successfully" });
    } catch (error) {
      console.error("Error uploading property photo:", error);
      res.status(500).json({ success: false, message: "Failed to upload photo" });
    }
  }
);

export default router;
