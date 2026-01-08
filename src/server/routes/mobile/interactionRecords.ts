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
 * GET /api/mobile/interaction-records
 * Returns interaction records for current mobile user
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

    const where = {
      personInvolvedStaffId: userWithStaff.staffId,
      type: "DISCUSSION" as const,
    };

    const [items, total] = await Promise.all([
      prisma.interactionRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          company: { select: { id: true, name: true } },
          personInvolved: { select: { id: true, name: true } },
          userInCharge: { select: { id: true, name: true } },
        },
      }),
      prisma.interactionRecord.count({ where }),
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
    console.error("List interaction records error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch interaction records" });
  }
});

/**
 * GET /api/mobile/interaction-records/:id
 * Returns a single interaction record by ID
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

    const record = await prisma.interactionRecord.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    if (
      !record ||
      record.personInvolvedStaffId !== userWithStaff?.staffId ||
      record.type !== "DISCUSSION"
    ) {
      return res
        .status(404)
        .json({ success: false, error: "Interaction record not found" });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("Get interaction record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch interaction record" });
  }
});

/**
 * POST /api/mobile/interaction-records
 * Creates a new interaction record
 */
router.post("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const {
      date,
      description,
      status,
      name,
      title,
      userInChargeId,
      personConcerned,
      location,
      means,
      responseDetails,
      companiesId,
    } = req.body || {};

    if (!description) {
      return res.status(400).json({
        success: false,
        error: "Required field: description",
      });
    }

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: {
        staffId: true,
        userId: true,
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

    const created = await prisma.interactionRecord.create({
      data: {
        type: "DISCUSSION",
        date: date ? new Date(date) : new Date(),
        description,
        status: status ?? null,
        name: name ?? null,
        title: title ?? null,
        personInvolvedStaffId: userWithStaff.staffId,
        userInChargeId: userInChargeId ? Number(userInChargeId) : null,
        personConcerned: personConcerned ?? null,
        location: location ?? null,
        means: means ?? null,
        responseDetails: responseDetails ?? null,
        companiesId: companiesId
          ? Number(companiesId)
          : userWithStaff.staff?.companiesId ?? null,
        createdBy: userWithStaff.userId ?? null,
      },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("Create interaction record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create interaction record" });
  }
});

/**
 * PUT /api/mobile/interaction-records/:id
 * Updates an existing interaction record
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

    const existing = await prisma.interactionRecord.findUnique({
      where: { id },
    });
    if (
      !existing ||
      existing.personInvolvedStaffId !== userWithStaff?.staffId ||
      existing.type !== "DISCUSSION"
    ) {
      return res
        .status(404)
        .json({ success: false, error: "Interaction record not found" });
    }

    const {
      date,
      description,
      status,
      name,
      title,
      userInChargeId,
      personConcerned,
      location,
      means,
      responseDetails,
      companiesId,
    } = req.body || {};

    const updated = await prisma.interactionRecord.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        description: description ?? undefined,
        status: status ?? undefined,
        name: name ?? undefined,
        title: title ?? undefined,
        userInChargeId: userInChargeId ? Number(userInChargeId) : undefined,
        personConcerned: personConcerned ?? undefined,
        location: location ?? undefined,
        means: means ?? undefined,
        responseDetails: responseDetails ?? undefined,
        companiesId: companiesId ? Number(companiesId) : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update interaction record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update interaction record" });
  }
});

/**
 * DELETE /api/mobile/interaction-records/:id
 * Deletes an interaction record
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

    const existing = await prisma.interactionRecord.findUnique({
      where: { id },
    });
    if (
      !existing ||
      existing.personInvolvedStaffId !== userWithStaff?.staffId ||
      existing.type !== "DISCUSSION"
    ) {
      return res
        .status(404)
        .json({ success: false, error: "Interaction record not found" });
    }

    await prisma.interactionRecord.delete({ where: { id } });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete interaction record error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete interaction record" });
  }
});

/**
 * GET /api/mobile/interaction-records/:id/replies
 * Get all replies for an interaction record
 */
router.get("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const interactionId = Number(req.params.id);
    const { limit = 1000, offset = 0 } = req.query;

    const [replies, totalCount] = await Promise.all([
      conversationService.getReplies("interaction", interactionId, {
        limit: Number(limit),
        offset: Number(offset),
      }),
      conversationService.getRepliesCount("interaction", interactionId),
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
    console.error("Get interaction replies error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch replies" });
  }
});

/**
 * POST /api/mobile/interaction-records/:id/replies
 * Create a new reply for an interaction record
 */
router.post("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const interactionId = Number(req.params.id);
    const { messageText } = req.body || {};

    if (!messageText?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "messageText is required" });
    }

    const reply = await conversationService.createReply(
      "interaction",
      interactionId,
      null,
      messageText.trim(),
      { fromDispatchApp: true }
    );

    return res.status(201).json({ success: true, data: reply });
  } catch (err) {
    console.error("Create interaction reply error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create reply" });
  }
});

/**
 * PUT /api/mobile/interaction-records/:id/replies/:replyId
 * Update an existing reply
 */
router.put("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const interactionId = Number(id);
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
      "interaction",
      interactionId,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, data: reply });
  } catch (err: any) {
    console.error("Update interaction reply error:", err);

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
 * DELETE /api/mobile/interaction-records/:id/replies/:replyId
 * Delete a reply
 */
router.delete("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const interactionId = Number(id);

    await conversationService.deleteReply(
      Number(replyId),
      "interaction",
      interactionId,
      null,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, message: "Reply deleted successfully" });
  } catch (err: any) {
    console.error("Delete interaction reply error:", err);

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
