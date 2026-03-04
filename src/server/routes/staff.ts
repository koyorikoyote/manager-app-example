import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadBufferToStorage as uploadBufferToDrive,
  deleteFileFromStorage as deleteFileFromDrive,
  fileKeyFromUrl as fileIdFromUrl,
} from "../lib/cloudStorage";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";
import {
  validateRequest,
  commonSchemas,
  staffSchemas,
} from "../middleware/validation";

// Age calculation utility
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return Math.max(0, age);
};

const router = express.Router();

// Configure multer for photo uploads (memory storage)

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
      );
    }
  },
});

// GET /api/staff - Get all staff with filtering and pagination
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      department,
      status,
      page = "1",
      limit = "10",
      all,
    } = req.query;

    // Build where clause for filtering
    const where: Prisma.StaffWhereInput = {};

    if (status && status !== "" && status !== "ALL") {
      where.status = status as
        | "ACTIVE"
        | "INACTIVE"
        | "TERMINATED"
        | "ON_LEAVE";
    }

    if (department && typeof department === "string") {
      where.department = { contains: department };
    }

    if (search && typeof search === "string") {
      const tokens = (search as string).split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        // Match if ANY token matches ANY searchable field (OR across tokens and fields)
        const orClauses: Prisma.StaffWhereInput[] = [];
        for (const tok of tokens) {
          orClauses.push(
            { name: { contains: tok } },
            { employeeId: { contains: tok } },
            { email: { contains: tok } },
            { position: { contains: tok } },
            { residenceStatus: { contains: tok } },
            { company: { name: { contains: tok } } }
          );
        }
        where.OR = orClauses;
      }
    }

    const includeOptions = {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      userInCharge: {
        select: { id: true, name: true },
      },
      company: {
        select: { id: true, name: true },
      },
      assignments: {
        where: { isActive: true },
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
        },
      },
    };

    // Check if all records are requested (for getAllStaff)
    if (all === "true") {
      const staff = await prisma.staff.findMany({
        where,
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: staff,
      });
    } else {
      // Normal pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const total = await prisma.staff.count({ where });

      // Get staff with pagination
      const staff = await prisma.staff.findMany({
        where,
        include: includeOptions,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      res.json({
        success: true,
        data: staff,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff records",
    });
  }
});

// GET /api/staff/departments - Get available departments for filtering
router.get("/departments", authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.staff.findMany({
      select: { department: true },
      distinct: ["department"],
      where: { status: "ACTIVE" },
      orderBy: { department: "asc" },
    });

    res.json({
      success: true,
      data: departments.map((d) => d.department),
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
});

// GET /api/staff/nationalities - Get available countries for nationality selection
router.get("/nationalities", authenticateToken, async (req, res) => {
  try {
    // Comprehensive list of world countries for nationality selection
    const countries = [
      "Australia",
      "Bangladesh",
      "Cambodia",
      "China",
      "India",
      "Indonesia",
      "Japan",
      "Laos",
      "Malaysia",
      "Mexico",
      "Myanmar",
      "Nepal",
      "New Zealand",
      "Pakistan",
      "Philippines",
      "Singapore",
      "South Korea",
      "Sri Lanka",
      "Taiwan",
      "Thailand",
      "United Arab Emirates",
      "United Kingdom",
      "United States",
      "Vietnam",
    ];

    res.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
    });
  }
});

// GET /api/staff/available-users - Get available users for dropdown selections
router.get("/available-users", authenticateToken, async (req, res) => {
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

// POST /api/staff/calculate-age - Calculate age from date of birth
router.post("/calculate-age", authenticateToken, async (req, res) => {
  try {
    const { dateOfBirth } = req.body;

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required",
      });
    }

    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
      });
    }

    // Validate date of birth is not in the future
    const today = new Date();
    if (birthDate > today) {
      return res.status(400).json({
        success: false,
        message: "Date of birth cannot be in the future",
      });
    }

    // Validate date of birth is not too old
    const minDate = new Date(1900, 0, 1);
    if (birthDate < minDate) {
      return res.status(400).json({
        success: false,
        message: "Date of birth must be after January 1, 1900",
      });
    }

    const age = calculateAge(birthDate);

    // Validate calculated age is reasonable
    if (age > 150) {
      return res.status(400).json({
        success: false,
        message: "Calculated age seems unrealistic (over 150 years)",
      });
    }

    res.json({
      success: true,
      data: { age },
      message: "Age calculated successfully",
    });
  } catch (error) {
    console.error("Error calculating age:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate age",
    });
  }
});

