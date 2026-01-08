import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";
import { searchQuerySchema } from "../../middleware/mobileValidation";
import { ZodError } from "zod";

const router = express.Router();

interface SearchResult {
  tableName: string;
  recordId: number;
  matchedFields: string[];
  preview: string;
  recordData: unknown;
}

/**
 * GET /api/mobile/search
 * Searches across inquiries, daily_record, interaction_records, and complaint_details
 * Query params: q (required), startDate (optional), endDate (optional), page, limit
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    const validatedQuery = searchQuerySchema.parse(req.query);
    const { q, startDate, endDate, page, limit } = validatedQuery;

    const mobileUser = (req as any).mobileUser as { id: number };

    const userWithStaff = await (prisma as any).mobileUser.findUnique({
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
    const searchTerm = q.trim().toLowerCase();
    const results: SearchResult[] = [];

    const startDateFilter = startDate ? new Date(startDate) : null;
    const endDateFilter = endDate ? new Date(endDate) : null;
    const pageNum = Math.max(parseInt(String(page || "1")), 1);
    const limitNum = Math.min(
      Math.max(parseInt(String(limit || "20")), 1),
      100
    );

    // Search inquiries
    const inquiries = await prisma.inquiry.findMany({
      where: { recorderId: staffId },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const inquiry of inquiries) {
      const matchedFields: string[] = [];
      let preview = "";

      if (inquiry.inquirerName?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("inquirerName");
      }
      if (inquiry.inquirerContact?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("inquirerContact");
      }
      if (inquiry.typeOfInquiry?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("typeOfInquiry");
      }
      if (inquiry.inquiryContent?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("inquiryContent");
        preview = inquiry.inquiryContent.substring(0, 100);
      }

      if (matchedFields.length > 0) {
        if (!startDateFilter && !endDateFilter) {
          results.push({
            tableName: "inquiries",
            recordId: inquiry.id,
            matchedFields,
            preview: preview || inquiry.inquirerName,
            recordData: inquiry,
          });
        } else {
          const dateInRange =
            (!startDateFilter ||
              new Date(inquiry.dateOfInquiry) >= startDateFilter) &&
            (!endDateFilter ||
              new Date(inquiry.dateOfInquiry) <= endDateFilter);
          const createdInRange =
            (!startDateFilter ||
              new Date(inquiry.createdAt) >= startDateFilter) &&
            (!endDateFilter || new Date(inquiry.createdAt) <= endDateFilter);
          const updatedInRange =
            (!startDateFilter ||
              new Date(inquiry.updatedAt) >= startDateFilter) &&
            (!endDateFilter || new Date(inquiry.updatedAt) <= endDateFilter);
          const resolutionInRange = inquiry.resolutionDate
            ? (!startDateFilter ||
                new Date(inquiry.resolutionDate) >= startDateFilter) &&
              (!endDateFilter ||
                new Date(inquiry.resolutionDate) <= endDateFilter)
            : false;

          if (
            dateInRange ||
            createdInRange ||
            updatedInRange ||
            resolutionInRange
          ) {
            results.push({
              tableName: "inquiries",
              recordId: inquiry.id,
              matchedFields,
              preview: preview || inquiry.inquirerName,
              recordData: inquiry,
            });
          }
        }
      }
    }

    // Search daily_record
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: { staffId: staffId },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    for (const record of dailyRecords) {
      const matchedFields: string[] = [];
      let preview = "";

      if (record.feedbackContent?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("feedbackContent");
        preview = record.feedbackContent.substring(0, 100);
      }
      if (record.contactNumber?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("contactNumber");
      }
      if (record.photo?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("photo");
      }

      if (matchedFields.length > 0) {
        if (!startDateFilter && !endDateFilter) {
          results.push({
            tableName: "daily_record",
            recordId: record.id,
            matchedFields,
            preview:
              preview ||
              record.feedbackContent?.substring(0, 100) ||
              "No preview available",
            recordData: record,
          });
        } else {
          const dateInRange =
            (!startDateFilter ||
              new Date(record.dateOfRecord) >= startDateFilter) &&
            (!endDateFilter || new Date(record.dateOfRecord) <= endDateFilter);
          const createdInRange =
            (!startDateFilter ||
              new Date(record.createdAt) >= startDateFilter) &&
            (!endDateFilter || new Date(record.createdAt) <= endDateFilter);
          const updatedInRange =
            (!startDateFilter ||
              new Date(record.updatedAt) >= startDateFilter) &&
            (!endDateFilter || new Date(record.updatedAt) <= endDateFilter);

          if (dateInRange || createdInRange || updatedInRange) {
            results.push({
              tableName: "daily_record",
              recordId: record.id,
              matchedFields,
              preview:
                preview ||
                record.feedbackContent?.substring(0, 100) ||
                "No preview available",
              recordData: record,
            });
          }
        }
      }
    }

    // Search interaction_records (only DISCUSSION type)
    const interactions = await prisma.interactionRecord.findMany({
      where: {
        personInvolvedStaffId: staffId,
        type: "DISCUSSION",
      },
      include: {
        company: { select: { id: true, name: true } },
        personInvolved: { select: { id: true, name: true } },
        userInCharge: { select: { id: true, name: true } },
      },
    });

    for (const interaction of interactions) {
      const matchedFields: string[] = [];
      let preview = "";

      if (interaction.name?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("name");
      }
      if (interaction.title?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("title");
      }
      if (interaction.description?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("description");
        preview = interaction.description.substring(0, 100);
      }
      if (interaction.location?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("location");
      }
      if (interaction.responseDetails?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("responseDetails");
      }
      if (interaction.personConcerned?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("personConcerned");
      }

      if (matchedFields.length > 0) {
        if (!startDateFilter && !endDateFilter) {
          results.push({
            tableName: "interaction_records",
            recordId: interaction.id,
            matchedFields,
            preview:
              preview ||
              interaction.description?.substring(0, 100) ||
              interaction.title ||
              interaction.name ||
              "No preview available",
            recordData: interaction,
          });
        } else {
          const dateInRange =
            (!startDateFilter ||
              new Date(interaction.date) >= startDateFilter) &&
            (!endDateFilter || new Date(interaction.date) <= endDateFilter);
          const createdInRange =
            (!startDateFilter ||
              new Date(interaction.createdAt) >= startDateFilter) &&
            (!endDateFilter ||
              new Date(interaction.createdAt) <= endDateFilter);
          const updatedInRange =
            (!startDateFilter ||
              new Date(interaction.updatedAt) >= startDateFilter) &&
            (!endDateFilter ||
              new Date(interaction.updatedAt) <= endDateFilter);

          if (dateInRange || createdInRange || updatedInRange) {
            results.push({
              tableName: "interaction_records",
              recordId: interaction.id,
              matchedFields,
              preview:
                preview ||
                interaction.description?.substring(0, 100) ||
                interaction.title ||
                interaction.name ||
                "No preview available",
              recordData: interaction,
            });
          }
        }
      }
    }

    // Search complaint_details
    const complaints = await prisma.complaintDetail.findMany({
      where: { recorderId: staffId },
      include: {
        company: { select: { id: true, name: true } },
        responder: { select: { id: true, name: true } },
        recorder: { select: { id: true, name: true } },
      },
    });

    for (const complaint of complaints) {
      const matchedFields: string[] = [];
      let preview = "";

      if (complaint.complainerName?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("complainerName");
      }
      if (complaint.complainerContact?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("complainerContact");
      }
      if (complaint.personInvolved?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("personInvolved");
      }
      if (complaint.complaintContent?.toLowerCase().includes(searchTerm)) {
        matchedFields.push("complaintContent");
        preview = complaint.complaintContent.substring(0, 100);
      }

      if (matchedFields.length > 0) {
        if (!startDateFilter && !endDateFilter) {
          results.push({
            tableName: "complaint_details",
            recordId: complaint.id,
            matchedFields,
            preview: preview || complaint.complainerName,
            recordData: complaint,
          });
        } else {
          const dateInRange =
            (!startDateFilter ||
              new Date(complaint.dateOfOccurrence) >= startDateFilter) &&
            (!endDateFilter ||
              new Date(complaint.dateOfOccurrence) <= endDateFilter);
          const createdInRange =
            (!startDateFilter ||
              new Date(complaint.createdAt) >= startDateFilter) &&
            (!endDateFilter || new Date(complaint.createdAt) <= endDateFilter);
          const updatedInRange =
            (!startDateFilter ||
              new Date(complaint.updatedAt) >= startDateFilter) &&
            (!endDateFilter || new Date(complaint.updatedAt) <= endDateFilter);
          const resolutionInRange = complaint.resolutionDate
            ? (!startDateFilter ||
                new Date(complaint.resolutionDate) >= startDateFilter) &&
              (!endDateFilter ||
                new Date(complaint.resolutionDate) <= endDateFilter)
            : false;

          if (
            dateInRange ||
            createdInRange ||
            updatedInRange ||
            resolutionInRange
          ) {
            results.push({
              tableName: "complaint_details",
              recordId: complaint.id,
              matchedFields,
              preview: preview || complaint.complainerName,
              recordData: complaint,
            });
          }
        }
      }
    }

    const total = results.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedResults = results.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
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
    console.error("Search error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to perform search" });
  }
});

export default router;
