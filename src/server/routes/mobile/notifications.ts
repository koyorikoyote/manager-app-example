import express from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";

const router = express.Router();

interface NotificationItem {
  id: number;
  tableName:
    | "inquiries"
    | "daily_record"
    | "interaction_records"
    | "complaint_details";
  recordId: number;
  updatedAt: Date;
  lastMessage: string;
  recordData: Record<string, unknown>;
  messageReplyId: number;
}

/**
 * GET /api/mobile/notifications
 * Returns unread notifications for current mobile user based on staff_id associations
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (
      req as unknown as { mobileUser: { id: number; email: string } }
    ).mobileUser;

    // Get mobile user with staff_id association
    const userWithStaff = await prisma.mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    if (!userWithStaff?.staffId) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 20 },
      });
    }

    const staffId = userWithStaff.staffId;
    const notifications: NotificationItem[] = [];

    // Fetch complaint_details with unread messages
    const complaints = await prisma.complaintDetail.findMany({
      where: {
        recorderId: staffId,
        repliesIdArray: { not: Prisma.JsonNull },
      },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const complaint of complaints) {
      const replyIds = Array.isArray(complaint.repliesIdArray)
        ? complaint.repliesIdArray
        : [];
      if (replyIds.length > 0) {
        const lastReplyId = replyIds[replyIds.length - 1];
        const lastReply = await prisma.messageReply.findUnique({
          where: { id: Number(lastReplyId) },
        });

        if (lastReply && !lastReply.isRead) {
          notifications.push({
            id: complaint.id,
            tableName: "complaint_details",
            recordId: complaint.id,
            updatedAt: complaint.updatedAt,
            lastMessage: lastReply.fromMessage || lastReply.toMessage || "",
            recordData: complaint,
            messageReplyId: lastReply.id,
          });
        }
      }
    }

    // Fetch daily_record with unread messages
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: {
        staffId: staffId,
        repliesIdArray: { not: Prisma.JsonNull },
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    for (const record of dailyRecords) {
      const replyIds = Array.isArray(record.repliesIdArray)
        ? record.repliesIdArray
        : [];
      if (replyIds.length > 0) {
        const lastReplyId = replyIds[replyIds.length - 1];
        const lastReply = await prisma.messageReply.findUnique({
          where: { id: Number(lastReplyId) },
        });

        if (lastReply && !lastReply.isRead) {
          notifications.push({
            id: record.id,
            tableName: "daily_record",
            recordId: record.id,
            updatedAt: record.updatedAt,
            lastMessage: lastReply.fromMessage || lastReply.toMessage || "",
            recordData: record,
            messageReplyId: lastReply.id,
          });
        }
      }
    }

    // Fetch interaction_records with unread messages AND type = DISCUSSION
    const interactions = await prisma.interactionRecord.findMany({
      where: {
        personInvolvedStaffId: staffId,
        type: "DISCUSSION",
        repliesIdArray: { not: Prisma.JsonNull },
      },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    for (const interaction of interactions) {
      const replyIds = Array.isArray(interaction.repliesIdArray)
        ? interaction.repliesIdArray
        : [];
      if (replyIds.length > 0) {
        const lastReplyId = replyIds[replyIds.length - 1];
        const lastReply = await prisma.messageReply.findUnique({
          where: { id: Number(lastReplyId) },
        });

        if (lastReply && !lastReply.isRead) {
          notifications.push({
            id: interaction.id,
            tableName: "interaction_records",
            recordId: interaction.id,
            updatedAt: interaction.updatedAt,
            lastMessage: lastReply.fromMessage || lastReply.toMessage || "",
            recordData: interaction,
            messageReplyId: lastReply.id,
          });
        }
      }
    }

    // Fetch inquiries with unread messages
    const inquiries = await prisma.inquiry.findMany({
      where: {
        recorderId: staffId,
        repliesIdArray: { not: Prisma.JsonNull },
      },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const inquiry of inquiries) {
      const replyIds = Array.isArray(inquiry.repliesIdArray)
        ? inquiry.repliesIdArray
        : [];
      if (replyIds.length > 0) {
        const lastReplyId = replyIds[replyIds.length - 1];
        const lastReply = await prisma.messageReply.findUnique({
          where: { id: Number(lastReplyId) },
        });

        if (lastReply && !lastReply.isRead) {
          notifications.push({
            id: inquiry.id,
            tableName: "inquiries",
            recordId: inquiry.id,
            updatedAt: inquiry.updatedAt,
            lastMessage: lastReply.fromMessage || lastReply.toMessage || "",
            recordData: inquiry,
            messageReplyId: lastReply.id,
          });
        }
      }
    }

    // Sort by updatedAt descending
    notifications.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        total: notifications.length,
        page: 1,
        limit: 20,
      },
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications" });
  }
});

export default router;
