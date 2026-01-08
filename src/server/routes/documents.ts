import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadBufferToS3,
  deleteObjectFromS3,
  keyFromUrlOrPath,
} from "../lib/awsS3";
import { documentsDb } from "../database/documents";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Configure multer for file uploads to S3 (memory storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/documents - Get all documents with optional filtering
router.get("/", async (req, res) => {
  try {
    const { search, type, status, page, limit } = req.query;

    const params = {
      search: search as string,
      type: type as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await documentsDb.getAll(params);
    res.json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
});

// GET /api/documents/staff/:staffId - Get documents by staff ID
router.get("/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    const documents = await documentsDb.getByStaffId(staffId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching staff documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff documents",
    });
  }
});

// GET /api/documents/:id - Get document by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentsDb.getById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch document",
    });
  }
});

// POST /api/documents - Create new document
router.post("/", async (req, res) => {
  try {
    const documentData = req.body;

    // Validate required fields
    if (
      !documentData.title ||
      !documentData.type ||
      !documentData.relatedEntityId ||
      !documentData.status ||
      !documentData.startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: title, type, relatedEntityId, status, startDate",
      });
    }

    // Convert date strings to Date objects
    documentData.startDate = new Date(documentData.startDate);
    if (documentData.endDate) {
      documentData.endDate = new Date(documentData.endDate);
    }

    const document = await documentsDb.create(documentData);
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create document",
    });
  }
});

// PUT /api/documents/:id - Update document
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert date strings to Date objects if present
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const document = await documentsDb.update(id, updates);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update document",
    });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get document to check if it has a file
    const document = await documentsDb.getById(id);
    if (document?.filePath) {
      const key = keyFromUrlOrPath(document.filePath);
      await deleteObjectFromS3(key).catch(() => {});
    }

    const deleted = await documentsDb.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
});

// POST /api/documents/:id/upload - Upload document file
router.post("/:id/upload", upload.single("document"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload PDF to S3 and update document with public URL
    const ext = path.extname(req.file.originalname) || ".pdf";
    const key = `uploads/documents/document-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    const fileUrl = await uploadBufferToS3({
      key,
      buffer: req.file.buffer,
      contentType: req.file.mimetype || "application/pdf",
    });

    const document = await documentsDb.update(id, { filePath: fileUrl });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      data: { filePath: fileUrl },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
});

// GET /api/documents/files/:filePath - Legacy local serving removed (S3 used now)
router.get("/files/:filename", (_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Direct file serving disabled. Use the stored document URL.",
  });
});

export default router;