// GET /api/staff/:id - Get staff by ID
router.get(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          userInCharge: {
            select: { id: true, name: true },
          },
          company: {
            select: { id: true, name: true },
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
            orderBy: { startDate: "desc" },
          },
        },
      });

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }

      res.json({
        success: true,
        data: staff,
      });
    } catch (error) {
      console.error("Error fetching staff member:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch staff member",
      });
    }
  }
);

// POST /api/staff/:id/photo - Upload staff photo
router.post(
  "/:id/photo",
  authenticateToken,
  photoUpload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      if (!req.file) {
        throw new ValidationError("No photo file uploaded");
      }

      // Verify staff exists
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }

      // Delete old photo from Drive if it exists
      if (staff.photo) {
        const oldId = fileIdFromUrl(staff.photo);
        if (oldId) await deleteFileFromDrive(oldId).catch(() => { });
      }

      // Upload to Drive and update staff record with public URL
      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `staff-${staffId}-${uuidv4()}${ext}`;
      const photoUrl = await uploadBufferToDrive({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        filename,
      });
      await prisma.staff.update({
        where: { id: staffId },
        data: { photo: photoUrl },
      });

      res.json({
        success: true,
        data: { photoUrl },
        message: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading staff photo:", error);

      // No local file cleanup needed with Google Drive memory uploads.

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to upload photo",
      });
    }
  }
);

// DELETE /api/staff/:id/photo - Delete staff photo
router.delete("/:id/photo", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = parseInt(id);
    if (isNaN(staffId) || staffId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
        message: "Staff ID must be a positive integer",
      });
    }

    // Verify staff exists and has a photo
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, photo: true, name: true },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
        message: `Staff with ID ${staffId} does not exist`,
      });
    }

    if (!staff.photo) {
      return res.status(400).json({
        success: false,
        error: "No photo to delete",
        message: "Staff does not have a photo",
      });
    }

    // Delete photo from Drive
    const fileId = fileIdFromUrl(staff.photo);
    if (fileId) {
      await deleteFileFromDrive(fileId).catch(() => {
        console.warn(`Failed to delete Drive file: ${fileId}`);
      });
    }

    // Update staff record to remove photo
    await prisma.staff.update({
      where: { id: staffId },
      data: { photo: null },
    });

    res.json({
      success: true,
      message: "Staff photo deleted successfully",
      data: {
        id: staff.id,
        name: staff.name,
      },
    });
  } catch (error) {
    console.error("Error deleting staff photo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete photo",
      message: "An error occurred while deleting the staff photo",
    });
  }
});

// GET /api/staff/:id/daily-records - Get daily records for a staff member

// GET /api/staff/:id/daily-records - Get daily records for staff member
router.get(
  "/:id/daily-records",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      const dailyRecords = await prisma.dailyRecord.findMany({
        where: { staffId },
        orderBy: { dateOfRecord: "desc" },
      });

      res.json({
        success: true,
        data: dailyRecords,
      });
    } catch (error) {
      console.error("Error fetching daily records:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch daily records",
      });
    }
  }
);

// GET /api/staff/:id/interactions - Get interaction records for staff member
router.get(
  "/:id/interactions",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      const interactionRecords = await prisma.interactionRecord.findMany({
        where: { personInvolvedStaffId: staffId },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          userInCharge: {
            select: { id: true, name: true },
          },
        },
        orderBy: { date: "desc" },
      });

      res.json({
        success: true,
        data: interactionRecords,
      });
    } catch (error) {
      console.error("Error fetching interaction records:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch interaction records",
      });
    }
  }
);

// GET /api/staff/:id/documents - Get documents for staff member
router.get(
  "/:id/documents",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      const documents = await prisma.document.findMany({
        where: { staffId },
        orderBy: { startDate: "desc" },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch documents",
      });
    }
  }
);

