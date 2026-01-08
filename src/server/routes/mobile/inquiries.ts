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
 * GET /api/mobile/inquiries
 * Returns inquiries for current mobile user
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
      prisma.inquiry.findMany({
        where,
        orderBy: { dateOfInquiry: "desc" },
        skip,
        take: limit,
        include: {
          company: { select: { id: true, name: true } },
          responder: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true } },
        },
      }),
      prisma.inquiry.count({ where }),
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
    console.error("List inquiries error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch inquiries" });
  }
});

/**
 * GET /api/mobile/inquiries/:id
 * Returns a single inquiry by ID
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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    if (!inquiry || inquiry.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Inquiry not found" });
    }

    return res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error("Get inquiry error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch inquiry" });
  }
});

/**
 * POST /api/mobile/inquiries
 * Creates a new inquiry
 */
router.post("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const {
      dateOfInquiry,
      inquirerName,
      inquirerContact,
      companyId,
      typeOfInquiry,
      inquiryContent,
      progressStatus,
      responderId,
    } = req.body || {};

    if (
      !dateOfInquiry ||
      !inquirerName ||
      !inquirerContact ||
      !typeOfInquiry ||
      !inquiryContent
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Required fields: dateOfInquiry, inquirerName, inquirerContact, typeOfInquiry, inquiryContent",
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

    const created = await prisma.inquiry.create({
      data: {
        dateOfInquiry: new Date(dateOfInquiry),
        inquirerName,
        inquirerContact,
        companyId: companyId
          ? Number(companyId)
          : userWithStaff.staff?.companiesId ?? null,
        typeOfInquiry,
        inquiryContent,
        progressStatus: progressStatus || "OPEN",
        responderId: responderId ? Number(responderId) : null,
        recorderId: userWithStaff.staffId,
      },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("Create inquiry error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create inquiry" });
  }
});

/**
 * PUT /api/mobile/inquiries/:id
 * Updates an existing inquiry
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

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing || existing.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Inquiry not found" });
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
      resolutionDate,
    } = req.body || {};

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        dateOfInquiry: dateOfInquiry ? new Date(dateOfInquiry) : undefined,
        inquirerName: inquirerName ?? undefined,
        inquirerContact: inquirerContact ?? undefined,
        companyId: companyId ? Number(companyId) : undefined,
        typeOfInquiry: typeOfInquiry ?? undefined,
        inquiryContent: inquiryContent ?? undefined,
        progressStatus: progressStatus ?? undefined,
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
    console.error("Update inquiry error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update inquiry" });
  }
});

/**
 * DELETE /api/mobile/inquiries/:id
 * Deletes an inquiry
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

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing || existing.recorderId !== userWithStaff?.staffId) {
      return res
        .status(404)
        .json({ success: false, error: "Inquiry not found" });
    }

    await prisma.inquiry.delete({ where: { id } });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete inquiry error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete inquiry" });
  }
});

/**
 * GET /api/mobile/inquiries/:id/replies
 * Get all replies for an inquiry
 */
router.get("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const inquiryId = Number(req.params.id);
    const { limit = 1000, offset = 0 } = req.query;

    const [replies, totalCount] = await Promise.all([
      conversationService.getReplies("inquiry", inquiryId, {
        limit: Number(limit),
        offset: Number(offset),
      }),
      conversationService.getRepliesCount("inquiry", inquiryId),
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
    console.error("Get inquiry replies error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch replies" });
  }
});

/**
 * POST /api/mobile/inquiries/:id/replies
 * Create a new reply for an inquiry
 */
router.post("/:id/replies", authenticateMobile, async (req, res) => {
  try {
    const inquiryId = Number(req.params.id);
    const { messageText } = req.body || {};

    if (!messageText?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "messageText is required" });
    }

    const reply = await conversationService.createReply(
      "inquiry",
      inquiryId,
      null,
      messageText.trim(),
      { fromDispatchApp: true }
    );

    return res.status(201).json({ success: true, data: reply });
  } catch (err) {
    console.error("Create inquiry reply error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create reply" });
  }
});

/**
 * PUT /api/mobile/inquiries/:id/replies/:replyId
 * Update an existing reply
 */
router.put("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const inquiryId = Number(id);
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
      "inquiry",
      inquiryId,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, data: reply });
  } catch (err: any) {
    console.error("Update inquiry reply error:", err);

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
 * DELETE /api/mobile/inquiries/:id/replies/:replyId
 * Delete a reply
 */
router.delete("/:id/replies/:replyId", authenticateMobile, async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const inquiryId = Number(id);

    await conversationService.deleteReply(
      Number(replyId),
      "inquiry",
      inquiryId,
      null,
      { fromDispatchApp: true }
    );

    return res.json({ success: true, message: "Reply deleted successfully" });
  } catch (err: any) {
    console.error("Delete inquiry reply error:", err);

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
