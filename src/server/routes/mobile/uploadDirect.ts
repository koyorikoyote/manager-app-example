import express from "express";
import multer from "multer";
import { authenticateMobile } from "../../middleware/authMobile";
import { uploadBufferToS3 } from "../../lib/awsS3";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * POST /api/mobile/uploads/daily-records
 * Upload photo for daily records through backend (bypasses CORS)
 * Body: multipart/form-data with 'photo' field
 * Returns: { success, data: { filePath } }
 */
router.post(
  "/daily-records",
  authenticateMobile,
  upload.single("photo"),
  async (req, res) => {
    try {
      const mobileUser = (req as any).mobileUser as { id: number };

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No photo file provided" });
      }

      // Generate unique filename
      const now = Date.now();
      const random = Math.floor(Math.random() * 1e9);
      const ext = req.file.mimetype.split("/")[1] || "jpg";
      const key = `uploads/mobile/${mobileUser.id}/daily-records/${now}-${random}.${ext}`;

      // Upload to S3
      const publicUrl = await uploadBufferToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      return res.json({
        success: true,
        data: {
          filePath: publicUrl,
        },
      });
    } catch (err) {
      console.error("Direct upload error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to upload photo",
      });
    }
  }
);

export default router;
