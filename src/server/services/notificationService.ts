import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export interface NotificationItem {
    id: number;
    tableName:
    | "inquiries"
    | "daily_record"
    | "interaction_records"
    | "complaint_details";
    recordId: number;
    updatedAt: Date;
    lastMessage: string;
    recordData: Record<string, unknown>;
    messageReplyId: number;
}

async function getLastUnreadReply(replyIds: unknown[]) {
    if (!Array.isArray(replyIds) || replyIds.length === 0) return null;

    const ids = replyIds.map((id) => Number(id)).filter((id) => !isNaN(id));
    if (ids.length === 0) return null;

    const unreadReplies = await prisma.messageReply.findMany({
        where: { id: { in: ids }, isRead: false },
        orderBy: { id: "desc" },
        take: 1,
    });

    return unreadReplies.length > 0 ? unreadReplies[0] : null;
}

export async function fetchNotificationsForUser(
    staffId: number
): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    const [complaints, dailyRecords, interactions, inquiries] = await Promise.all(
        [
            prisma.complaintDetail.findMany({
                where: {
                    recorderId: staffId,
                    repliesIdArray: { not: Prisma.JsonNull },
                },
                include: {
                    company: { select: { id: true, name: true } },
                    responder: { select: { id: true, name: true } },
                    recorder: { select: { id: true, name: true } },
                },
            }),
            prisma.dailyRecord.findMany({
                where: {
                    staffId: staffId,
                    repliesIdArray: { not: Prisma.JsonNull },
                },
                include: {
                    staff: { select: { id: true, name: true } },
                },
            }),
            prisma.interactionRecord.findMany({
                where: {
                    personInvolvedStaffId: staffId,
                    type: "DISCUSSION",
                    repliesIdArray: { not: Prisma.JsonNull },
                },
                include: {
                    company: { select: { id: true, name: true } },
                    personInvolved: { select: { id: true, name: true } },
                    userInCharge: { select: { id: true, name: true } },
                },
            }),
            prisma.inquiry.findMany({
                where: {
                    recorderId: staffId,
                    repliesIdArray: { not: Prisma.JsonNull },
                },
                include: {
                    company: { select: { id: true, name: true } },
                    responder: { select: { id: true, name: true } },
                    recorder: { select: { id: true, name: true } },
                },
            }),
        ]
    );

    for (const complaint of complaints) {
        const lastUnread = await getLastUnreadReply(
            complaint.repliesIdArray as unknown[]
        );
        if (lastUnread) {
            notifications.push({
                id: complaint.id,
                tableName: "complaint_details",
                recordId: complaint.id,
                updatedAt: complaint.updatedAt,
                lastMessage: lastUnread.fromMessage || lastUnread.toMessage || "",
                recordData: complaint as unknown as Record<string, unknown>,
                messageReplyId: lastUnread.id,
            });
        }
    }

    for (const record of dailyRecords) {
        const lastUnread = await getLastUnreadReply(
            record.repliesIdArray as unknown[]
        );
        if (lastUnread) {
            notifications.push({
                id: record.id,
                tableName: "daily_record",
                recordId: record.id,
                updatedAt: record.updatedAt,
                lastMessage: lastUnread.fromMessage || lastUnread.toMessage || "",
                recordData: record as unknown as Record<string, unknown>,
                messageReplyId: lastUnread.id,
            });
        }
    }

    for (const interaction of interactions) {
        const lastUnread = await getLastUnreadReply(
            interaction.repliesIdArray as unknown[]
        );
        if (lastUnread) {
            notifications.push({
                id: interaction.id,
                tableName: "interaction_records",
                recordId: interaction.id,
                updatedAt: interaction.updatedAt,
                lastMessage: lastUnread.fromMessage || lastUnread.toMessage || "",
                recordData: interaction as unknown as Record<string, unknown>,
                messageReplyId: lastUnread.id,
            });
        }
    }

    for (const inquiry of inquiries) {
        const lastUnread = await getLastUnreadReply(
            inquiry.repliesIdArray as unknown[]
        );
        if (lastUnread) {
            notifications.push({
                id: inquiry.id,
                tableName: "inquiries",
                recordId: inquiry.id,
                updatedAt: inquiry.updatedAt,
                lastMessage: lastUnread.fromMessage || lastUnread.toMessage || "",
                recordData: inquiry as unknown as Record<string, unknown>,
                messageReplyId: lastUnread.id,
            });
        }
    }

    notifications.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return notifications;
}
