import React, { useState, useEffect, useCallback, useRef } from "react";
import { Reply } from "../../../shared/types/conversation";
import { ConversationItem } from "./ConversationItem";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiClient, getErrorMessage } from "../../services/apiClient";
import { useToast } from "../../contexts/ToastContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { OfflineIndicator } from "../ui/OfflineIndicator";

export interface ConversationSectionProps {
    parentType: "inquiry" | "dailyRecord" | "complaint" | "interaction";
    parentId: number;
    initialReplies?: Reply[];
    onRepliesUpdate?: (replies: Reply[]) => void;
}

interface ConversationSectionState {
    replies: Reply[];
    messageText: string;
    isLoading: boolean;
    isSubmitting: boolean;
    isLoadingMore: boolean;
    error: string | null;
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

interface CachedConversation {
    replies: Reply[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    timestamp: number;
}

// Global cache for conversation data
const conversationCache = new Map<string, CachedConversation>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

export const ConversationSection: React.FC<ConversationSectionProps> = ({
    parentType,
    parentId,
    initialReplies = [],
    onRepliesUpdate,
}) => {
    const { t } = useLanguage();
    const { showError, showSuccess } = useToast();
    const { isOnline } = useNetworkStatus();

    const [state, setState] = useState<ConversationSectionState>({
        replies: initialReplies,
        messageText: "",
        isLoading: false,
        isSubmitting: false,
        isLoadingMore: false,
        error: null,
        pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
        },
    });

    // Ref for scroll container
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Ref to track if we should auto-scroll (used for pagination)
    const shouldAutoScrollRef = useRef<boolean>(true);

    // Generate cache key for this conversation
    const getCacheKey = useCallback(() => {
        return `${parentType}-${parentId}`;
    }, [parentType, parentId]);

    // Construct API endpoint based on parent type
    const getEndpoint = useCallback(() => {
        if (parentType === "inquiry") {
            return `/inquiries/${parentId}/replies`;
        } else if (parentType === "dailyRecord") {
            return `/daily-records/${parentId}/replies`;
        } else if (parentType === "complaint") {
            return `/complaints/${parentId}/replies`;
        } else if (parentType === "interaction") {
            return `/interactions/${parentId}/replies`;
        }
        return `/daily-records/${parentId}/replies`;
    }, [parentType, parentId]);

    // Get cached conversation data
    const getCachedData = useCallback(() => {
        const cacheKey = getCacheKey();
        const cached = conversationCache.get(cacheKey);

        if (!cached) {
            return null;
        }

        // Check if cache has expired
        const now = Date.now();
        if (now - cached.timestamp > CACHE_EXPIRATION_MS) {
            conversationCache.delete(cacheKey);
            return null;
        }

        return cached;
    }, [getCacheKey]);

    // Set cached conversation data
    const setCachedData = useCallback((replies: Reply[], pagination: ConversationSectionState['pagination']) => {
        const cacheKey = getCacheKey();
        conversationCache.set(cacheKey, {
            replies,
            pagination,
            timestamp: Date.now(),
        });
    }, [getCacheKey]);

    // Invalidate cache for this conversation
    const invalidateCache = useCallback(() => {
        const cacheKey = getCacheKey();
        conversationCache.delete(cacheKey);
    }, [getCacheKey]);