// POST /api/staff - Create new staff member
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateRequest({ body: staffSchemas.create }),
  async (req, res) => {
    try {
      const {
        employeeId,
        name,
        position,
        department,
        email,
        phone,
        address,
        hireDate,
        salary,
        userId,
        residenceStatus,
        age,
        nationality,
        userInChargeId,
        companiesId,
        // New header fields
        furiganaName,
        gender,
        // New basic information fields
        dateOfBirth,
        postalCode,
        mobile,
        fax,
        periodOfStayDateStart,
        periodOfStayDateEnd,
        qualificationsAndLicenses,
        japaneseProficiency,
        japaneseProficiencyRemarks,
        // Ordered array fields
        educationName,
        educationType,
        workHistoryName,
        workHistoryDateStart,
        workHistoryDateEnd,
        workHistoryCountryLocation,
        workHistoryCityLocation,
        workHistoryPosition,
        workHistoryEmploymentType,
        workHistoryDescription,
        // Additional personal fields
        reasonForApplying,
        motivationToComeJapan,
        familySpouse,
        familyChildren,
        hobbyAndInterests,
        // Emergency contacts
        emergencyContactPrimaryName,
        emergencyContactPrimaryRelationship,
        emergencyContactPrimaryNumber,
        emergencyContactPrimaryEmail,
        emergencyContactSecondaryName,
        emergencyContactSecondaryRelationship,
        emergencyContactSecondaryNumber,
        emergencyContactSecondaryEmail,
        remarks,
      } = req.body;

      // Basic validation
      if (!name) {
        throw new ValidationError("Name is required");
      }

      // Validate hire date if provided
      let parsedHireDate: Date | undefined;
      if (hireDate) {
        parsedHireDate = new Date(hireDate);
        if (isNaN(parsedHireDate.getTime())) {
          throw new ValidationError("Invalid hire date format");
        }
      }

      // Validate salary if provided
      let parsedSalary: number | undefined;
      if (salary !== undefined && salary !== null) {
        parsedSalary = parseFloat(salary);
        if (isNaN(parsedSalary) || parsedSalary < 0) {
          throw new ValidationError("Invalid salary amount");
        }
      }

      // Handle date of birth and age calculation
      let parsedDateOfBirth: Date | null = null;
      let calculatedAge: number | null = null;

      if (dateOfBirth) {
        parsedDateOfBirth = new Date(dateOfBirth);
        if (isNaN(parsedDateOfBirth.getTime())) {
          throw new ValidationError("Invalid date of birth format");
        }

        // Validate date of birth is not in the future
        const today = new Date();
        if (parsedDateOfBirth > today) {
          throw new ValidationError("Date of birth cannot be in the future");
        }

        // Validate date of birth is not too old
        const minDate = new Date(1900, 0, 1);
        if (parsedDateOfBirth < minDate) {
          throw new ValidationError(
            "Date of birth must be after January 1, 1900"
          );
        }

        // Calculate age from date of birth
        calculatedAge = calculateAge(parsedDateOfBirth);

        // Validate calculated age is reasonable
        if (calculatedAge > 150) {
          throw new ValidationError(
            "Calculated age seems unrealistic (over 150 years)"
          );
        }
      }

      // Use calculated age if date of birth is provided, otherwise use provided age
      let finalAge: number | null = null;
      if (calculatedAge !== null) {
        finalAge = calculatedAge;
      } else if (age !== undefined && age !== null) {
        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
          throw new ValidationError("Age must be between 0 and 150");
        }
        finalAge = parsedAge;
      }

      // Check if user exists if userId is provided
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
        });
        if (!user) {
          throw new ValidationError("Associated user not found");
        }
      }

      // Check if userInCharge exists if userInChargeId is provided
      if (userInChargeId) {
        const userInCharge = await prisma.user.findUnique({
          where: { id: parseInt(userInChargeId) },
        });
        if (!userInCharge) {
          throw new ValidationError("User in charge not found");
        }
      }

      const newStaff = await prisma.staff.create({
        data: {
          employeeId,
          name,
          position,
          department,
          email: email || null,
          phone: phone || null,
          address: address || null,
          hireDate: parsedHireDate || null,
          salary: parsedSalary || null,
          userId: userId ? parseInt(userId) : null,
          residenceStatus: residenceStatus || null,
          age: finalAge,
          nationality: nationality || null,
          userInChargeId: userInChargeId ? parseInt(userInChargeId) : null,
          status: "ACTIVE",
          // Destination Assigned (company FK)
          companiesId:
            companiesId !== undefined && companiesId !== null
              ? parseInt(companiesId)
              : null,
          // New header fields
          furiganaName: furiganaName || null,
          gender: gender || null,
          // New basic information fields
          dateOfBirth: parsedDateOfBirth,
          postalCode: postalCode || null,
          mobile: mobile || null,
          fax: fax || null,
          periodOfStayDateStart: periodOfStayDateStart
            ? new Date(periodOfStayDateStart)
            : null,
          periodOfStayDateEnd: periodOfStayDateEnd
            ? new Date(periodOfStayDateEnd)
            : null,
          qualificationsAndLicenses: qualificationsAndLicenses || null,
          japaneseProficiency: japaneseProficiency || null,
          japaneseProficiencyRemarks: japaneseProficiencyRemarks || null,
          // Ordered array fields (stored as JSON)
          educationName: educationName || null,
          educationType: educationType || null,
          workHistoryName: workHistoryName || null,
          workHistoryDateStart: workHistoryDateStart || null,
          workHistoryDateEnd: workHistoryDateEnd || null,
          workHistoryCountryLocation: workHistoryCountryLocation || null,
          workHistoryCityLocation: workHistoryCityLocation || null,
          workHistoryPosition: workHistoryPosition || null,
          workHistoryEmploymentType: workHistoryEmploymentType || null,
          workHistoryDescription: workHistoryDescription || null,
          // Additional personal fields
          reasonForApplying: reasonForApplying || null,
          motivationToComeJapan: motivationToComeJapan || null,
          familySpouse: familySpouse !== undefined ? familySpouse : null,
          familyChildren:
            familyChildren !== undefined ? parseInt(familyChildren) : null,
          hobbyAndInterests: hobbyAndInterests || null,
          // Emergency contacts
          emergencyContactPrimaryName: emergencyContactPrimaryName || null,
          emergencyContactPrimaryRelationship:
            emergencyContactPrimaryRelationship || null,
          emergencyContactPrimaryNumber: emergencyContactPrimaryNumber || null,
          emergencyContactPrimaryEmail: emergencyContactPrimaryEmail || null,
          emergencyContactSecondaryName: emergencyContactSecondaryName || null,
          emergencyContactSecondaryRelationship:
            emergencyContactSecondaryRelationship || null,
          emergencyContactSecondaryNumber:
            emergencyContactSecondaryNumber || null,
          emergencyContactSecondaryEmail:
            emergencyContactSecondaryEmail || null,
          remarks: remarks || null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          userInCharge: {
            select: { id: true, name: true },
          },
          company: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: newStaff,
        message: "Staff member created successfully",
      });
    } catch (error) {
      console.error("Error creating staff member:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to create staff member",
      });
    }
  }
);

