import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";
import conversationService from "../../services/ConversationService";

const router = express.Router();

function getPagination(query: any) {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit as string) || 20, 1),
    100
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * GET /api/mobile/complaint-details
 * Returns complaint details for current mobile user
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const { page, limit, skip } = getPagination(req.query);

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    if (!userWithStaff?.staffId) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const where = { recorderId: userWithStaff.staffId };

    const [items, total] = await Promise.all([
      prisma.complaintDetail.findMany({
        where,
        orderBy: { dateOfOccurrence: "desc" },
        skip,
        take: limit,
        include: {
          company: { select: { id: true, name: true } },
          responder: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true } },
        },
      }),
      prisma.complaintDetail.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("List complaint details error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch complaint details" });
  }
});

/**
 * GET /api/mobile/complaint-details/:id
 * Returns a single complaint detail by ID
 */
router.get("/:id", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    const record = await prisma.complaintDetail.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    if (!record || record.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Complaint detail not found" });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("Get complaint detail error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch complaint detail" });
  }
});

/**
 * POST /api/mobile/complaint-details
 * Creates a new complaint detail
 */
router.post("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const {
      dateOfOccurrence,
      complainerName,
      complainerContact,
      personInvolved,
      progressStatus,
      urgencyLevel,
      complaintContent,
      responderId,
      resolutionDate,
    } = req.body || {};

    if (
      !complainerName ||
      !complainerContact ||
      !urgencyLevel ||
      !complaintContent
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Required fields: complainerName, complainerContact, urgencyLevel, complaintContent",
      });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: {
        staffId: true,
        staff: {
          select: {
            companiesId: true,
          },
        },
      },
    });

    if (!userWithStaff?.staffId) {
      return res.status(400).json({
        success: false,
        error: "Mobile user has no staff association",
      });
    }

    const created = await prisma.complaintDetail.create({
      data: {
        dateOfOccurrence: dateOfOccurrence
          ? new Date(dateOfOccurrence)
          : new Date(),
        complainerName,
        complainerContact,
        personInvolved: personInvolved ?? null,
        progressStatus: progressStatus || "OPEN",
        urgencyLevel,
        complaintContent,
        responderId: responderId ? Number(responderId) : null,
        companyId: userWithStaff.staff?.companiesId ?? null,
        recorderId: userWithStaff.staffId,
        resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
      },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("Create complaint detail error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create complaint detail" });
  }
});

/**
 * PUT /api/mobile/complaint-details/:id
 * Updates an existing complaint detail
 */
router.put("/:id", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    const existing = await prisma.complaintDetail.findUnique({ where: { id } });
    if (!existing || existing.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Complaint detail not found" });
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
      resolutionDate,
    } = req.body || {};

    const updated = await prisma.complaintDetail.update({
      where: { id },
      data: {
        dateOfOccurrence: dateOfOccurrence
          ? new Date(dateOfOccurrence)
          : undefined,
        complainerName: complainerName ?? undefined,
        complainerContact: complainerContact ?? undefined,
        personInvolved: personInvolved ?? undefined,
        progressStatus: progressStatus ?? undefined,
        urgencyLevel: urgencyLevel ?? undefined,
        complaintContent: complaintContent ?? undefined,
        responderId: responderId ? Number(responderId) : undefined,
        resolutionDate: resolutionDate ? new Date(resolutionDate) : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update complaint detail error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update complaint detail" });
  }
});

/**
 * DELETE /api/mobile/complaint-details/:id
 * Deletes a complaint detail
 */
router.delete("/:id", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    const existing = await prisma.complaintDetail.findUnique({ where: { id } });
    if (!existing || existing.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Complaint detail not found" });
    }

    await prisma.complaintDetail.delete({ where: { id } });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete complaint detail error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete complaint detail" });
  }
});

/**
 * GET /api/mobile/complaint-details/:id/replies
 * Get all replies for a complaint detail
 */
router.get("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const complaintId = Number(req.params.id);
    const { limit = 1000, offset = 0 } = req.query;

    const [replies, totalCount] = await Promise.all([
      conversationService.getReplies("complaint", complaintId, {
        limit: Number(limit),
        offset: Number(offset),
      }),
      conversationService.getRepliesCount("complaint", complaintId),
    ]);

    return res.json({
      success: true,
      data: replies,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + replies.length < totalCount,
      },
    });
  } catch (err) {
    console.error("Get complaint replies error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch replies" });
  }
});

/**
 * POST /api/mobile/complaint-details/:id/replies
 * Create a new reply for a complaint detail
 */
router.post("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const complaintId = Number(req.params.id);
    const { messageText } = req.body || {};

    if (!messageText?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "messageText is required" });
    }

    const reply = await conversationService.createReply(
      "complaint",
      complaintId,
      null,
      messageText.trim(),
      { fromDispatchApp: true }
    );

    return res.status(201).json({ success: true, data: reply });
  } catch (err) {
    console.error("Create complaint reply error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create reply" });
  }
});

/**
 * PUT /api/mobile/complaint-details/:id/replies/:replyId
 * Update an existing reply
 */
router.put("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const complaintId = Number(id);
    const { messageText } = req.body || {};

    if (!messageText?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "messageText is required" });
    }

    const reply = await conversationService.updateReply(
      Number(replyId),
      messageText.trim(),
      null,
      "complaint",
      complaintId,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, data: reply });
  } catch (err: any) {
    console.error("Update complaint reply error:", err);

    if (err.message === "Reply not found") {
      return res.status(404).json({ success: false, error: "Reply not found" });
    }
    if (err.message.includes("Unauthorized")) {
      return res
        .status(403)
        .json({ success: false, error: "You can only edit your own messages" });
    }
    if (err.message.includes("Time limit exceeded")) {
      return res.status(403).json({
        success: false,
        error: "Messages can only be edited within 1 hour of posting",
      });
    }

    return res
      .status(500)
      .json({ success: false, error: "Failed to update reply" });
  }
});

/**
 * DELETE /api/mobile/complaint-details/:id/replies/:replyId
 * Delete a reply
 */
router.delete("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const complaintId = Number(id);

    await conversationService.deleteReply(
      Number(replyId),
      "complaint",
      complaintId,
      null,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, message: "Reply deleted successfully" });
  } catch (err: any) {
    console.error("Delete complaint reply error:", err);

    if (err.message === "Reply not found") {
      return res.status(404).json({ success: false, error: "Reply not found" });
    }
    if (err.message.includes("Unauthorized")) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own messages",
      });
    }
    if (err.message.includes("Time limit exceeded")) {
      return res.status(403).json({
        success: false,
        error: "Messages can only be deleted within 1 hour of posting",
      });
    }

    return res
      .status(500)
      .json({ success: false, error: "Failed to delete reply" });
  }
});

export default router;
