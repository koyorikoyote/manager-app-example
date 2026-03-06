import express from "express";
import path from "path";
import { renderToPipeableStream } from "react-dom/server";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { requestTiming } from "./middleware/requestTiming";
import {
  performanceCache,
  generateCacheKey,
  initializeCacheWarming,
} from "./utils/cache";
import { toJSTISOString } from "../shared/utils/jstDateUtils";

// Import routes
import authRoutes from "./routes/auth";
import staffRoutes from "./routes/staff";
import interactionRoutes from "./routes/interactions";
import documentRoutes from "./routes/documents";
import propertyRoutes from "./routes/properties";
import attendanceRoutes from "./routes/attendance";
import systemConfigurationRoutes from "./routes/systemConfigurations";
import userRoutes from "./routes/users";
import userManagementRoutes from "./routes/userManagement";
import mobileUsersRoutes from "./routes/mobileUsers";
import companyRoutes from "./routes/companies";
import manualRoutes from "./routes/manuals";
import complaintDetailsRoutes from "./routes/complaintDetails";
import dailyRecordRoutes from "./routes/dailyRecord";
import inquiriesRoutes from "./routes/inquiries";
import filtersRoutes from "./routes/filters";
import systemRoutes from "./routes/system";
import uploadRoutes from "./routes/upload";
import mobileAuthRoutes from "./routes/mobile/auth";
import mobileUploadRoutes from "./routes/mobile/uploads";
import mobileUploadDirectRoutes from "./routes/mobile/uploadDirect";
import mobileCompaniesRoutes from "./routes/mobile/companies";
import mobileNotificationsRoutes from "./routes/mobile/notifications";
import mobileInquiriesRoutes from "./routes/mobile/inquiries";
import mobileDailyRecordsRoutes from "./routes/mobile/dailyRecords";
import mobileInteractionRecordsRoutes from "./routes/mobile/interactionRecords";
import mobileComplaintDetailsRoutes from "./routes/mobile/complaintDetails";
import mobileMessageRepliesRoutes from "./routes/mobile/messageReplies";
import mobileSearchRoutes from "./routes/mobile/search";
import mobileSubmissionsRoutes from "./routes/mobile/submissions";
import mobileDocumentsRoutes from "./routes/mobile/documents";

// Import React App for SSR
import App from "../client/App";

function Html(props: { children?: React.ReactNode; initialData?: any }) {
  const serialized = JSON.stringify(props.initialData ?? null).replace(
    /</g,
    "\\u003c"
  );
  return React.createElement(
    "html",
    { lang: "en" },
    React.createElement(
      "head",
      null,
      React.createElement("meta", { charSet: "utf-8" }),
      React.createElement("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      }),
      React.createElement("link", { rel: "stylesheet", href: "/styles.css" }),
      React.createElement("title", null, "Manager App")
    ),
    React.createElement(
      "body",
      null,
      React.createElement("div", { id: "root" }, props.children),
      React.createElement("script", {
        dangerouslySetInnerHTML: {
          __html: `window.__INITIAL_DATA__=${serialized};`,
        },
      }),
      React.createElement("script", { src: "/main.js", defer: true })
    )
  );
}

const app = express();

// Middleware
app.use(requestTiming); // Add request timing first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow mobile app origins (Expo web, localhost, and production mobile apps)
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  // In production, only allow specific origins for security
  if (process.env.NODE_ENV === "production") {
    const allowedOrigins = [
      "http://localhost:19006", // Expo web dev
      "http://localhost:8081", // Expo dev server
      "exp://", // Expo Go app (prefix match)
      "capacitor://", // Capacitor apps
      "ionic://", // Ionic apps
      "file://", // Nativefier bundled .exe apps
      "https://dispatch-manager-prod.web.app", // Production Firebase Hosting
      "https://dispatch-manager-prod.firebaseapp.com", // Production Firebase Hosting
    ];

    // Check if origin matches allowed patterns
    const isAllowed =
      origin &&
      (allowedOrigins.some((allowed) => origin.startsWith(allowed)) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1"));

    // Native mobile apps (React Native, Expo) don't send Origin header
    // If no origin header, allow the request (mobile apps use Authorization header)
    if (isAllowed || !origin) {
      if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
      }
    }
  } else {
    // Development: allow all origins
    // For Android Emulator (10.0.2.2), checking origin might fail if it's treated as null or similar
    // Safest approach for dev is to reflect the origin or use *
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    } else {
      // Allow requests with no origin (like mobile apps)
      res.header("Access-Control-Allow-Origin", "*");
    }
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve static files in production (serve the client bundle built to dist/client)
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.resolve(__dirname, "../client");
  app.use(express.static(clientDistPath));
}

