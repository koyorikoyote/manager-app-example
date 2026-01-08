import express from "express";
import { authenticateToken } from "../middleware/auth";
import complaintService, {
  ComplaintUpdateData,
} from "../services/ComplaintService";
import complaintRepliesRouter from "./complaintReplies";

const router = express.Router();

// Mount replies router
router.use("/:id/replies", complaintRepliesRouter);

// GET /api/complaint-details - Get all complaint details
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { search, status, page, limit, urgencyLevel } = req.query;

    const filters: Record<string, unknown> = {};
    if (search) filters.search = search as string;
    if (status) filters.status = status as string;
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const complaints = await complaintService.getComplaintDetails(filters);

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint details",
    });
  }
});

// GET /api/complaint-details/:id - Get complaint detail by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id);

    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    const complaint = await complaintService.getComplaintDetailById(
      complaintId
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint detail not found",
      });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error fetching complaint detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint detail",
    });
  }
});

// POST /api/complaint-details - Create new complaint detail
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      dateOfOccurrence,
      complainerName,
      complainerContact,
      personInvolved,
      progressStatus,
      urgencyLevel,
      complaintContent,
      responderId,
      companyId,
      recorderId,
      resolutionDate,
    } = req.body;

    // Validate required fields
    if (
      !dateOfOccurrence ||
      !complainerName ||
      !complainerContact ||
      !complaintContent ||
      !urgencyLevel ||
      !recorderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const complaintData = {
      dateOfOccurrence: new Date(dateOfOccurrence),
      complainerName,
      complainerContact,
      personInvolved: personInvolved || "",
      progressStatus,
      urgencyLevel,
      complaintContent,
      responderId: responderId || undefined,
      companyId: companyId || undefined,
      recorderId,
      resolutionDate: resolutionDate ? new Date(resolutionDate) : undefined,
    };

    const complaint = await complaintService.createComplaintDetail(
      complaintData
    );

    res.status(201).json({
      success: true,
      data: complaint,
      message: "Complaint created successfully",
    });
  } catch (error) {
    console.error("Error creating complaint detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create complaint detail",
    });
  }
});

// PUT /api/complaint-details/:id - Update complaint detail
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id);

    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    const {
      dateOfOccurrence,
      complainerName,
      complainerContact,
      personInvolved,
      progressStatus,
      urgencyLevel,
      complaintContent,
      responderId,
      companyId,
      recorderId,
      resolutionDate,
    } = req.body;

    const updateData: ComplaintUpdateData = {};
    if (dateOfOccurrence !== undefined)
      updateData.dateOfOccurrence = new Date(dateOfOccurrence);
    if (complainerName !== undefined)
      updateData.complainerName = complainerName;
    if (complainerContact !== undefined)
      updateData.complainerContact = complainerContact;
    if (personInvolved !== undefined)
      updateData.personInvolved = personInvolved;
    if (progressStatus !== undefined)
      updateData.progressStatus = progressStatus;
    if (urgencyLevel !== undefined) updateData.urgencyLevel = urgencyLevel;
    if (complaintContent !== undefined)
      updateData.complaintContent = complaintContent;
    if (responderId !== undefined) updateData.responderId = responderId;
    if (companyId !== undefined) updateData.companyId = companyId;
    if (recorderId !== undefined) updateData.recorderId = recorderId;
    if (resolutionDate !== undefined)
      updateData.resolutionDate = resolutionDate
        ? new Date(resolutionDate)
        : undefined;

    const complaint = await complaintService.updateComplaintDetail(
      complaintId,
      updateData
    );

    res.json({
      success: true,
      data: complaint,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    console.error("Error updating complaint detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update complaint detail",
    });
  }
});

// POST /api/complaint-details/bulk-delete - Bulk delete complaint details
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

    // Delete complaints using the service
    const deletedCount = await complaintService.bulkDeleteComplaintDetails(
      validIds
    );

    res.json({ deletedCount });
  } catch (error: unknown) {
    console.error("Error bulk deleting complaint details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
