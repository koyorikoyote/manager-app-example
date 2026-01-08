import express from "express";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { conversationSchemas } from "../middleware/validation";
import conversationService from "../services/ConversationService";

const router = express.Router({ mergeParams: true });

// GET /api/inquiries/:id/replies - Get all replies for an inquiry
router.get(
  "/",
  authenticateToken,
  validateRequest({
    params: conversationSchemas.parentIdParam,
    query: conversationSchemas.getRepliesQuery,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query as unknown as {
        limit: number;
        offset: number;
      };
      const inquiryId = parseInt(id);

      const [replies, totalCount] = await Promise.all([
        conversationService.getReplies("inquiry", inquiryId, { limit, offset }),
        conversationService.getRepliesCount("inquiry", inquiryId),
      ]);

      res.json({
        success: true,
        data: replies,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + replies.length < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching inquiry replies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch replies",
      });
    }
  }
);

// POST /api/inquiries/:id/replies - Create new reply for an inquiry
router.post(
  "/",
  authenticateToken,
  validateRequest({
    params: conversationSchemas.parentIdParam,
    body: conversationSchemas.createReply,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const inquiryId = parseInt(id);
      const { messageText } = req.body;
      const userId = req.user!.id;

      const reply = await conversationService.createReply(
        "inquiry",
        inquiryId,
        userId,
        messageText
      );

      res.status(201).json({
        success: true,
        data: reply,
      });
    } catch (error) {
      console.error("Error creating inquiry reply:", error);

      if (error instanceof Error) {
        if (error.message === "Inquiry not found") {
          return res.status(404).json({
            success: false,
            message: "Inquiry not found",
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to create reply",
      });
    }
  }
);

// PUT /api/inquiries/:id/replies/:replyId - Update existing reply
router.put(
  "/:replyId",
  authenticateToken,
  validateRequest({
    params: conversationSchemas.parentAndReplyIdParams,
    body: conversationSchemas.updateReply,
  }),
  async (req, res) => {
    try {
      const { replyId } = req.params;
      const { messageText } = req.body;
      const userId = req.user!.id;

      const { id } = req.params;
      const inquiryId = parseInt(id);

      const reply = await conversationService.updateReply(
        parseInt(replyId),
        messageText,
        userId,
        "inquiry",
        inquiryId,
        { fromDispatchApp: false }
      );

      res.json({
        success: true,
        data: reply,
      });
    } catch (error) {
      console.error("Error updating inquiry reply:", error);

      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({
            success: false,
            message: "Reply not found",
          });
        }
        if (error.message.includes("Unauthorized")) {
          return res.status(403).json({
            success: false,
            message: "You can only edit your own messages",
          });
        }
        if (error.message.includes("Time limit exceeded")) {
          return res.status(403).json({
            success: false,
            message: "Messages can only be edited within 1 hour of posting",
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to update reply",
      });
    }
  }
);

// DELETE /api/inquiries/:id/replies/:replyId - Delete reply
router.delete(
  "/:replyId",
  authenticateToken,
  validateRequest({
    params: conversationSchemas.parentAndReplyIdParams,
  }),
  async (req, res) => {
    try {
      const { id, replyId } = req.params;
      const inquiryId = parseInt(id);
      const userId = req.user!.id;

      await conversationService.deleteReply(
        parseInt(replyId),
        "inquiry",
        inquiryId,
        userId,
        { fromDispatchApp: false }
      );

      res.json({
        success: true,
        message: "Reply deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting inquiry reply:", error);

      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({
            success: false,
            message: "Reply not found",
          });
        }
        if (error.message.includes("Unauthorized")) {
          return res.status(403).json({
            success: false,
            message: "You can only delete your own messages",
          });
        }
        if (error.message.includes("Time limit exceeded")) {
          return res.status(403).json({
            success: false,
            message: "Messages can only be deleted within 1 hour of posting",
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete reply",
      });
    }
  }
);

export default router;
