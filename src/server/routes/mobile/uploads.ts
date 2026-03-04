import express from "express";
import multer from "multer";
import { authenticateMobile } from "../../middleware/authMobile";
import { uploadBufferToStorage as uploadBufferToDrive } from "../../lib/cloudStorage";
import { z } from "zod";

const router = express.Router();

const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const ALLOWED_MIME_EXACT = ["application/pdf"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed =
      ALLOWED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p)) ||
      ALLOWED_MIME_EXACT.includes(file.mimetype);
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

const UploadBodySchema = z.object({
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
 * Now a direct server-side upload (Google Drive has no presign equivalent).
 * Body: multipart/form-data with 'file' field + optional scope/refId/keyHint fields.
 * Returns: { success, data: { publicUrl, key } }
 */
router.post("/presign", authenticateMobile, upload.single("file"), async (req, res) => {
  try {
    const mobileUser = (req as unknown as { mobileUser: { id: number } }).mobileUser;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const bodyParsed = UploadBodySchema.safeParse(req.body ?? {});
    const { scope, refId, keyHint } = bodyParsed.success ? bodyParsed.data : {};

    const safeScope = scope === "comment" ? "comments" : "submissions";
    const hint =
      typeof keyHint === "string" && keyHint.trim().length > 0
        ? `-${keyHint.trim().replace(/[^a-zA-Z0-9-_]/g, "")}`
        : "";
    const now = Date.now();
    const random = Math.floor(Math.random() * 1e9);
    const ext = req.file.originalname.split(".").pop() || "bin";
    const filename = `mobile-${mobileUser.id}/${safeScope}/${refId ? `${refId}/` : ""}${now}-${random}${hint}.${ext}`;

    const publicUrl = await uploadBufferToDrive({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      filename,
    });

    return res.json({
      success: true,
      data: {
        publicUrl,
        key: filename,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request", details: err.issues });
    }
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, error: "Failed to upload file" });
  }
});

export default router;
