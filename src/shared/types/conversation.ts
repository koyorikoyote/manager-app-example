/**
 * Conversation type definitions for inquiry and daily record replies
 */

/**
 * Message direction type indicating if message is sent or received
 */
export type MessageDirection = "sent" | "received";

/**
 * Reply message interface with all message fields
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface Reply {
  id: number;
  toDatetime: Date | string | null;
  fromDatetime: Date | string | null;
  toMessage: string | null;
  fromMessage: string | null;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  staffName?: string;
  staffId?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * API request interface for creating a new reply
 */
export interface CreateReplyRequest {
  messageText: string;
}

/**
 * API response interface for creating a reply
 */
export interface CreateReplyResponse {
  success: boolean;
  data: Reply;
}

/**
 * API response interface for fetching replies
 */
export interface GetRepliesResponse {
  success: boolean;
  data: Reply[];
}

/**
 * API request interface for updating a reply
 */
export interface UpdateReplyRequest {
  messageText: string;
}

/**
 * API response interface for updating a reply
 */
export interface UpdateReplyResponse {
  success: boolean;
  data: Reply;
}

/**
 * API response interface for deleting a reply
 */
export interface DeleteReplyResponse {
  success: boolean;
}

/**
 * Error response interface for conversation API
 */
export interface ConversationErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}
