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
 * GET /api/mobile/daily-records
 * Returns daily records for current mobile user
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

    const where = { staffId: userWithStaff.staffId };

    const [items, total] = await Promise.all([
      prisma.dailyRecord.findMany({
        where,
        orderBy: { dateOfRecord: "desc" },
        skip,
        take: limit,
        include: {
          staff: { select: { id: true, name: true } },
        },
      }),
      prisma.dailyRecord.count({ where }),
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
    console.error("List daily records error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch daily records" });
  }
});

/**
 * GET /api/mobile/daily-records/:id
 * Returns a single daily record by ID
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

    const record = await prisma.dailyRecord.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    if (!record || record.staffId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Daily record not found" });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("Get daily record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch daily record" });
  }
});

/**
 * POST /api/mobile/daily-records
 * Creates a new daily record
 */
router.post("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const {
      dateOfRecord,
      conditionStatus,
      feedbackContent,
      contactNumber,
      photo,
    } = req.body || {};

    if (!conditionStatus || !feedbackContent) {
      return res.status(400).json({
        success: false,
        error: "Required fields: conditionStatus, feedbackContent",
      });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    if (!userWithStaff?.staffId) {
      return res.status(400).json({
        success: false,
        error: "Mobile user has no staff association",
      });
    }

    const created = await prisma.dailyRecord.create({
      data: {
        dateOfRecord: dateOfRecord ? new Date(dateOfRecord) : new Date(),
        staffId: userWithStaff.staffId,
        conditionStatus,
        feedbackContent,
        contactNumber: contactNumber ?? null,
        photo: photo ?? null,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("Create daily record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create daily record" });
  }
});

/**
 * PUT /api/mobile/daily-records/:id
 * Updates an existing daily record
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

    const existing = await prisma.dailyRecord.findUnique({ where: { id } });
    if (!existing || existing.staffId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Daily record not found" });
    }

    const {
      dateOfRecord,
      conditionStatus,
      feedbackContent,
      contactNumber,
      photo,
    } = req.body || {};

    const updated = await prisma.dailyRecord.update({
      where: { id },
      data: {
        dateOfRecord: dateOfRecord ? new Date(dateOfRecord) : undefined,
        conditionStatus: conditionStatus ?? undefined,
        feedbackContent: feedbackContent ?? undefined,
        contactNumber: contactNumber ?? undefined,
        photo: photo ?? undefined,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update daily record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update daily record" });
  }
});

/**
 * DELETE /api/mobile/daily-records/:id
 * Deletes a daily record
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

    const existing = await prisma.dailyRecord.findUnique({ where: { id } });
    if (!existing || existing.staffId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Daily record not found" });
    }

    await prisma.dailyRecord.delete({ where: { id } });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete daily record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete daily record" });
  }
});

export default router;

/**
 * GET /api/mobile/daily-records/:id/replies
 * Get all replies for a daily record
 */
router.get("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const dailyRecordId = Number(req.params.id);
    const { limit = 1000, offset = 0 } = req.query;

    const [replies, totalCount] = await Promise.all([
      conversationService.getReplies("dailyRecord", dailyRecordId, {
        limit: Number(limit),
        offset: Number(offset),
      }),
      conversationService.getRepliesCount("dailyRecord", dailyRecordId),
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
    console.error("Get daily record replies error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch replies" });
  }
});

/**
 * POST /api/mobile/daily-records/:id/replies
 * Create a new reply for a daily record
 */
router.post("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const dailyRecordId = Number(req.params.id);
    const { messageText } = req.body || {};

    if (!messageText?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "messageText is required" });
    }

    const reply = await conversationService.createReply(
      "dailyRecord",
      dailyRecordId,
      null,
      messageText.trim(),
      { fromDispatchApp: true }
    );

    return res.status(201).json({ success: true, data: reply });
  } catch (err) {
    console.error("Create daily record reply error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create reply" });
  }
});

/**
 * PUT /api/mobile/daily-records/:id/replies/:replyId
 * Update an existing reply
 */
router.put("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const dailyRecordId = Number(id);
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
      "dailyRecord",
      dailyRecordId,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, data: reply });
  } catch (err: any) {
    console.error("Update daily record reply error:", err);

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
 * DELETE /api/mobile/daily-records/:id/replies/:replyId
 * Delete a reply
 */
router.delete("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const dailyRecordId = Number(id);

    await conversationService.deleteReply(
      Number(replyId),
      "dailyRecord",
      dailyRecordId,
      null,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, message: "Reply deleted successfully" });
  } catch (err: any) {
    console.error("Delete daily record reply error:", err);

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
