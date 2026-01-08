import React, { useState } from "react";
import { Reply, MessageDirection } from "../../../shared/types/conversation";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { cn } from "../../utils/cn";

export interface ConversationItemProps {
    reply: Reply;
    onUpdate?: (reply: Reply) => void;
    onDelete?: (replyId: number) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
    reply,
    onUpdate,
    onDelete,
}) => {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editingDirection, setEditingDirection] = useState<MessageDirection>("received");

    // Flatten reply into individual messages
    const messages: Array<{
        direction: MessageDirection;
        text: string | null;
        datetime: Date | string | null;
        authorName: string;
    }> = [];

    if (reply.toMessage && reply.toDatetime) {
        messages.push({
            direction: "sent",
            text: reply.toMessage,
            datetime: reply.toDatetime,
            authorName: reply.staffName || "Dispatch User",
        });
    }

    if (reply.fromMessage && reply.fromDatetime) {
        messages.push({
            direction: "received",
            text: reply.fromMessage,
            datetime: reply.fromDatetime,
            authorName: reply.user?.name || "Manager User",
        });
    }

    // Sort messages by datetime
    messages.sort((a, b) => {
        const dateA = a.datetime ? new Date(a.datetime).getTime() : 0;
        const dateB = b.datetime ? new Date(b.datetime).getTime() : 0;
        return dateA - dateB;
    });

    const isOwnMessage = user?.id === reply.userId;

    // Check if message is within 1 hour edit window
    const isWithinEditWindow = (datetime: Date | string | null): boolean => {
        if (!datetime) return false;
        const messageDate = typeof datetime === "string" ? new Date(datetime) : datetime;
        const now = new Date();
        const hoursSincePosted = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
        return hoursSincePosted <= 1;
    };

    // Format timestamp with locale support
    const formatTimestamp = (date: Date | string | null): string => {
        if (!date) return "";

        try {
            const dateObj = typeof date === "string" ? new Date(date) : date;

            if (lang === "ja") {
                return dateObj.toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else {
                return dateObj.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }
        } catch {
            return "";
        }
    };

    // Get user initials for avatar
    const getUserInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleEdit = (direction: MessageDirection, text: string) => {
        setEditText(text || "");
        setEditingDirection(direction);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (editText.trim() && onUpdate) {
            const updatedReply: Reply = {
                ...reply,
                ...(editingDirection === "sent"
                    ? { toMessage: editText.trim() }
                    : { fromMessage: editText.trim() }),
            };
            onUpdate(updatedReply);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText("");
    };

    const handleDelete = () => {
        if (onDelete && window.confirm(t("conversation.confirmations.deleteMessage"))) {
            onDelete(reply.id);
        }
    };

    // Render individual message bubble
    const renderMessageBubble = (message: {
        direction: MessageDirection;
        text: string | null;
        datetime: Date | string | null;
        authorName: string;
    }, index: number) => {
        const direction = message.direction;
        const messageText = message.text;
        const messageDate = message.datetime;

        // Check if this specific message is owned by the current user
        // "sent" messages (toMessage) are from dispatch app (no userId check)
        // "received" messages (fromMessage) are from manager app (check userId)
        const isThisMessageOwned = direction === "received" && isOwnMessage;

        return (
            <div
                key={`${reply.id}-${direction}-${index}`}
                className={cn(
                    "flex gap-2 sm:gap-3 mb-3 sm:mb-4",
                    direction === "sent" ? "flex-row-reverse pr-4" : "flex-row"
                )}
            >
                {/* User Avatar */}
                <div
                    className={cn(
                        "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm",
                        direction === "sent"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                    )}
                >
                    {getUserInitials(message.authorName)}
                </div>

                {/* Message Content */}
                <div
                    className={cn(
                        "flex-1 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
                        direction === "sent" ? "items-end" : "items-start"
                    )}
                >
                    {/* User Name and Timestamp */}
                    <div
                        className={cn(
                            "flex flex-col sm:flex-row items-start sm:items-baseline gap-0 sm:gap-2 mb-1",
                            direction === "sent" ? "sm:flex-row-reverse items-end sm:items-baseline" : "flex-row"
                        )}
                    >
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {message.authorName}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                            {formatTimestamp(messageDate)}
                        </span>
                    </div>

                    {/* Message Bubble */}
                    {isEditing && editingDirection === direction ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1.5 sm:py-1 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                                >
                                    {t("conversation.labels.save")}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 sm:py-1 text-xs sm:text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 active:bg-gray-500 transition-colors touch-manipulation"
                                >
                                    {t("conversation.labels.cancel")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "relative p-2.5 sm:p-3 rounded-lg shadow-sm",
                                direction === "sent"
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-white border border-gray-200"
                            )}
                            style={{
                                backdropFilter: "blur(10px)",
                                backgroundColor: direction === "sent"
                                    ? "rgba(239, 246, 255, 0.9)"
                                    : "rgba(255, 255, 255, 0.9)",
                            }}
                        >
                            <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap break-words">
                                {messageText}
                            </p>

                            {/* Edit/Delete Actions for Own Messages (within 1 hour) */}
                            {isThisMessageOwned && (onUpdate || onDelete) && isWithinEditWindow(messageDate) && (
                                <div
                                    className={cn(
                                        "flex gap-3 sm:gap-2 mt-2 pt-2 border-t border-gray-200"
                                    )}
                                >
                                    {onUpdate && (
                                        <button
                                            onClick={() => handleEdit(direction, messageText || "")}
                                            className="text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 hover:underline touch-manipulation py-1"
                                        >
                                            {t("conversation.labels.edit")}
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={handleDelete}
                                            className="text-xs text-red-600 hover:text-red-800 active:text-red-900 hover:underline touch-manipulation py-1"
                                        >
                                            {t("conversation.labels.delete")}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {messages.map((message, index) => renderMessageBubble(message, index))}
        </>
    );
};