// Legacy local uploads serving removed; files are served via S3/CloudFront

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/system-configurations", systemConfigurationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/mobile-users", mobileUsersRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/manuals", manualRoutes);
app.use("/api/complaint-details", complaintDetailsRoutes);
app.use("/api/complaints", complaintDetailsRoutes); // Alias for plural form
app.use("/api/daily-record", dailyRecordRoutes);
app.use("/api/daily-records", dailyRecordRoutes); // Alias for plural form
app.use("/api/inquiries", inquiriesRoutes);
app.use("/api/filters", filtersRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/upload", uploadRoutes);

// Mobile API namespace
app.use("/api/mobile/auth", mobileAuthRoutes);
app.use("/api/mobile/uploads", mobileUploadRoutes);
app.use("/api/mobile/uploads", mobileUploadDirectRoutes); // Direct upload endpoint
app.use("/api/mobile/companies", mobileCompaniesRoutes);
app.use("/api/mobile/notifications", mobileNotificationsRoutes);
app.use("/api/mobile/inquiries", mobileInquiriesRoutes);
app.use("/api/mobile/daily-records", mobileDailyRecordsRoutes);
app.use("/api/mobile/interaction-records", mobileInteractionRecordsRoutes);
app.use("/api/mobile/complaint-details", mobileComplaintDetailsRoutes);
app.use("/api/mobile/message-replies", mobileMessageRepliesRoutes);
app.use("/api/mobile/search", mobileSearchRoutes);
app.use("/api/mobile/submissions", mobileSubmissionsRoutes);
app.use("/api/mobile/documents", mobileDocumentsRoutes);

/**
 * Health check endpoints
 * - /health: Fast 200 for load balancer health (no DB access)
 * - /api/health: JSON payload (includes DB status message)
 */
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    database: "Connected to MySQL via Prisma",
  });
});

// SSR Route with Prisma data fetching for different pages
app.get("/", async (req, res) => {
  await handleSSRRoute(req, res, "complaint-details");
});

// Dashboard redirect for backward compatibility
app.get("/dashboard", async (req, res) => {
  res.redirect(301, "/");
});

app.get("/residences", async (req, res) => {
  await handleSSRRoute(req, res, "properties");
});

// Alias: support plural detail route for SSR deep links
app.get("/residences/:id", async (req, res) => {
  await handleSSRRoute(req, res, "property-detail", {
    propertyId: req.params.id,
  });
});

// Alias: edit route uses same data as detail (client toggles edit mode)
app.get("/residences/:id/edit", async (req, res) => {
  await handleSSRRoute(req, res, "property-detail", {
    propertyId: req.params.id,
  });
});

// SSR skeleton for "new" routes (client handles form rendering)
app.get("/residences/new", async (req, res) => {
  await handleSSRRoute(req, res, "properties");
});
app.get("/residence/new", async (req, res) => {
  await handleSSRRoute(req, res, "properties");
});

// Legacy singular edit route alias
app.get("/residence/:id/edit", async (req, res) => {
  await handleSSRRoute(req, res, "property-detail", {
    propertyId: req.params.id,
  });
});

app.get("/residence/:id", async (req, res) => {
  await handleSSRRoute(req, res, "property-detail", {
    propertyId: req.params.id,
  });
});

app.get("/destinations", async (req, res) => {
  await handleSSRRoute(req, res, "destinations");
});

