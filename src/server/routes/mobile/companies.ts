import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";

const router = express.Router();

/**
 * GET /api/mobile/companies
 * Query: q (search), page, limit
 * Response: { success, data: [{ id, name }], pagination }
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    const q = (req.query.q as string) || (req.query.query as string) || "";
    const page = Math.max(parseInt((req.query.page as string) || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20", 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          AND: [
            { status: { not: "INACTIVE" } },
            {
              OR: [
                { name: { contains: q, mode: "insensitive" } as any },
                { contactPerson: { contains: q, mode: "insensitive" } as any },
              ],
            },
          ],
        }
      : { status: { not: "INACTIVE" } };

    const [items, total] = await Promise.all([
      (prisma as any).company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
        skip,
        take: limit,
      }),
      (prisma as any).company.count({ where }),
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
    // eslint-disable-next-line no-console
    console.error("List mobile companies error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch companies" });
  }
});

export default router;
