import express from "express";
import { authenticateMobile } from "../../middleware/authMobile";
import { getPresignedPutUrl } from "../../lib/awsS3";
import { z } from "zod";

const router = express.Router();

// Zod schema and content-type allowlist
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const ALLOWED_MIME_EXACT = ["application/pdf"];

const PresignBodySchema = z.object({
  contentType: z
    .string()
    .min(1)
    .refine(
      (ct) =>
        ALLOWED_MIME_PREFIXES.some((p) => ct.startsWith(p)) ||
        ALLOWED_MIME_EXACT.includes(ct),
      { message: "Unsupported contentType" }
    ),
  scope: z.enum(["submission", "comment"]).optional(),
  refId: z
    .preprocess(
      (v) => (v === undefined || v === null || v === "" ? undefined : Number(v)),
      z.number().int().positive().max(2147483647)
    )
    .optional(),
  keyHint: z.string().trim().max(64).optional(),
});

/**
 * POST /api/mobile/uploads/presign
 * Body: { contentType: string, scope?: "submission"|"comment", refId?: number, keyHint?: string }
 * Returns: { success, data: { url, key, headers, publicUrl } }
 */
router.post("/presign", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as any).mobileUser as { id: number };
    const { contentType, scope, refId, keyHint } = PresignBodySchema.parse(req.body ?? {});

    // Build a safe uploads key under uploads/mobile/<userId>/...
    const basePrefix = `uploads/mobile/${mobileUser.id}`;
    const now = Date.now();
    const random = Math.floor(Math.random() * 1e9);
    const safeScope = scope === "comment" ? "comments" : "submissions";
    const hint = typeof keyHint === "string" && keyHint.trim().length > 0 ? `-${keyHint.trim().replace(/[^a-zA-Z0-9-_]/g, "")}` : "";
    const extension = (() => {
      if (contentType.startsWith("image/")) return ".img";
      if (contentType.startsWith("video/")) return ".vid";
      if (contentType === "application/pdf") return ".pdf";
      return "";
    })();

    const key = `${basePrefix}/${safeScope}/${refId ? `${refId}/` : ""}${now}-${random}${hint}${extension}`;

    const presign = await getPresignedPutUrl({
      key,
      contentType,
      expiresIn: 300, // 5 minutes
    });

    return res.json({
      success: true,
      data: presign,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request", details: err.issues });
    }
    console.error("Presign upload error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate pre-signed URL" });
  }
});

export default router;
