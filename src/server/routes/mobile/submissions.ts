import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";
import { submissionsQuerySchema } from "../../middleware/mobileValidation";
import { ZodError } from "zod";

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

interface SubmissionRecord {
  id: number;
  tableName: string;
  recordId: number;
  createdAt: string;
  updatedAt: string;
  recordData: any;
  preview: string;
}

/**
 * GET /api/mobile/submissions
 * Returns all submissions (inquiries, daily_record, interaction_records, complaint_details)
 * for the authenticated mobile user's staff_id
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    // Validate query parameters
    const validatedQuery = submissionsQuerySchema.parse(req.query);

    const mobileUser = (req as any).mobileUser as { id: number };
    const { page, limit, skip } = getPagination(validatedQuery);

    const userWithStaff = await (prisma as unknown).mobileUser.findUnique({
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

    const staffId = userWithStaff.staffId;
    const submissions: SubmissionRecord[] = [];

    // Fetch inquiries where recorder_id = staff_id
    const inquiries = await prisma.inquiry.findMany({
      where: { recorderId: staffId },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const inquiry of inquiries) {
      submissions.push({
        id: submissions.length + 1,
        tableName: "inquiries",
        recordId: inquiry.id,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
        recordData: inquiry,
        preview: inquiry.inquiryContent.substring(0, 100),
      });
    }

    // Fetch daily_record where staff_id = staff_id
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: { staffId: staffId },
      orderBy: { createdAt: "desc" },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    for (const record of dailyRecords) {
      submissions.push({
        id: submissions.length + 1,
        tableName: "daily_record",
        recordId: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        recordData: record,
        preview: record.feedbackContent.substring(0, 100),
      });
    }

    // Fetch interaction_records where person_involved_staff_id = staff_id AND type = DISCUSSION
    const interactions = await prisma.interactionRecord.findMany({
      where: {
        personInvolvedStaffId: staffId,
        type: "DISCUSSION",
      },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    for (const interaction of interactions) {
      submissions.push({
        id: submissions.length + 1,
        tableName: "interaction_records",
        recordId: interaction.id,
        createdAt: interaction.createdAt.toISOString(),
        updatedAt: interaction.updatedAt.toISOString(),
        recordData: interaction,
        preview: interaction.description.substring(0, 100),
      });
    }

    // Fetch complaint_details where recorder_id = staff_id AND progress_status = OPEN
    const complaints = await prisma.complaintDetail.findMany({
      where: {
        recorderId: staffId,
        progressStatus: "OPEN",
      },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const complaint of complaints) {
      submissions.push({
        id: submissions.length + 1,
        tableName: "complaint_details",
        recordId: complaint.id,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
        recordData: complaint,
        preview: complaint.complaintContent.substring(0, 100),
      });
    }

    // Sort all submissions by createdAt descending
    submissions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const total = submissions.length;
    const paginatedSubmissions = submissions.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: paginatedSubmissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      const errorMessages = err.issues.map((issue) => {
        const path = issue.path.join(".");
        return `${path}: ${issue.message}`;
      });
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${errorMessages.join(", ")}`,
      });
    }
    console.error("Submissions error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch submissions" });
  }
});

export default router;