// PUT /api/staff/:id - Update staff member
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateRequest({
    params: commonSchemas.idParam,
    body: staffSchemas.update,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      const {
        employeeId,
        name,
        position,
        department,
        email,
        phone,
        address,
        hireDate,
        salary,
        status,
        userId,
        residenceStatus,
        age,
        nationality,
        userInChargeId,
        companiesId,
        // New header fields
        photo,
        furiganaName,
        gender,
        // New basic information fields
        dateOfBirth,
        postalCode,
        mobile,
        fax,
        periodOfStayDateStart,
        periodOfStayDateEnd,
        qualificationsAndLicenses,
        japaneseProficiency,
        japaneseProficiencyRemarks,
        // Ordered array fields
        educationName,
        educationType,
        workHistoryName,
        workHistoryDateStart,
        workHistoryDateEnd,
        workHistoryCountryLocation,
        workHistoryCityLocation,
        workHistoryPosition,
        workHistoryEmploymentType,
        workHistoryDescription,
        // Additional personal fields
        reasonForApplying,
        motivationToComeJapan,
        familySpouse,
        familyChildren,
        hobbyAndInterests,
        // Emergency contacts
        emergencyContactPrimaryName,
        emergencyContactPrimaryRelationship,
        emergencyContactPrimaryNumber,
        emergencyContactPrimaryEmail,
        emergencyContactSecondaryName,
        emergencyContactSecondaryRelationship,
        emergencyContactSecondaryNumber,
        emergencyContactSecondaryEmail,
        remarks,
      } = req.body;

      // Validate hire date if provided
      let parsedHireDate: Date | null | undefined;
      if (hireDate !== undefined) {
        if (hireDate === null) {
          parsedHireDate = null;
        } else {
          parsedHireDate = new Date(hireDate);
          if (isNaN(parsedHireDate.getTime())) {
            throw new ValidationError("Invalid hire date format");
          }
        }
      }

      // Validate salary if provided
      let parsedSalary: number | null | undefined;
      if (salary !== undefined) {
        if (salary === null) {
          parsedSalary = null;
        } else {
          parsedSalary = parseFloat(salary);
          if (isNaN(parsedSalary) || parsedSalary < 0) {
            throw new ValidationError("Invalid salary amount");
          }
        }
      }

      // Handle date of birth and age calculation
      let parsedDateOfBirth: Date | null | undefined;
      let calculatedAge: number | null = null;

      if (dateOfBirth !== undefined) {
        if (dateOfBirth === null) {
          parsedDateOfBirth = null;
        } else {
          parsedDateOfBirth = new Date(dateOfBirth);
          if (isNaN(parsedDateOfBirth.getTime())) {
            throw new ValidationError("Invalid date of birth format");
          }

          // Validate date of birth is not in the future
          const today = new Date();
          if (parsedDateOfBirth > today) {
            throw new ValidationError("Date of birth cannot be in the future");
          }

          // Validate date of birth is not too old
          const minDate = new Date(1900, 0, 1);
          if (parsedDateOfBirth < minDate) {
            throw new ValidationError(
              "Date of birth must be after January 1, 1900"
            );
          }

          // Calculate age from date of birth
          calculatedAge = calculateAge(parsedDateOfBirth);

          // Validate calculated age is reasonable
          if (calculatedAge > 150) {
            throw new ValidationError(
              "Calculated age seems unrealistic (over 150 years)"
            );
          }
        }
      }

      // Handle age validation and calculation
      let parsedAge: number | null | undefined;
      if (calculatedAge !== null) {
        // Use calculated age from date of birth
        parsedAge = calculatedAge;
      } else if (age !== undefined) {
        if (age === null) {
          parsedAge = null;
        } else {
          parsedAge = parseInt(age);
          if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
            throw new ValidationError("Age must be between 0 and 150");
          }
        }
      }

      // Check if user exists if userId is provided
      if (userId && userId !== null) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
        });
        if (!user) {
          throw new ValidationError("Associated user not found");
        }
      }

      // Check if userInCharge exists if userInChargeId is provided
      if (userInChargeId && userInChargeId !== null) {
        const userInCharge = await prisma.user.findUnique({
          where: { id: parseInt(userInChargeId) },
        });
        if (!userInCharge) {
          throw new ValidationError("User in charge not found");
        }
      }
      // If companiesId provided, optionally verify company exists (non-fatal if omitted)
      if (companiesId && companiesId !== null) {
        const company = await prisma.company.findUnique({
          where: { id: parseInt(companiesId) },
        });
        if (!company) {
          throw new ValidationError("Company not found");
        }
      }

      // Build update data object
      const updateData: Prisma.StaffUpdateInput = {};
      if (employeeId !== undefined) updateData.employeeId = employeeId;
      if (name !== undefined) updateData.name = name;
      if (position !== undefined) updateData.position = position;
      if (department !== undefined) updateData.department = department;
      if (email !== undefined) updateData.email = email || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;
      if (hireDate !== undefined) updateData.hireDate = parsedHireDate;
      if (salary !== undefined) updateData.salary = parsedSalary;
      if (status !== undefined) updateData.status = status;
      if (residenceStatus !== undefined)
        updateData.residenceStatus = residenceStatus || null;
      if (age !== undefined) updateData.age = parsedAge;
      if (nationality !== undefined)
        updateData.nationality = nationality || null;

      // New header fields
      if (photo !== undefined) {
        // If photo is explicitly set to null, delete the existing file and clear the DB field.
        if (photo === null) {
          try {
            const existing = await prisma.staff.findUnique({
              where: { id: staffId },
              select: { photo: true },
            });
            if (existing && existing.photo) {
              const existingId = fileIdFromUrl(existing.photo);
              if (existingId) {
                await deleteFileFromDrive(existingId).catch(() => {
                  console.warn(
                    `Failed to delete existing staff photo from Drive: ${existingId}`
                  );
                });
              }
            }
          } catch (err) {
            console.warn(
              "Error while attempting to delete existing staff photo:",
              err
            );
          }
          updateData.photo = null;
        } else {
          updateData.photo = photo;
        }
      }
      if (furiganaName !== undefined)
        updateData.furiganaName = furiganaName || null;
      if (gender !== undefined) updateData.gender = gender || null;

      // New basic information fields
      if (dateOfBirth !== undefined) updateData.dateOfBirth = parsedDateOfBirth;
      if (postalCode !== undefined) updateData.postalCode = postalCode || null;
      if (mobile !== undefined) updateData.mobile = mobile || null;
      if (fax !== undefined) updateData.fax = fax || null;
      if (periodOfStayDateStart !== undefined)
        updateData.periodOfStayDateStart = periodOfStayDateStart
          ? new Date(periodOfStayDateStart)
          : null;
      if (periodOfStayDateEnd !== undefined)
        updateData.periodOfStayDateEnd = periodOfStayDateEnd
          ? new Date(periodOfStayDateEnd)
          : null;
      if (qualificationsAndLicenses !== undefined)
        updateData.qualificationsAndLicenses =
          qualificationsAndLicenses || null;
      if (japaneseProficiency !== undefined)
        updateData.japaneseProficiency = japaneseProficiency || null;
      if (japaneseProficiencyRemarks !== undefined)
        updateData.japaneseProficiencyRemarks =
          japaneseProficiencyRemarks || null;

      // Ordered array fields
      if (educationName !== undefined)
        updateData.educationName = educationName || null;
      if (educationType !== undefined)
        updateData.educationType = educationType || null;
      if (workHistoryName !== undefined)
        updateData.workHistoryName = workHistoryName || null;
      if (workHistoryDateStart !== undefined)
        updateData.workHistoryDateStart = workHistoryDateStart || null;
      if (workHistoryDateEnd !== undefined)
        updateData.workHistoryDateEnd = workHistoryDateEnd || null;
      if (workHistoryCountryLocation !== undefined)
        updateData.workHistoryCountryLocation =
          workHistoryCountryLocation || null;
      if (workHistoryCityLocation !== undefined)
        updateData.workHistoryCityLocation = workHistoryCityLocation || null;
      if (workHistoryPosition !== undefined)
        updateData.workHistoryPosition = workHistoryPosition || null;
      if (workHistoryEmploymentType !== undefined)
        updateData.workHistoryEmploymentType =
          workHistoryEmploymentType || null;
      if (workHistoryDescription !== undefined)
        updateData.workHistoryDescription = workHistoryDescription || null;

      // Additional personal fields
      if (reasonForApplying !== undefined)
        updateData.reasonForApplying = reasonForApplying || null;
      if (motivationToComeJapan !== undefined)
        updateData.motivationToComeJapan = motivationToComeJapan || null;
      if (familySpouse !== undefined) updateData.familySpouse = familySpouse;
      if (familyChildren !== undefined)
        updateData.familyChildren =
          familyChildren !== null ? parseInt(familyChildren) : null;
      if (hobbyAndInterests !== undefined)
        updateData.hobbyAndInterests = hobbyAndInterests || null;

      // Emergency contacts
      if (emergencyContactPrimaryName !== undefined)
        updateData.emergencyContactPrimaryName =
          emergencyContactPrimaryName || null;
      if (emergencyContactPrimaryRelationship !== undefined)
        updateData.emergencyContactPrimaryRelationship =
          emergencyContactPrimaryRelationship || null;
      if (emergencyContactPrimaryNumber !== undefined)
        updateData.emergencyContactPrimaryNumber =
          emergencyContactPrimaryNumber || null;
      if (emergencyContactPrimaryEmail !== undefined)
        updateData.emergencyContactPrimaryEmail =
          emergencyContactPrimaryEmail || null;
      if (emergencyContactSecondaryName !== undefined)
        updateData.emergencyContactSecondaryName =
          emergencyContactSecondaryName || null;
      if (emergencyContactSecondaryRelationship !== undefined)
        updateData.emergencyContactSecondaryRelationship =
          emergencyContactSecondaryRelationship || null;
      if (emergencyContactSecondaryNumber !== undefined)
        updateData.emergencyContactSecondaryNumber =
          emergencyContactSecondaryNumber || null;
      if (emergencyContactSecondaryEmail !== undefined)
        updateData.emergencyContactSecondaryEmail =
          emergencyContactSecondaryEmail || null;
      if (remarks !== undefined) updateData.remarks = remarks || null;

      if (userId !== undefined) {
        if (userId === null) {
          updateData.user = { disconnect: true };
        } else {
          updateData.user = { connect: { id: parseInt(userId) } };
        }
      }
      if (userInChargeId !== undefined) {
        if (userInChargeId === null) {
          updateData.userInCharge = { disconnect: true };
        } else {
          updateData.userInCharge = {
            connect: { id: parseInt(userInChargeId) },
          };
        }
      }
      if (companiesId !== undefined) {
        if (companiesId === null) {
          updateData.company = { disconnect: true };
        } else {
          updateData.company = { connect: { id: parseInt(companiesId) } };
        }
      }

      const updatedStaff = await prisma.staff.update({
        where: { id: staffId },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          userInCharge: {
            select: { id: true, name: true },
          },
          company: {
            select: { id: true, name: true },
          },
          assignments: {
            where: { isActive: true },
            include: {
              property: {
                select: { id: true, name: true, propertyCode: true },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedStaff,
        message: "Staff member updated successfully",
      });
    } catch (error) {
      console.error("Error updating staff member:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("Staff member not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to update staff member",
      });
    }
  }
);

