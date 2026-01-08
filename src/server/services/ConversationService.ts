import { PrismaClient, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { Reply, MessageDirection } from "../../shared/types/conversation";

export class ConversationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Transform Prisma reply to Reply interface
   */
  private transformReply(reply: {
    id: number;
    toDatetime: Date | null;
    fromDatetime: Date | null;
    toMessage: string | null;
    fromMessage: string | null;
    userId: number | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: number;
      name: string;
      email: string;
    } | null;
  }): Reply {
    return {
      id: reply.id,
      toDatetime: reply.toDatetime,
      fromDatetime: reply.fromDatetime,
      toMessage: reply.toMessage,
      fromMessage: reply.fromMessage,
      userId: reply.userId || 0,
      user: reply.user
        ? {
            id: reply.user.id,
            name: reply.user.name,
            email: reply.user.email,
          }
        : {
            id: 0,
            name: "Dispatch User",
            email: "",
          },
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };
  }

  /**
   * Get staff information from parent record
   */
  private async getStaffInfo(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number
  ): Promise<{ staffName: string; staffId: number }> {
    let staffName = "Dispatch User";
    let staffId = 0;

    if (parentType === "inquiry") {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: parentId },
        include: { recorder: { select: { id: true, name: true } } },
      });
      if (inquiry?.recorder) {
        staffName = inquiry.recorder.name;
        staffId = inquiry.recorder.id;
      }
    } else if (parentType === "dailyRecord") {
      const dailyRecord = await this.prisma.dailyRecord.findUnique({
        where: { id: parentId },
        include: { staff: { select: { id: true, name: true } } },
      });
      if (dailyRecord?.staff) {
        staffName = dailyRecord.staff.name;
        staffId = dailyRecord.staff.id;
      }
    } else if (parentType === "complaint") {
      const complaint = await this.prisma.complaintDetail.findUnique({
        where: { id: parentId },
        include: { recorder: { select: { id: true, name: true } } },
      });
      if (complaint?.recorder) {
        staffName = complaint.recorder.name;
        staffId = complaint.recorder.id;
      }
    } else if (parentType === "interaction") {
      const interaction = await this.prisma.interactionRecord.findUnique({
        where: { id: parentId },
        include: { personInvolved: { select: { id: true, name: true } } },
      });
      if (interaction?.personInvolved) {
        staffName = interaction.personInvolved.name;
        staffId = interaction.personInvolved.id;
      }
    }

    return { staffName, staffId };
  }

  /**
   * Determine message direction based on user role and parent record
   * For Manager App: all messages are "received" type (from_* fields)
   */
  private async determineMessageDirection(
    userId: number,
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number
  ): Promise<MessageDirection> {
    // Verify parent record exists
    if (parentType === "inquiry") {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }
    } else if (parentType === "dailyRecord") {
      const dailyRecord = await this.prisma.dailyRecord.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!dailyRecord) {
        throw new Error("Daily record not found");
      }
    } else if (parentType === "complaint") {
      const complaint = await this.prisma.complaintDetail.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!complaint) {
        throw new Error("Complaint not found");
      }
    } else if (parentType === "interaction") {
      const interaction = await this.prisma.interactionRecord.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!interaction) {
        throw new Error("Interaction not found");
      }
    }

    // All messages from Manager App are "received" type
    return "received";
  }

  /**
   * Update parent record's replies_id_array
   */
  private async updateRepliesArray(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number,
    replyIds: number[]
  ): Promise<void> {
    if (parentType === "inquiry") {
      await this.prisma.inquiry.update({
        where: { id: parentId },
        data: { repliesIdArray: replyIds },
      });
    } else if (parentType === "dailyRecord") {
      await this.prisma.dailyRecord.update({
        where: { id: parentId },
        data: { repliesIdArray: replyIds },
      });
    } else if (parentType === "complaint") {
      await this.prisma.complaintDetail.update({
        where: { id: parentId },
        data: { repliesIdArray: replyIds },
      });
    } else if (parentType === "interaction") {
      await this.prisma.interactionRecord.update({
        where: { id: parentId },
        data: { repliesIdArray: replyIds },
      });
    }
  }

  /**
   * Get replies_id_array from parent record
   */
  private async getRepliesIdArray(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number
  ): Promise<number[]> {
    let repliesIdArray: unknown = null;

    if (parentType === "inquiry") {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: parentId },
        select: { repliesIdArray: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      repliesIdArray = inquiry.repliesIdArray;
    } else if (parentType === "dailyRecord") {
      const dailyRecord = await this.prisma.dailyRecord.findUnique({
        where: { id: parentId },
        select: { repliesIdArray: true },
      });

      if (!dailyRecord) {
        throw new Error("Daily record not found");
      }

      repliesIdArray = dailyRecord.repliesIdArray;
    } else if (parentType === "complaint") {
      const complaint = await this.prisma.complaintDetail.findUnique({
        where: { id: parentId },
        select: { repliesIdArray: true },
      });

      if (!complaint) {
        throw new Error("Complaint not found");
      }

      repliesIdArray = complaint.repliesIdArray;
    } else if (parentType === "interaction") {
      const interaction = await this.prisma.interactionRecord.findUnique({
        where: { id: parentId },
        select: { repliesIdArray: true },
      });

      if (!interaction) {
        throw new Error("Interaction not found");
      }

      repliesIdArray = interaction.repliesIdArray;
    }

    // Handle null or missing array
    if (!repliesIdArray) {
      return [];
    }

    // Parse JSON array
    return Array.isArray(repliesIdArray) ? repliesIdArray : [];
  }

  /**
   * Fetch all replies for a parent record with pagination
   */
  async getReplies(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Reply[]> {
    // Get reply IDs from parent record
    const replyIds = await this.getRepliesIdArray(parentType, parentId);

    if (replyIds.length === 0) {
      return [];
    }

    // Get staff information from parent record
    let staffName = "Dispatch User";
    let staffId = 0;

    if (parentType === "inquiry") {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: parentId },
        include: { recorder: { select: { id: true, name: true } } },
      });
      if (inquiry?.recorder) {
        staffName = inquiry.recorder.name;
        staffId = inquiry.recorder.id;
      }
    } else if (parentType === "dailyRecord") {
      const dailyRecord = await this.prisma.dailyRecord.findUnique({
        where: { id: parentId },
        include: { staff: { select: { id: true, name: true } } },
      });
      if (dailyRecord?.staff) {
        staffName = dailyRecord.staff.name;
        staffId = dailyRecord.staff.id;
      }
    } else if (parentType === "complaint") {
      const complaint = await this.prisma.complaintDetail.findUnique({
        where: { id: parentId },
        include: { recorder: { select: { id: true, name: true } } },
      });
      if (complaint?.recorder) {
        staffName = complaint.recorder.name;
        staffId = complaint.recorder.id;
      }
    } else if (parentType === "interaction") {
      const interaction = await this.prisma.interactionRecord.findUnique({
        where: { id: parentId },
        include: { personInvolved: { select: { id: true, name: true } } },
      });
      if (interaction?.personInvolved) {
        staffName = interaction.personInvolved.name;
        staffId = interaction.personInvolved.id;
      }
    }

    // Apply pagination to reply IDs
    // Sort IDs in descending order to get most recent first, then apply pagination
    const sortedIds = [...replyIds].reverse();
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const paginatedIds = sortedIds.slice(offset, offset + limit);

    // Fetch paginated reply records
    const replies = await this.prisma.messageReply.findMany({
      where: {
        id: { in: paginatedIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform replies with staff information for to_message
    return replies.map((reply) => {
      const transformed = this.transformReply(reply);
      // Add staff info as a separate field for to_message (dispatch app messages)
      return {
        ...transformed,
        staffName,
        staffId,
      } as Reply & { staffName: string; staffId: number };
    });
  }

  /**
   * Get total count of replies for a parent record
   */
  async getRepliesCount(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number
  ): Promise<number> {
    const replyIds = await this.getRepliesIdArray(parentType, parentId);
    return replyIds.length;
  }

  /**
   * Create new reply message or update existing one
   */
  async createReply(
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number,
    userId: number | null,
    messageText: string,
    options?: {
      fromDispatchApp?: boolean;
    }
  ): Promise<Reply> {
    // Determine message direction
    // Dispatch App messages are "sent" (to_* fields), Manager App messages are "received" (from_* fields)
    const direction = options?.fromDispatchApp ? "sent" : "received";

    // Get staff info for dispatch messages
    const { staffName, staffId } = await this.getStaffInfo(
      parentType,
      parentId
    );

    // Verify parent record exists
    if (parentType === "inquiry") {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!inquiry) throw new Error("Inquiry not found");
    } else if (parentType === "dailyRecord") {
      const dailyRecord = await this.prisma.dailyRecord.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!dailyRecord) throw new Error("Daily record not found");
    } else if (parentType === "complaint") {
      const complaint = await this.prisma.complaintDetail.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!complaint) throw new Error("Complaint not found");
    } else if (parentType === "interaction") {
      const interaction = await this.prisma.interactionRecord.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!interaction) throw new Error("Interaction not found");
    }

    // Get existing reply IDs
    const replyIds = await this.getRepliesIdArray(parentType, parentId);
    const now = new Date();

    // Check if we should update the latest reply instead of creating a new one
    if (replyIds.length > 0) {
      const latestReplyId = replyIds[replyIds.length - 1];
      const latestReply = await this.prisma.messageReply.findUnique({
        where: { id: latestReplyId },
        select: {
          id: true,
          toMessage: true,
          toDatetime: true,
          fromMessage: true,
          fromDatetime: true,
          userId: true,
        },
      });

      if (latestReply) {
        // If sending from dispatch app and to_message is empty, update it
        if (
          direction === "sent" &&
          !latestReply.toMessage &&
          !latestReply.toDatetime
        ) {
          const updatedReply = await this.prisma.messageReply.update({
            where: { id: latestReply.id },
            data: {
              toMessage: messageText,
              toDatetime: now,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          return {
            ...this.transformReply(updatedReply),
            staffName,
            staffId,
          } as Reply & { staffName: string; staffId: number };
        }

        // If sending from manager app and from_message is empty, update it
        if (
          direction === "received" &&
          !latestReply.fromMessage &&
          !latestReply.fromDatetime
        ) {
          const updateData: Prisma.MessageReplyUpdateInput = {
            fromMessage: messageText,
            fromDatetime: now,
          };

          // Only update userId if provided
          if (userId !== null) {
            updateData.user = { connect: { id: userId } };
          }

          const updatedReply = await this.prisma.messageReply.update({
            where: { id: latestReply.id },
            data: updateData,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          return {
            ...this.transformReply(updatedReply),
            staffName,
            staffId,
          } as Reply & { staffName: string; staffId: number };
        }
      }
    }

    // Create new reply record
    const replyData: Prisma.MessageReplyCreateInput = {
      toDatetime: direction === "sent" ? now : null,
      fromDatetime: direction === "received" ? now : null,
      toMessage: direction === "sent" ? messageText : null,
      fromMessage: direction === "received" ? messageText : null,
    };

    // Only connect user if userId is provided
    if (userId) {
      replyData.user = { connect: { id: userId } };
    }

    const reply = await this.prisma.messageReply.create({
      data: replyData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update parent record's replies_id_array
    const updatedReplyIds = [...replyIds, reply.id];
    await this.updateRepliesArray(parentType, parentId, updatedReplyIds);

    return {
      ...this.transformReply(reply),
      staffName,
      staffId,
    } as Reply & { staffName: string; staffId: number };
  }

  /**
   * Update existing reply message
   */
  async updateReply(
    replyId: number,
    messageText: string,
    userId: number | null,
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number,
    options?: {
      fromDispatchApp?: boolean;
    }
  ): Promise<Reply> {
    // Get staff info for dispatch messages
    const { staffName, staffId } = await this.getStaffInfo(
      parentType,
      parentId
    );
    // Get existing reply to check ownership and timestamp
    const existingReply = await this.prisma.messageReply.findUnique({
      where: { id: replyId },
      select: {
        userId: true,
        toMessage: true,
        fromMessage: true,
        toDatetime: true,
        fromDatetime: true,
      },
    });

    if (!existingReply) {
      throw new Error("Reply not found");
    }

    // Determine which message field we're editing
    const isEditingDispatchMessage = options?.fromDispatchApp === true;
    const isEditingManagerMessage = options?.fromDispatchApp === false;

    // Authorization check based on which message is being edited
    if (isEditingDispatchMessage) {
      // Editing toMessage - no userId check needed for dispatch app
      if (!existingReply.toMessage) {
        throw new Error("Unauthorized: No dispatch message to edit");
      }
    } else if (isEditingManagerMessage) {
      // Editing fromMessage - check userId matches
      if (!existingReply.fromMessage) {
        throw new Error("Unauthorized: No manager message to edit");
      }
      if (existingReply.userId !== userId) {
        throw new Error("Unauthorized: You can only edit your own messages");
      }
    }

    // Time limit check: only allow editing within 1 hour
    const now = new Date();
    const messageTimestamp = isEditingDispatchMessage
      ? existingReply.toDatetime
      : existingReply.fromDatetime;

    if (messageTimestamp) {
      const hoursSincePosted =
        (now.getTime() - new Date(messageTimestamp).getTime()) /
        (1000 * 60 * 60);
      if (hoursSincePosted > 1) {
        throw new Error(
          "Time limit exceeded: Messages can only be edited within 1 hour of posting"
        );
      }
    }

    // Determine which field to update
    const updateData: Prisma.MessageReplyUpdateInput = {};
    if (isEditingDispatchMessage) {
      updateData.toMessage = messageText;
    } else if (isEditingManagerMessage) {
      updateData.fromMessage = messageText;
    }

    const reply = await this.prisma.messageReply.update({
      where: { id: replyId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      ...this.transformReply(reply),
      staffName,
      staffId,
    } as Reply & { staffName: string; staffId: number };
  }

  /**
   * Delete reply message
   */
  async deleteReply(
    replyId: number,
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction",
    parentId: number,
    userId: number | null,
    options?: {
      fromDispatchApp?: boolean;
    }
  ): Promise<void> {
    // Get existing reply to check ownership and timestamp
    const existingReply = await this.prisma.messageReply.findUnique({
      where: { id: replyId },
      select: {
        userId: true,
        toMessage: true,
        fromMessage: true,
        toDatetime: true,
        fromDatetime: true,
      },
    });

    if (!existingReply) {
      throw new Error("Reply not found");
    }

    // Determine which message field we're deleting
    const isDeletingDispatchMessage = options?.fromDispatchApp === true;
    const isDeletingManagerMessage = options?.fromDispatchApp === false;

    // Authorization check based on which message is being deleted
    if (isDeletingDispatchMessage) {
      // Deleting toMessage - no userId check needed for dispatch app
      if (!existingReply.toMessage) {
        throw new Error("Unauthorized: No dispatch message to delete");
      }
    } else if (isDeletingManagerMessage) {
      // Deleting fromMessage - check userId matches
      if (!existingReply.fromMessage) {
        throw new Error("Unauthorized: No manager message to delete");
      }
      if (existingReply.userId !== userId) {
        throw new Error("Unauthorized: You can only delete your own messages");
      }
    }

    // Time limit check: only allow deleting within 1 hour
    const now = new Date();
    const messageTimestamp = isDeletingDispatchMessage
      ? existingReply.toDatetime
      : existingReply.fromDatetime;

    if (messageTimestamp) {
      const hoursSincePosted =
        (now.getTime() - new Date(messageTimestamp).getTime()) /
        (1000 * 60 * 60);
      if (hoursSincePosted > 1) {
        throw new Error(
          "Time limit exceeded: Messages can only be deleted within 1 hour of posting"
        );
      }
    }

    // Check if the other message exists
    const hasOtherMessage = isDeletingDispatchMessage
      ? existingReply.fromMessage !== null && existingReply.fromMessage !== ""
      : existingReply.toMessage !== null && existingReply.toMessage !== "";

    if (hasOtherMessage) {
      // If the other message exists, just null out this message field
      const updateData: Prisma.MessageReplyUpdateInput = {};
      if (isDeletingDispatchMessage) {
        updateData.toMessage = null;
        updateData.toDatetime = null;
      } else if (isDeletingManagerMessage) {
        updateData.fromMessage = null;
        updateData.fromDatetime = null;
      }

      await this.prisma.messageReply.update({
        where: { id: replyId },
        data: updateData,
      });
    } else {
      // If no other message exists, delete the entire record
      await this.prisma.messageReply.delete({
        where: { id: replyId },
      });

      // Update parent record's replies_id_array to remove the deleted ID
      const currentReplyIds = await this.getRepliesIdArray(
        parentType,
        parentId
      );
      const updatedReplyIds = currentReplyIds.filter((id) => id !== replyId);
      await this.updateRepliesArray(parentType, parentId, updatedReplyIds);
    }
  }
}

export default new ConversationService();
