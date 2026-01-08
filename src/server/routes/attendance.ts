import express from "express";
import {
  getAllAttendanceRecords,
  getAttendanceById,
  getAttendanceByStaffId,
  searchAttendanceRecords,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStatistics,
  AttendanceFilters,
} from "../database/attendance";
import { AttendanceRecord } from "../../shared/types";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/attendance - Get all attendance records with optional filters
router.get("/", async (req, res) => {
  try {
    const { staffIds, startDate, endDate, status } = req.query;

    const filters: AttendanceFilters = {};

    if (staffIds) {
      filters.staffIds = Array.isArray(staffIds)
        ? (staffIds as string[]).map((id) => parseInt(id))
        : [parseInt(staffIds as string)];
    }

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (status) {
      filters.status = Array.isArray(status)
        ? (status as AttendanceRecord["status"][])
        : [status as AttendanceRecord["status"]];
    }

    const records =
      Object.keys(filters).length > 0
        ? await searchAttendanceRecords(filters)
        : await getAllAttendanceRecords();

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance records",
    });
  }
});

// GET /api/attendance/staff/:staffId - Get attendance records for specific staff
router.get("/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const records = await getAttendanceByStaffId(staffId, start, end);
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff attendance records",
    });
  }
});

// GET /api/attendance/statistics - Get attendance statistics
router.get("/statistics", async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const statistics = await getAttendanceStatistics(
      staffId as string,
      start,
      end
    );
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching attendance statistics:", error);
    res.status(500).json({ error: "Failed to fetch attendance statistics" });
  }
});

// GET /api/attendance/:id - Get specific attendance record
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await getAttendanceById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found",
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Error fetching attendance record:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance record",
    });
  }
});

// POST /api/attendance - Create new attendance record
router.post("/", async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      date: new Date(req.body.date),
      checkInTime: req.body.checkInTime
        ? new Date(req.body.checkInTime)
        : undefined,
      checkOutTime: req.body.checkOutTime
        ? new Date(req.body.checkOutTime)
        : undefined,
      createdBy: req.user?.id || "system",
    };

    const newRecord = await createAttendanceRecord(recordData);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error creating attendance record:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined,
      checkInTime: req.body.checkInTime
        ? new Date(req.body.checkInTime)
        : undefined,
      checkOutTime: req.body.checkOutTime
        ? new Date(req.body.checkOutTime)
        : undefined,
    };

    const updatedRecord = await updateAttendanceRecord(id, updateData);

    if (!updatedRecord) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating attendance record:", error);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAttendanceRecord(id);

    if (!deleted) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
});

export default router;