// DELETE /api/staff/:id - Soft delete staff member (set status to TERMINATED)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = parseInt(id);

    if (isNaN(staffId)) {
      throw new ValidationError("Invalid staff ID");
    }

    // Soft delete by updating status to TERMINATED
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        status: "TERMINATED",
        // Also deactivate any active property assignments
        assignments: {
          updateMany: {
            where: { isActive: true },
            data: {
              isActive: false,
              endDate: new Date(),
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Staff member terminated successfully",
    });
  } catch (error) {
    console.error("Error terminating staff member:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Staff member not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to terminate staff member",
    });
  }
});

// POST /api/staff/:id/assignments - Assign staff to property
router.post(
  "/:id/assignments",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);
      const { propertyId, room, startDate } = req.body;

      if (isNaN(staffId)) {
        throw new ValidationError("Invalid staff ID");
      }

      if (!propertyId || !room || !startDate) {
        throw new ValidationError(
          "Property ID, room, and start date are required"
        );
      }

      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new ValidationError("Invalid start date format");
      }

      // Verify staff and property exist
      const [staff, property] = await Promise.all([
        prisma.staff.findUnique({ where: { id: staffId } }),
        prisma.property.findUnique({ where: { id: parseInt(propertyId) } }),
      ]);

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }
      if (!property) {
        throw new ValidationError("Property not found");
      }

      const assignment = await prisma.propertyStaffAssignment.create({
        data: {
          staffId,
          propertyId: parseInt(propertyId),
          room,
          startDate: parsedStartDate,
          isActive: true,
        },
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: "Staff assignment created successfully",
      });
    } catch (error) {
      console.error("Error creating staff assignment:", error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to create staff assignment",
      });
    }
  }
);

