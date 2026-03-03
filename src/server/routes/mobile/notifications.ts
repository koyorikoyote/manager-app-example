import express from "express";
import prisma from "../../lib/prisma";
import { authenticateMobile, verifyMobileToken } from "../../middleware/authMobile";
import { fetchNotificationsForUser } from "../../services/notificationService";

const router = express.Router();

// SSE poll interval in ms — server checks DB every 5 seconds for changes
const SSE_POLL_MS = 5000;
// Heartbeat every 25s to keep the connection alive through proxies/load balancers
const SSE_HEARTBEAT_MS = 25000;

/**
 * GET /api/mobile/notifications
 * REST fallback — returns current unread notifications snapshot
 */
router.get("/", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (
      req as unknown as { mobileUser: { id: number; email: string } }
    ).mobileUser;

    const userWithStaff = await prisma.mobileUser.findUnique({
      where: { id: mobileUser.id },
      select: { staffId: true },
    });

    if (!userWithStaff?.staffId) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 20 },
      });
    }

    const notifications = await fetchNotificationsForUser(userWithStaff.staffId);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        total: notifications.length,
        page: 1,
        limit: 20,
      },
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications" });
  }
});

/**
 * GET /api/mobile/notifications/stream?token=<jwt>
 * SSE streaming endpoint — pushes notification updates to the client.
 * Token is passed as a query param since EventSource / fetch-SSE clients
 * cannot set custom Authorization headers on the initial handshake.
 */
router.get("/stream", async (req, res) => {
  // Validate JWT from query param
  const token = req.query.token as string | undefined;
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }

  let staffId: number;
  try {
    const decoded = verifyMobileToken(token);

    const userWithStaff = await prisma.mobileUser.findUnique({
      where: { id: decoded.sub },
      select: { staffId: true },
    });

    if (!userWithStaff?.staffId) {
      return res.status(403).json({ success: false, error: "No staff linked" });
    }
    staffId = userWithStaff.staffId;
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  const sendEvent = (eventName: string, data: unknown) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial snapshot immediately
  try {
    const initial = await fetchNotificationsForUser(staffId);
    sendEvent("snapshot", { notifications: initial });
  } catch (err) {
    console.error("SSE initial snapshot error:", err);
    sendEvent("error", { message: "Failed to fetch notifications" });
  }

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, SSE_HEARTBEAT_MS);

  // Track a stable fingerprint to detect changes
  let lastFingerprint = "";

  const buildFingerprint = (notifications: { messageReplyId: number; recordId: number; tableName: string }[]) =>
    notifications.map((n) => `${n.tableName}:${n.recordId}:${n.messageReplyId}`).join("|");

  // Periodic DB poll — push update only when data changes
  const poller = setInterval(async () => {
    try {
      const notifications = await fetchNotificationsForUser(staffId);
      const fingerprint = buildFingerprint(notifications);
      if (fingerprint !== lastFingerprint) {
        lastFingerprint = fingerprint;
        sendEvent("update", { notifications });
      }
    } catch (err) {
      console.error("SSE poll error:", err);
    }
  }, SSE_POLL_MS);

  // Clean up when client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(poller);
  });
});

export default router;