    // Scroll to bottom of conversation
    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: smooth ? "smooth" : "auto",
            });
        }
    }, []);

    // Load replies from API with pagination
    const loadReplies = useCallback(async (loadMore = false, forceRefresh = false) => {
        // Check network status before attempting to load
        if (!isOnline) {
            setState((prev) => ({
                ...prev,
                error: t("conversation.errors.offline"),
            }));
            return;
        }

        // Check cache first if not loading more and not forcing refresh
        if (!loadMore && !forceRefresh) {
            const cachedData = getCachedData();
            if (cachedData) {
                setState((prev) => ({
                    ...prev,
                    replies: cachedData.replies,
                    pagination: cachedData.pagination,
                    isLoading: false,
                }));

                if (onRepliesUpdate) {
                    onRepliesUpdate(cachedData.replies);
                }
                return;
            }
        }

        // Get current offset before async operation
        let currentOffset = 0;
        setState((prev) => {
            currentOffset = loadMore ? prev.pagination.offset + prev.pagination.limit : 0;
            return {
                ...prev,
                isLoading: !loadMore,
                isLoadingMore: loadMore,
                error: null
            };
        });

        try {
            const response = await apiClient.get<Reply[]>(
                `${getEndpoint()}?limit=20&offset=${currentOffset}`
            );

            if (response.success && response.data) {
                setState((current) => {
                    const newReplies = loadMore
                        ? [...response.data!, ...current.replies]
                        : response.data!;

                    const newPagination = {
                        ...current.pagination,
                        total: response.pagination?.total || 0,
                        offset: currentOffset,
                        hasMore: response.pagination?.hasMore || false,
                    };

                    // Cache the data
                    setCachedData(newReplies, newPagination);

                    if (onRepliesUpdate) {
                        onRepliesUpdate(newReplies);
                    }

                    return {
                        ...current,
                        replies: newReplies,
                        isLoading: false,
                        isLoadingMore: false,
                        pagination: newPagination,
                    };
                });
            }
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            setState((current) => ({
                ...current,
                isLoading: false,
                isLoadingMore: false,
                error: errorMsg,
            }));

            // Check if it's an authorization error
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401 || err.response?.status === 403) {
                showError(
                    t("conversation.errors.authError"),
                    t("conversation.errors.authErrorMessage")
                );
                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                showError(
                    t("conversation.errors.loadFailed"),
                    errorMsg
                );
            }
        }
    }, [getEndpoint, onRepliesUpdate, isOnline, t, showError, getCachedData, setCachedData]);

    // Load replies on mount and when parentId changes
    useEffect(() => {
        if (initialReplies.length === 0 && parentId) {
            loadReplies(false, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentId]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (!state.isLoadingMore && state.pagination.hasMore) {
            // Store current scroll position
            const scrollContainer = scrollContainerRef.current;
            if (scrollContainer) {
                const scrollHeightBefore = scrollContainer.scrollHeight;
                const scrollTopBefore = scrollContainer.scrollTop;

                loadReplies(true).then(() => {
                    // Restore scroll position after loading more
                    setTimeout(() => {
                        if (scrollContainer) {
                            const scrollHeightAfter = scrollContainer.scrollHeight;
                            const scrollHeightDiff = scrollHeightAfter - scrollHeightBefore;
                            scrollContainer.scrollTop = scrollTopBefore + scrollHeightDiff;
                        }
                    }, 50);
                });
            } else {
                loadReplies(true);
            }
        }
    }, [state.isLoadingMore, state.pagination.hasMore, loadReplies]);

    // Scroll to bottom when replies are loaded initially
    useEffect(() => {
        if (state.replies.length > 0 && !state.isLoading) {
            // Scroll without animation on initial load
            setTimeout(() => {
                scrollToBottom(false);
            }, 100);
        }
    }, [state.replies.length, state.isLoading, scrollToBottom]);

    // Handle scroll to track if user has scrolled up (for pagination)
    const handleScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // User is at bottom if within 50px of bottom
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            shouldAutoScrollRef.current = isAtBottom;
        }
    }, []);

    // Handle submit reply
    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate message text
        const trimmedText = state.messageText.trim();
        if (!trimmedText) {
            setState((prev) => ({
                ...prev,
                error: t("conversation.errors.emptyMessage"),
            }));
            return;
        }

        // Check network status before attempting to send
        if (!isOnline) {
            showError(
                t("conversation.errors.offline"),
                t("conversation.errors.offlineMessage")
            );
            return;
        }

        // Store message text in case of failure
        const messageToSend = trimmedText;
        setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

        try {
            const response = await apiClient.post<Reply>(getEndpoint(), {
                messageText: messageToSend,
            });

            if (response.success && response.data) {
                // Check if reply already exists and update it, otherwise add new
                const existingIndex = state.replies.findIndex(r => r.id === response.data!.id);
                const newReplies = existingIndex >= 0
                    ? state.replies.map((r, i) => i === existingIndex ? response.data! : r)
                    : [...state.replies, response.data];

                // Invalidate cache when new message is added
                invalidateCache();

                setState((prev) => ({
                    ...prev,
                    replies: newReplies,
                    messageText: "",
                    isSubmitting: false,
                }));

                if (onRepliesUpdate) {
                    onRepliesUpdate(newReplies);
                }

                // Scroll to bottom to show new message
                // Use setTimeout to ensure DOM has updated
                setTimeout(() => {
                    scrollToBottom(true);
                }, 100);
            }
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);

            // Preserve message text on failure
            setState((prev) => ({
                ...prev,
                isSubmitting: false,
                error: errorMsg,
                messageText: messageToSend,
            }));

            // Check if it's an authorization error
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401 || err.response?.status === 403) {
                showError(
                    t("conversation.errors.authError"),
                    t("conversation.errors.authErrorMessage")
                );
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                showError(
                    t("conversation.errors.sendFailed"),
                    errorMsg
                );
            }
        }
    };

    // Handle reply update
    const handleReplyUpdate = async (updatedReply: Reply) => {
        // Check network status
        if (!isOnline) {
            showError(
                t("conversation.errors.offline"),
                t("conversation.errors.offlineMessage")
            );
            return;
        }

        try {
            const response = await apiClient.put<Reply>(
                `${getEndpoint()}/${updatedReply.id}`,
                {
                    messageText:
                        updatedReply.toMessage || updatedReply.fromMessage || "",
                }
            );

            if (response.success && response.data) {
                // Update reply in local state
                const updatedReplies = state.replies.map((reply) =>
                    reply.id === updatedReply.id ? response.data! : reply
                );

                // Invalidate cache when message is updated
                invalidateCache();

                setState((prev) => ({ ...prev, replies: updatedReplies }));

                if (onRepliesUpdate) {
                    onRepliesUpdate(updatedReplies);
                }

                showSuccess(t("conversation.success.messageUpdated"));
            }
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            setState((prev) => ({ ...prev, error: errorMsg }));

            // Check if it's an authorization error
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401 || err.response?.status === 403) {
                showError(
                    t("conversation.errors.authError"),
                    t("conversation.errors.authErrorMessage")
                );
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                showError(
                    t("conversation.errors.updateFailed"),
                    errorMsg
                );
            }
        }
    };

    // Handle reply delete
    const handleReplyDelete = async (replyId: number) => {
        // Check network status
        if (!isOnline) {
            showError(
                t("conversation.errors.offline"),
                t("conversation.errors.offlineMessage")
            );
            return;
        }

        try {
            const response = await apiClient.delete(
                `${getEndpoint()}/${replyId}`
            );

            if (response.success) {
                // Invalidate cache when message is deleted
                invalidateCache();

                // Reload replies to get updated state from server
                await loadReplies(false, true);

                showSuccess(t("conversation.success.messageDeleted"));
            }
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            setState((prev) => ({ ...prev, error: errorMsg }));

            // Check if it's an authorization error
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401 || err.response?.status === 403) {
                showError(
                    t("conversation.errors.authError"),
                    t("conversation.errors.authErrorMessage")
                );
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                showError(
                    t("conversation.errors.deleteFailed"),
                    errorMsg
                );
            }
        }
    };

    return (
        <div
            className="mt-4 sm:mt-6 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200"
            style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t("conversation.title")}
                </h3>
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {t("conversation.messageCount", { count: state.replies.length })}
                </span>
            </div>

            {/* Offline Indicator */}
            {!isOnline && (
                <div className="mb-4">
                    <OfflineIndicator />
                </div>
            )}

            {/* Error Display with Retry */}
            {state.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-red-800 flex-1">{state.error}</p>
                        {!state.isLoading && (
                            <button
                                onClick={() => loadReplies(false)}
                                className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium underline flex-shrink-0 self-end sm:self-auto"
                            >
                                {t("conversation.actions.retry")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {state.isLoading && (
                <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">
                        {t("conversation.loading")}
                    </span>
                </div>
            )}

            {/* Empty State */}
            {!state.isLoading && state.replies.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                    <p className="text-sm sm:text-base text-gray-500">
                        {t("conversation.emptyState.noMessages")}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t("conversation.emptyState.startConversation")}
                    </p>
                </div>
            )}

            {/* Conversation List */}
            {!state.isLoading && state.replies.length > 0 && (
                <div className="mb-4">
                    {/* Load More Button */}
                    {state.pagination.hasMore && (
                        <div className="mb-3 flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={state.isLoadingMore}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {state.isLoadingMore
                                    ? t("conversation.actions.loadingMore")
                                    : t("conversation.actions.loadMore")}
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto space-y-2 sm:space-y-3"
                    >
                        {state.replies.map((reply) => (
                            <ConversationItem
                                key={reply.id}
                                reply={reply}
                                onUpdate={handleReplyUpdate}
                                onDelete={handleReplyDelete}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleSubmitReply} className="mt-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <textarea
                        value={state.messageText}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                messageText: e.target.value,
                                error: null,
                            }))
                        }
                        placeholder={t("conversation.labels.typeMessage")}
                        className="flex-1 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px] sm:min-h-0"
                        rows={3}
                        disabled={state.isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={state.isSubmitting || !state.messageText.trim()}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed h-fit touch-manipulation"
                    >
                        {state.isSubmitting
                            ? t("conversation.labels.sending")
                            : t("conversation.labels.reply")}
                    </button>
                </div>
            </form>
        </div>
    );
};
