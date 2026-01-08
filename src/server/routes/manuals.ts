import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "manuals");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// In-memory manual store (replace with database in production)
interface Manual {
  id: string;
  name: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

let manuals: Manual[] = [];

// Load existing manuals from filesystem on startup
const loadExistingManuals = async () => {
  try {
    const manualsDir = path.join(process.cwd(), "uploads", "manuals");
    const metadataFile = path.join(manualsDir, "metadata.json");

    try {
      const metadata = await fs.readFile(metadataFile, "utf-8");
      manuals = JSON.parse(metadata);
    } catch {
      // If metadata file doesn't exist, start with empty array
      manuals = [];
    }
  } catch (_error) {
    console.error("Error loading existing manuals:", _error);
  }
};

// Save manuals metadata to filesystem
const saveManualsMetadata = async () => {
  try {
    const manualsDir = path.join(process.cwd(), "uploads", "manuals");
    await fs.mkdir(manualsDir, { recursive: true });
    const metadataFile = path.join(manualsDir, "metadata.json");
    await fs.writeFile(metadataFile, JSON.stringify(manuals, null, 2));
  } catch (_error) {
    console.error("Error saving manuals metadata:", _error);
  }
};

// Initialize manuals on startup
loadExistingManuals();

// Get all manuals
router.get("/", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      manuals: manuals.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ),
    });
  } catch (error) {
    console.error("Error fetching manuals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manuals",
    });
  }
});

// Upload manual
router.post(
  "/upload",
  authenticateToken,
  upload.single("manual"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const manual: Manual = {
        id: uuidv4(),
        name: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
        uploadedAt: toJSTISOString(new Date()),
        uploadedBy: req.user?.name || "Unknown User",
      };

      manuals.push(manual);
      await saveManualsMetadata();

      res.json({
        success: true,
        message: "Manual uploaded successfully",
        manual,
      });
    } catch (error) {
      console.error("Error uploading manual:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload manual",
      });
    }
  }
);

// Download manual
router.get("/:id/download", authenticateToken, async (req, res) => {
  try {
    const manual = manuals.find((doc) => doc.id === req.params.id);

    if (!manual) {
      return res.status(404).json({
        success: false,
        message: "Manual not found",
      });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "manuals",
      manual.filename
    );

    try {
      await fs.access(filePath);
      res.download(filePath, manual.name);
    } catch {
      res.status(404).json({
        success: false,
        message: "File not found on disk",
      });
    }
  } catch (error) {
    console.error("Error downloading manual:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download manual",
    });
  }
});

// Delete manual
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const manualIndex = manuals.findIndex((doc) => doc.id === req.params.id);

    if (manualIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Manual not found",
      });
    }

    const manual = manuals[manualIndex];
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "manuals",
      manual.filename
    );

    // Remove file from filesystem
    try {
      await fs.unlink(filePath);
    } catch {
      console.warn("File not found on disk, continuing with metadata removal");
    }

    // Remove from manuals array
    manuals.splice(manualIndex, 1);
    await saveManualsMetadata();

    res.json({
      success: true,
      message: "Manual deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting manual:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete manual",
    });
  }
});

export default router;
