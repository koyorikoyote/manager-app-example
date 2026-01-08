import express from "express";
import { authenticateToken } from "../middleware/auth";
// import { ValidationError, NotFoundError } from "../middleware/errorHandler";
import inquiryService, { InquiryUpdateData } from "../services/InquiryService";
import inquiryRepliesRouter from "./inquiryReplies";

const router = express.Router();

// Mount replies router
router.use("/:id/replies", inquiryRepliesRouter);

// GET /api/inquiries - Get all inquiries
router.get("/", authenticateToken, async (req, res) => {
  try {
    const inquiries = await inquiryService.getInquiries();

    res.json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
    });
  }
});

// GET /api/inquiries/:id - Get inquiry by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inquiryId = parseInt(id);

    if (isNaN(inquiryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID",
      });
    }

    const inquiry = await inquiryService.getInquiryById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inquiry",
    });
  }
});

// POST /api/inquiries - Create new inquiry
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      dateOfInquiry,
      inquirerName,
      inquirerContact,
      companyId,
      typeOfInquiry,
      inquiryContent,
      progressStatus,
      responderId,
      recorderId,
      resolutionDate,
    } = req.body;

    // Validate required fields
    if (
      !dateOfInquiry ||
      !inquirerName ||
      !inquirerContact ||
      !typeOfInquiry ||
      !inquiryContent ||
      !recorderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const inquiry = await inquiryService.createInquiry({
      dateOfInquiry: new Date(dateOfInquiry),
      inquirerName,
      inquirerContact,
      companyId: companyId ? parseInt(companyId) : undefined,
      typeOfInquiry,
      inquiryContent,
      progressStatus,
      responderId: responderId ? parseInt(responderId) : undefined,
      recorderId: parseInt(recorderId),
      resolutionDate: resolutionDate ? new Date(resolutionDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create inquiry",
    });
  }
});

// PUT /api/inquiries/:id - Update inquiry
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inquiryId = parseInt(id);

    if (isNaN(inquiryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID",
      });
    }

    const {
      dateOfInquiry,
      inquirerName,
      inquirerContact,
      companyId,
      typeOfInquiry,
      inquiryContent,
      progressStatus,
      responderId,
      recorderId,
      resolutionDate,
    } = req.body;

    const updateData: InquiryUpdateData = {};

    if (dateOfInquiry !== undefined)
      updateData.dateOfInquiry = new Date(dateOfInquiry);
    if (inquirerName !== undefined) updateData.inquirerName = inquirerName;
    if (inquirerContact !== undefined)
      updateData.inquirerContact = inquirerContact;
    if (companyId !== undefined)
      updateData.companyId = companyId ? parseInt(companyId) : undefined;
    if (typeOfInquiry !== undefined) updateData.typeOfInquiry = typeOfInquiry;
    if (inquiryContent !== undefined)
      updateData.inquiryContent = inquiryContent;
    if (progressStatus !== undefined)
      updateData.progressStatus = progressStatus;
    if (responderId !== undefined)
      updateData.responderId = responderId ? parseInt(responderId) : undefined;
    if (recorderId !== undefined) updateData.recorderId = parseInt(recorderId);
    if (resolutionDate !== undefined)
      updateData.resolutionDate = resolutionDate
        ? new Date(resolutionDate)
        : undefined;

    const inquiry = await inquiryService.updateInquiry(inquiryId, updateData);

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inquiry",
    });
  }
});

// POST /api/inquiries/bulk-delete - Bulk delete inquiries
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

    // Delete inquiries using the service
    const deletedCount = await inquiryService.bulkDeleteInquiries(validIds);

    res.json({ deletedCount });
  } catch (error: unknown) {
    console.error("Error bulk deleting inquiries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
