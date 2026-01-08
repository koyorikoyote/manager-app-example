import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";
import { documentsQuerySchema } from "../../middleware/mobileValidation";
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

/**
 * GET /api/mobile/documents
 * Returns documents with status = 'ACTIVE' and type = 'MANUAL'
 * Optional query parameter: q (search keyword)
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    // Validate query parameters
    const validatedQuery = documentsQuerySchema.parse(req.query);
    const { q } = validatedQuery;
    const { page, limit, skip } = getPagination(validatedQuery);

    // Build where clause - filter for MANUAL type documents only
    const where: any = {
      status: "ACTIVE",
      type: "MANUAL",
    };

    // Add search filter if query provided
    if (q && typeof q === "string" && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { relatedEntityId: { contains: searchTerm } },
      ];
    }

    // Fetch documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          type: true,
          relatedEntityId: true,
          filePath: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          staffId: true,
          companiesId: true,
          propertyId: true,
        },
      }),
      prisma.document.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
    console.error("Documents error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch documents" });
  }
});

export default router;