// PUT /api/staff/:id/assignments/:assignmentId - Update staff assignment
router.put(
  "/:id/assignments/:assignmentId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id, assignmentId } = req.params;
      const staffId = parseInt(id);
      const assignmentIdNum = parseInt(assignmentId);
      const { room, endDate, isActive } = req.body;

      if (isNaN(staffId) || isNaN(assignmentIdNum)) {
        throw new ValidationError("Invalid staff ID or assignment ID");
      }

      let parsedEndDate: Date | null = null;
      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new ValidationError("Invalid end date format");
        }
      }

      const updateData: Prisma.PropertyStaffAssignmentUpdateInput = {};
      if (room !== undefined) updateData.room = room;
      if (endDate !== undefined) updateData.endDate = parsedEndDate;
      if (isActive !== undefined) updateData.isActive = isActive;

      const assignment = await prisma.propertyStaffAssignment.update({
        where: {
          id: assignmentIdNum,
          staffId: staffId, // Ensure assignment belongs to this staff member
        },
        data: updateData,
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
        },
      });

      res.json({
        success: true,
        data: assignment,
        message: "Staff assignment updated successfully",
      });
    } catch (error) {
      console.error("Error updating staff assignment:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("Staff assignment not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to update staff assignment",
      });
    }
  }
);

// POST /api/staff/bulk-delete - Bulk delete staff members
router.post("/bulk-delete", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }

    // Validate all IDs are numbers
    const validIds = ids.filter((id) => typeof id === "number" && !isNaN(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ error: "All IDs must be valid numbers" });
    }

    // Hard delete staff records from database
    const result = await prisma.staff.deleteMany({
      where: {
        id: {
          in: validIds,
        },
      },
    });

    res.json({ deletedCount: result.count });
  } catch (error: unknown) {
    console.error("Error bulk deleting staff:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
