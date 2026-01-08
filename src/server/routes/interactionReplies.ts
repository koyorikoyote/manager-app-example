import express from "express";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { conversationSchemas } from "../middleware/validation";
import conversationService from "../services/ConversationService";

const router = express.Router({ mergeParams: true });

// GET /api/interactions/:id/replies - Get all replies for an interaction
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
      const interactionId = parseInt(id);

      const [replies, totalCount] = await Promise.all([
        conversationService.getReplies("interaction", interactionId, {
          limit,
          offset,
        }),
        conversationService.getRepliesCount("interaction", interactionId),
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
      console.error("Error fetching interaction replies:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch replies",
      });
    }
  }
);

// POST /api/interactions/:id/replies - Create new reply for an interaction
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
      const interactionId = parseInt(id);
      const { messageText } = req.body;
      const userId = req.user!.id;

      const reply = await conversationService.createReply(
        "interaction",
        interactionId,
        userId,
        messageText
      );

      res.status(201).json({
        success: true,
        data: reply,
      });
    } catch (error) {
      console.error("Error creating interaction reply:", error);

      if (error instanceof Error) {
        if (error.message === "Interaction not found") {
          return res.status(404).json({
            success: false,
            message: "Interaction not found",
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

// PUT /api/interactions/:id/replies/:replyId - Update existing reply
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
      const interactionId = parseInt(id);

      const reply = await conversationService.updateReply(
        parseInt(replyId),
        messageText,
        userId,
        "interaction",
        interactionId,
        { fromDispatchApp: false }
      );

      res.json({
        success: true,
        data: reply,
      });
    } catch (error) {
      console.error("Error updating interaction reply:", error);

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

// DELETE /api/interactions/:id/replies/:replyId - Delete reply
router.delete(
  "/:replyId",
  authenticateToken,
  validateRequest({
    params: conversationSchemas.parentAndReplyIdParams,
  }),
  async (req, res) => {
    try {
      const { id, replyId } = req.params;
      const interactionId = parseInt(id);
      const userId = req.user!.id;

      await conversationService.deleteReply(
        parseInt(replyId),
        "interaction",
        interactionId,
        userId,
        { fromDispatchApp: false }
      );

      res.json({
        success: true,
        message: "Reply deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting interaction reply:", error);

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