app.get("/destinations/:id", async (req, res) => {
  await handleSSRRoute(req, res, "company-detail", {
    companyId: req.params.id,
  });
});

// Legacy routes for backward compatibility
app.get("/properties", async (req, res) => {
  await handleSSRRoute(req, res, "properties");
});

app.get("/property/:id", async (req, res) => {
  await handleSSRRoute(req, res, "property-detail", {
    propertyId: req.params.id,
  });
});

app.get("/staff", async (req, res) => {
  await handleSSRRoute(req, res, "staff");
});

app.get("/staff/new", async (req, res) => {
  await handleSSRRoute(req, res, "staff-form");
});

app.get("/staff/:id", async (req, res) => {
  await handleSSRRoute(req, res, "staff-detail", { staffId: req.params.id });
});

app.get("/staff/:id/edit", async (req, res) => {
  await handleSSRRoute(req, res, "staff-form", { staffId: req.params.id });
});

app.get("/settings", async (req, res) => {
  await handleSSRRoute(req, res, "settings");
});

app.get("/manual", async (req, res) => {
  await handleSSRRoute(req, res, "manual");
});

app.get("/complaint-details", async (req, res) => {
  await handleSSRRoute(req, res, "complaint-details");
});

app.get("/complaint-details/:id", async (req, res) => {
  await handleSSRRoute(req, res, "complaint-detail", {
    complaintId: req.params.id,
  });
});

app.get("/daily-record", async (req, res) => {
  await handleSSRRoute(req, res, "daily-record");
});

app.get("/inquiries-notifications", async (req, res) => {
  await handleSSRRoute(req, res, "inquiries-notifications");
});

app.get("/inquiries-notifications/:id", async (req, res) => {
  await handleSSRRoute(req, res, "inquiry-detail", {
    inquiryId: req.params.id,
  });
});

// Catch-all handler for other routes (SPA routing) - temporarily disabled
// app.get("*", async (req, res) => {
//   if (process.env.NODE_ENV === "production") {
//     res.sendFile(path.join(__dirname, "../../dist/index.html"));
//   } else {
//     // In development, handle all routes with basic SSR
//     await handleSSRRoute(req, res, "default");
//   }
// });

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle SSR for different routes with appropriate data fetching
async function handleSSRRoute(
  req: express.Request,
  res: express.Response,
  routeType: string,
  params?: any
) {
  try {
    // Fetch initial data based on route type
    const dataFetchStart = Date.now();
    const initialData = await fetchInitialDataForRoute(routeType, params);
    const dataFetchTime = Date.now() - dataFetchStart;

    // Create React element with initial data wrapped in MemoryRouter for SSR
    // MemoryRouter avoids the react-router-dom/server subpath export, which is not available in v7
    const reactApp = React.createElement(
      Html,
      { initialData },
      React.createElement(
        MemoryRouter,
        { initialEntries: [req.url] },
        React.createElement(App, { initialData })
      )
    );

    const renderStart = Date.now();
    const { pipe, abort } = renderToPipeableStream(reactApp, {
      onShellReady() {
        const renderTime = Date.now() - renderStart;

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader(
          "X-SSR-Timing",
          `data:${dataFetchTime}ms,render:${renderTime}ms`
        );
        res.write("<!DOCTYPE html>");
        pipe(res);
      },
      onShellError(error) {
        console.error("SSR Shell Error:", error);
        res.status(500);
        res.send(
          "<!doctype html><html><body><h1>Server Error</h1></body></html>"
        );
      },
      onError(error) {
        console.error("SSR Error:", error);
      },
    });

    // Set timeout for SSR
    setTimeout(() => {
      abort();
    }, 10000); // 10 second timeout
  } catch (error) {
    console.error("SSR Data Fetch Error:", error);
    res.status(500);
    res.send("<!doctype html><html><body><h1>Server Error</h1></body></html>");
  }
}

