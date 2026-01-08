import { Router, Request, Response } from "express";
import { interactionDatabase } from "../database/interactions";
import { InteractionRecord } from "../../shared/types";
import prisma from "../lib/prisma";
import interactionRepliesRouter from "./interactionReplies";

const router = Router();

// Mount replies router
router.use("/:id/replies", interactionRepliesRouter);

// GET /api/interactions - Get all interaction records with optional filtering and sorting
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      type,
      personInvolvedStaffId,
      status,
      dateFrom,
      dateTo,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const filters: {
      type?: InteractionRecord["type"];
      personInvolvedStaffId?: string;
      status?: InteractionRecord["status"];
      dateFrom?: Date;
      dateTo?: Date;
    } = {};

    if (type && typeof type === "string") {
      filters.type = type as InteractionRecord["type"];
    }
    if (personInvolvedStaffId && typeof personInvolvedStaffId === "string") {
      filters.personInvolvedStaffId = personInvolvedStaffId;
    }
    if (status && typeof status === "string") {
      filters.status = status as InteractionRecord["status"];
    }
    if (dateFrom && typeof dateFrom === "string") {
      filters.dateFrom = new Date(dateFrom);
    }
    if (dateTo && typeof dateTo === "string") {
      filters.dateTo = new Date(dateTo);
    }

    const interactions = await interactionDatabase.getSorted(
      sortBy as keyof InteractionRecord,
      sortOrder as "asc" | "desc",
      filters
    );

    res.json({
      success: true,
      data: interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error("Error fetching interactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interaction records",
    });
  }
});

// GET /api/interactions/stats - Get interaction statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await interactionDatabase.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching interaction stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interaction statistics",
    });
  }
});

// GET /api/interactions/available-staff - Get available staff for dropdown selections
router.get("/available-staff", async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error fetching available staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available staff",
    });
  }
});

// GET /api/interactions/available-users - Get available users for dropdown selections
router.get("/available-users", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching available users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available users",
    });
  }
});

// GET /api/interactions/:id - Get specific interaction record
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interaction = await interactionDatabase.getById(id);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: "Interaction record not found",
      });
    }

    res.json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    console.error("Error fetching interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interaction record",
    });
  }
});

// GET /api/interactions/staff/:staffId - Get interaction records for specific person involved staff
router.get("/staff/:staffId", async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const interactions = await interactionDatabase.getByPersonInvolvedStaffId(
      staffId
    );

    res.json({
      success: true,
      data: interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error("Error fetching staff interactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff interaction records",
    });
  }
});

// POST /api/interactions - Create new interaction record
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      type,
      date,
      description,
      status,
      createdBy,
      name,
      title,
      personInvolvedStaffId,
      userInChargeId,
    } = req.body;

    // Validation
    if (!type || !date || !description || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, date, description, createdBy",
      });
    }

    const validTypes: InteractionRecord["type"][] = [
      "DISCUSSION",
      "INTERVIEW",
      "CONSULTATION",
      "OTHER",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid interaction type. Must be one of: DISCUSSION, INTERVIEW, CONSULTATION, OTHER",
      });
    }

    const validStatuses: InteractionRecord["status"][] = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: OPEN, IN_PROGRESS, RESOLVED",
      });
    }

    // Validate foreign key relationships if provided
    if (personInvolvedStaffId) {
      const personInvolved = await prisma.staff.findUnique({
        where: { id: parseInt(personInvolvedStaffId) },
      });
      if (!personInvolved) {
        return res.status(400).json({
          success: false,
          message: "Person involved not found",
        });
      }
    }

    if (userInChargeId) {
      const userInCharge = await prisma.user.findUnique({
        where: { id: parseInt(userInChargeId) },
      });
      if (!userInCharge) {
        return res.status(400).json({
          success: false,
          message: "User in charge not found",
        });
      }
    }

    const newInteraction = await interactionDatabase.create({
      type,
      date: new Date(date),
      description,
      status: status || "open",
      name: name || null,
      title: title || null,
      personInvolvedStaffId: personInvolvedStaffId || null,
      userInChargeId: userInChargeId || null,
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: newInteraction,
      message: "Interaction record created successfully",
    });
  } catch (error) {
    console.error("Error creating interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create interaction record",
    });
  }
});

// PUT /api/interactions/:id - Update interaction record
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.createdAt;

    // Validate date if provided
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    // Validate type if provided
    if (updates.type) {
      const validTypes: InteractionRecord["type"][] = [
        "DISCUSSION",
        "INTERVIEW",
        "CONSULTATION",
        "OTHER",
      ];
      if (!validTypes.includes(updates.type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid interaction type",
        });
      }
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses: InteractionRecord["status"][] = [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
      ];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }
    }

    // Validate foreign key relationships if provided
    if (updates.personInvolvedStaffId) {
      const personInvolved = await prisma.staff.findUnique({
        where: { id: parseInt(updates.personInvolvedStaffId) },
      });
      if (!personInvolved) {
        return res.status(400).json({
          success: false,
          message: "Person involved not found",
        });
      }
    }

    if (updates.userInChargeId) {
      const userInCharge = await prisma.user.findUnique({
        where: { id: parseInt(updates.userInChargeId) },
      });
      if (!userInCharge) {
        return res.status(400).json({
          success: false,
          message: "User in charge not found",
        });
      }
    }

    const updatedInteraction = await interactionDatabase.update(id, updates);

    if (!updatedInteraction) {
      return res.status(404).json({
        success: false,
        message: "Interaction record not found",
      });
    }

    res.json({
      success: true,
      data: updatedInteraction,
      message: "Interaction record updated successfully",
    });
  } catch (error) {
    console.error("Error updating interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update interaction record",
    });
  }
});

// DELETE /api/interactions/:id - Delete interaction record
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await interactionDatabase.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Interaction record not found",
      });
    }

    res.json({
      success: true,
      message: "Interaction record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete interaction record",
    });
  }
});

// POST /api/interactions/bulk-delete - Bulk delete interaction records
router.post("/bulk-delete", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }

    // Validate all IDs are strings
    const validIds = ids.filter((id) => typeof id === "string");
    if (validIds.length !== ids.length) {
      return res.status(400).json({ error: "All IDs must be valid strings" });
    }

    // Delete interactions
    let deletedCount = 0;
    for (const id of validIds) {
      const deleted = await interactionDatabase.delete(id);
      if (deleted) deletedCount++;
    }

    res.json({ deletedCount });
  } catch (error: unknown) {
    console.error("Error bulk deleting interactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
