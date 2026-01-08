import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile } from "../../middleware/authMobile";

const router = express.Router();

/**
 * PUT /api/mobile/message-replies/:id/mark-read
 * Marks a message reply as read
 */
router.put("/:id/mark-read", authenticateMobile, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const messageReply = await (prisma as any).messageReply.findUnique({
      where: { id },
    });

    if (!messageReply) {
      return res
        .status(404)
        .json({ success: false, error: "Message reply not found" });
    }

    const updated = await (prisma as any).messageReply.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Mark message as read error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to mark message as read" });
  }
});

export default router;