// Define the return type for initial data
interface InitialData {
  routeType: string;
  stats: {
    users: number;
    staff: number;
    properties: number;
  };
  timestamp: string;
  error?: string;
  properties?: any[];
  companies?: any[];
  complaintDetails?: any[];
  complaintDetail?: any;
  dailyRecords?: any[];
  dailyRecord?: any;
  inquiries?: any[];
  inquiry?: any;
  total?: number;
  property?: any;
  company?: any;
  staff?: any[] | any;
  documents?: any[];
  document?: any;
  recentActivities?: {
    recentStaff: any[];
    recentProperties: any[];
  };
  systemConfigurations?: any[];
}

// Fetch initial data for SSR based on route type
async function fetchInitialDataForRoute(
  routeType: string,
  params?: any
): Promise<InitialData> {
  try {
    const baseStats = await fetchBaseStats();

    switch (routeType) {
      case "dashboard":
        return {
          routeType: "dashboard",
          stats: baseStats,
          recentActivities: await fetchRecentActivities(),
          timestamp: toJSTISOString(new Date()),
        };

      case "properties": {
        const propertiesData = await fetchPropertiesData();
        return {
          routeType: "properties",
          stats: baseStats,
          properties: propertiesData.properties,
          total: propertiesData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "property-detail": {
        if (params?.propertyId) {
          const propertyDetail = await fetchPropertyDetail(
            parseInt(params.propertyId)
          );
          return {
            routeType: "property-detail",
            stats: baseStats,
            property: propertyDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      case "staff": {
        const staffData = await fetchStaffData();
        return {
          routeType: "staff",
          stats: baseStats,
          staff: staffData.staff,
          total: staffData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "staff-detail": {
        if (params?.staffId) {
          const staffDetail = await fetchStaffDetail(parseInt(params.staffId));
          return {
            routeType: "staff-detail",
            stats: baseStats,
            staff: staffDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      case "staff-form": {
        if (params?.staffId) {
          // Editing existing staff
          const staffDetail = await fetchStaffDetail(parseInt(params.staffId));
          return {
            routeType: "staff-form",
            stats: baseStats,
            staff: staffDetail,
            timestamp: toJSTISOString(new Date()),
          };
        } else {
          // Creating new staff
          return {
            routeType: "staff-form",
            stats: baseStats,
            timestamp: toJSTISOString(new Date()),
          };
        }
      }

      case "settings": {
        const systemConfigs = await fetchSystemConfigurations();
        return {
          routeType: "settings",
          stats: baseStats,
          systemConfigurations: systemConfigs,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "manual": {
        return {
          routeType: "manual",
          stats: baseStats,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "complaint-details": {
        const complaintDetailsData = await fetchComplaintDetailsData();
        return {
          routeType: "complaint-details",
          stats: baseStats,
          complaintDetails: complaintDetailsData.complaintDetails,
          total: complaintDetailsData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "complaint-detail": {
        if (params?.complaintId) {
          const complaintDetail = await fetchComplaintDetail(
            parseInt(params.complaintId)
          );
          return {
            routeType: "complaint-detail",
            stats: baseStats,
            complaintDetail: complaintDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      case "daily-record": {
        const dailyRecordsData = await fetchDailyRecordsData();
        return {
          routeType: "daily-record",
          stats: baseStats,
          dailyRecords: dailyRecordsData.dailyRecords,
          total: dailyRecordsData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "inquiries-notifications": {
        const inquiriesData = await fetchInquiriesData();
        return {
          routeType: "inquiries-notifications",
          stats: baseStats,
          inquiries: inquiriesData.inquiries,
          total: inquiriesData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "inquiry-detail": {
        if (params?.inquiryId) {
          const inquiryDetail = await fetchInquiryDetail(
            parseInt(params.inquiryId)
          );
          return {
            routeType: "inquiry-detail",
            stats: baseStats,
            inquiry: inquiryDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      case "destinations": {
        const companiesData = await fetchCompaniesData();
        return {
          routeType: "destinations",
          stats: baseStats,
          companies: companiesData.companies,
          total: companiesData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "documents": {
        const documentsData = await fetchDocumentsData();
        return {
          routeType: "documents",
          stats: baseStats,
          documents: documentsData.documents,
          total: documentsData.total,
          timestamp: toJSTISOString(new Date()),
        };
      }

      case "company-detail": {
        if (params?.companyId) {
          const companyDetail = await fetchCompanyDetail(
            parseInt(params.companyId)
          );
          return {
            routeType: "company-detail",
            stats: baseStats,
            company: companyDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      case "document-detail": {
        if (params?.documentId) {
          const documentDetail = await fetchDocumentDetail(params.documentId);
          return {
            routeType: "document-detail",
            stats: baseStats,
            document: documentDetail,
            timestamp: toJSTISOString(new Date()),
          };
        }
        break;
      }

      default:
        return {
          routeType: "default",
          stats: baseStats,
          timestamp: toJSTISOString(new Date()),
        };
    }

    // Fallback for unhandled cases
    return {
      routeType,
      stats: baseStats,
      timestamp: toJSTISOString(new Date()),
    };
  } catch (error) {
    console.error(`Error fetching initial data for route ${routeType}:`, error);
    return {
      routeType,
      stats: {
        users: 0,
        staff: 0,
        properties: 0,
      },
      timestamp: toJSTISOString(new Date()),
      error: "Failed to fetch initial data",
    };
  }
}

// Fetch base statistics used across all routes
async function fetchBaseStats(): Promise<{
  users: number;
  staff: number;
  properties: number;
}> {
  const cacheKey = generateCacheKey.baseStats();
  const cached = performanceCache.get<{
    users: number;
    staff: number;
    properties: number;
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const [userCount, staffCount, propertyCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }).catch(() => 0),
      prisma.staff.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.property.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    ]);

    const stats = {
      users: userCount,
      staff: staffCount,
      properties: propertyCount,
    };

    // Cache for 2 minutes
    performanceCache.set(cacheKey, stats, 2 * 60 * 1000);
    return stats;
  } catch (error) {
    console.error("Error fetching base stats:", error);
    return {
      users: 0,
      staff: 0,
      properties: 0,
    };
  }
}

// Fetch recent activities for dashboard
async function fetchRecentActivities(): Promise<{
  recentStaff: any[];
  recentProperties: any[];
}> {
  const cacheKey = generateCacheKey.recentActivities();
  const cached = performanceCache.get<{
    recentStaff: any[];
    recentProperties: any[];
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // Get recent staff additions
    const recentStaff = await prisma.staff
      .findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          position: true,
          createdAt: true,
        },
      })
      .catch(() => []);

    // Get recent property updates
    const recentProperties = await prisma.property
      .findMany({
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          propertyType: true,
          updatedAt: true,
        },
      })
      .catch(() => []);

    const activities = {
      recentStaff,
      recentProperties,
    };

    // Cache for 1 minute (recent activities change frequently)
    performanceCache.set(cacheKey, activities, 60 * 1000);
    return activities;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return {
      recentStaff: [],
      recentProperties: [],
    };
  }
}

// Fetch properties data for properties list page
async function fetchPropertiesData() {
  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { status: { not: "INACTIVE" } },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          staffAssignments: {
            where: { isActive: true },
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  employeeId: true,
                  position: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit initial load for performance
      }),
      prisma.property.count({ where: { status: { not: "INACTIVE" } } }),
    ]);

    return { properties, total };
  } catch (error) {
    console.error("Error fetching properties data:", error);
    return { properties: [], total: 0 };
  }
}

// Fetch property detail
async function fetchPropertyDetail(propertyId: number) {
  try {
    return await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        staffAssignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
                department: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching property detail:", error);
    return null;
  }
}

// Fetch staff data for staff list page
async function fetchStaffData() {
  try {
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where: { status: { not: "TERMINATED" } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignments: {
            where: { isActive: true },
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  propertyCode: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit initial load for performance
      }),
      prisma.staff.count({ where: { status: { not: "TERMINATED" } } }),
    ]);

    return { staff, total };
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return { staff: [], total: 0 };
  }
}

// Fetch staff detail
async function fetchStaffDetail(staffId: number) {
  try {
    return await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignments: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                propertyCode: true,
                address: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching staff detail:", error);
    return null;
  }
}

// Fetch system configurations for settings page
async function fetchSystemConfigurations() {
  try {
    return await prisma.systemConfiguration.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { key: "asc" }],
      take: 50, // Limit for performance
    });
  } catch (error) {
    console.error("Error fetching system configurations:", error);
    return [];
  }
}

// Fetch companies data for destinations list page
async function fetchCompaniesData() {
  try {
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: { status: { not: "INACTIVE" } },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit initial load for performance
      }),
      prisma.company.count({ where: { status: { not: "INACTIVE" } } }),
    ]);

    // Transform to match frontend expectations
    const transformedCompanies = companies.map((company) => ({
      ...company,
      status: company.status.toLowerCase(),
    }));

    return { companies: transformedCompanies, total };
  } catch (error) {
    console.error("Error fetching companies data:", error);
    return { companies: [], total: 0 };
  }
}

// Fetch documents data for documents list page
async function fetchDocumentsData() {
  try {
    const { documentsDb } = await import("./database/documents");
    const result = await documentsDb.getAll({ limit: 20 });
    return { documents: result.documents, total: result.total };
  } catch (error) {
    console.error("Error fetching documents data:", error);
    return { documents: [], total: 0 };
  }
}

// Fetch company detail
async function fetchCompanyDetail(companyId: number) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return null;
    }

    // Transform to match frontend expectations
    return {
      ...company,
      status: company.status.toLowerCase(),
    };
  } catch (error) {
    console.error("Error fetching company detail:", error);
    return null;
  }
}

// Fetch document detail
async function fetchDocumentDetail(documentId: string) {
  try {
    const { documentsDb } = await import("./database/documents");
    return await documentsDb.getById(documentId);
  } catch (error) {
    console.error("Error fetching document detail:", error);
    return null;
  }
}

// Fetch complaint details data for complaint details list page
async function fetchComplaintDetailsData() {
  try {
    const complaintService = await import("./services/ComplaintService");
    const complaintDetails =
      await complaintService.default.getComplaintDetails();
    return { complaintDetails, total: complaintDetails.length };
  } catch (error) {
    console.error("Error fetching complaint details data:", error);
    return { complaintDetails: [], total: 0 };
  }
}

// Fetch complaint detail
async function fetchComplaintDetail(complaintId: number) {
  try {
    const complaintService = await import("./services/ComplaintService");
    return await complaintService.default.getComplaintDetailById(complaintId);
  } catch (error) {
    console.error("Error fetching complaint detail:", error);
    return null;
  }
}

// Fetch daily records data for daily record list page
async function fetchDailyRecordsData() {
  try {
    const dailyRecordService = await import("./services/DailyRecordService");
    const dailyRecords = await dailyRecordService.default.getDailyRecords();
    return { dailyRecords, total: dailyRecords.length };
  } catch (error) {
    console.error("Error fetching daily records data:", error);
    return { dailyRecords: [], total: 0 };
  }
}

// Fetch inquiries data for inquiries list page
async function fetchInquiriesData() {
  try {
    const inquiryService = await import("./services/InquiryService");
    const inquiries = await inquiryService.default.getInquiries();
    return { inquiries, total: inquiries.length };
  } catch (error) {
    console.error("Error fetching inquiries data:", error);
    return { inquiries: [], total: 0 };
  }
}

// Fetch inquiry detail
async function fetchInquiryDetail(inquiryId: number) {
  try {
    const inquiryService = await import("./services/InquiryService");
    return await inquiryService.default.getInquiryById(inquiryId);
  } catch (error) {
    console.error("Error fetching inquiry detail:", error);
    return null;
  }
}

// Initialize cache warming on startup
if (process.env.NODE_ENV !== "test") {
  initializeCacheWarming().catch((error) => {
    console.warn("Failed to initialize cache warming:", error);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
