import { Router } from "express";
import { PrismaClient, CompanyStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import path from "path";
import {
  uploadBufferToS3,
  deleteObjectFromS3,
  keyFromUrlOrPath,
} from "../lib/awsS3";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth";
import companyService from "../services/CompanyService";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for company photo uploads (S3 memory storage)

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

// Enhanced validation schemas with better error messages
const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(255, "Company name must be less than 255 characters"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  industry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional(),
  description: z.string().optional(),
  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ])
    .default("active")
    .transform((val) => val.toUpperCase() as CompanyStatus),
  contactPerson: z
    .string()
    .max(255, "Contact person name must be less than 255 characters")
    .optional(),
  hiringVacancies: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return 0;
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num))
        throw new Error("Hiring vacancies must be a valid number");
      if (num < 0) throw new Error("Hiring vacancies cannot be negative");
      return num;
    })
    .optional(),
  preferredNationality: z
    .string()
    .max(100, "Preferred nationality must be less than 100 characters")
    .optional(),
  userInChargeId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num))
        throw new Error("User in charge ID must be a valid number");
      return num;
    })
    .optional(),

  // New header fields with enhanced validation
  companyId: z
    .string()
    .max(100, "Company ID must be less than 100 characters")
    .optional()
    .nullable(),
  photo: z
    .string()
    .max(500, "Photo URL must be less than 500 characters")
    .optional()
    .nullable(),
  corporateNumber: z
    .string()
    .max(20, "Corporate number must be less than 20 characters")
    .optional()
    .nullable(),
  furiganaName: z
    .string()
    .max(255, "Furigana name must be less than 255 characters")
    .optional()
    .nullable(),
  establishmentDate: z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (isNaN(date.getTime()))
        throw new Error("Invalid establishment date format");
      if (date > new Date())
        throw new Error("Establishment date cannot be in the future");
      return date;
    })
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .nullable(),
  region: z
    .string()
    .max(100, "Region must be less than 100 characters")
    .optional()
    .nullable(),
  prefecture: z
    .string()
    .max(100, "Prefecture must be less than 100 characters")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(10, "Postal code must be less than 10 characters")
    .optional()
    .nullable(),

  // Job Information fields with enhanced validation
  preferredStatusOfResidence: z
    .string()
    .max(100, "Preferred status of residence must be less than 100 characters")
    .optional()
    .nullable(),
  preferredAge: z
    .string()
    .max(100, "Preferred age must be less than 100 characters")
    .optional()
    .nullable(),
  preferredExperience: z
    .string()
    .max(255, "Preferred experience must be less than 255 characters")
    .optional()
    .nullable(),
  preferredQualifications: z
    .string()
    .max(255, "Preferred qualifications must be less than 255 characters")
    .optional()
    .nullable(),
  preferredPersonality: z
    .string()
    .max(255, "Preferred personality must be less than 255 characters")
    .optional()
    .nullable(),
  preferredEducation: z
    .string()
    .max(255, "Preferred education must be less than 255 characters")
    .optional()
    .nullable(),
  preferredJapaneseProficiency: z
    .string()
    .max(100, "Preferred Japanese proficiency must be less than 100 characters")
    .optional()
    .nullable(),
  destinationWorkEnvironment: z
    .string()
    .max(255, "Destination work environment must be less than 255 characters")
    .optional()
    .nullable(),
  destinationAverageAge: z
    .string()
    .max(100, "Destination average age must be less than 100 characters")
    .optional()
    .nullable(),
  destinationWorkPlace: z
    .string()
    .max(255, "Destination work place must be less than 255 characters")
    .optional()
    .nullable(),
  destinationTransfer: z
    .string()
    .max(255, "Destination transfer must be less than 255 characters")
    .optional()
    .nullable(),
  jobSelectionProcess: z
    .string()
    .max(255, "Job selection process must be less than 255 characters")
    .optional()
    .nullable(),
  jobPastRecruitmentHistory: z
    .string()
    .max(255, "Job past recruitment history must be less than 255 characters")
    .optional()
    .nullable(),
  jobSalary: z
    .string()
    .max(100, "Job salary must be less than 100 characters")
    .optional()
    .nullable(),
  jobOvertimeRate: z
    .string()
    .max(100, "Job overtime rate must be less than 100 characters")
    .optional()
    .nullable(),
  jobSalaryIncreaseRate: z
    .string()
    .max(255, "Job salary increase rate must be less than 255 characters")
    .optional()
    .nullable(),
  jobSalaryBonus: z
    .string()
    .max(255, "Job salary bonus must be less than 255 characters")
    .optional()
    .nullable(),
  jobAllowances: z
    .string()
    .max(255, "Job allowances must be less than 255 characters")
    .optional()
    .nullable(),
  jobEmployeeBenefits: z
    .string()
    .max(255, "Job employee benefits must be less than 255 characters")
    .optional()
    .nullable(),
  jobRetirementBenefits: z
    .string()
    .max(255, "Job retirement benefits must be less than 255 characters")
    .optional()
    .nullable(),
  jobTermsAndConditions: z
    .string()
    .max(255, "Job terms and conditions must be less than 255 characters")
    .optional()
    .nullable(),
  jobDisputePreventionMeasures: z
    .string()
    .max(
      255,
      "Job dispute prevention measures must be less than 255 characters"
    )
    .optional()
    .nullable(),
  jobProvisionalHiringConditions: z
    .string()
    .max(
      255,
      "Job provisional hiring conditions must be less than 255 characters"
    )
    .optional()
    .nullable(),
  jobContractRenewalConditions: z
    .string()
    .max(
      255,
      "Job contract renewal conditions must be less than 255 characters"
    )
    .optional()
    .nullable(),
  jobRetirementConditions: z
    .string()
    .max(255, "Job retirement conditions must be less than 255 characters")
    .optional()
    .nullable(),
});

const updateCompanySchema = createCompanySchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ])
    .optional()
    .transform((val) => val?.toUpperCase() as CompanyStatus | undefined),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// GET /api/companies - List companies with filtering and pagination
router.get("/", authenticateToken, async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100); // Increase default limit to 50, cap at 100
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CompanyWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { address: { contains: query.search } },
        { industry: { contains: query.search } },
      ];
    }

    if (query.industry) {
      where.industry = query.industry;
    }

    if (query.status) {
      where.status = query.status.toUpperCase() as CompanyStatus;
    }

    // Get companies and total count
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          userInCharge: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.count({ where }),
    ]);

    // Transform to match frontend expectations
    const transformedCompanies = companies.map((company) => ({
      ...company,
      status: company.status.toLowerCase(),
    }));

    res.json({
      companies: transformedCompanies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid query parameters", details: error.issues });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/companies/users-dropdown - Get users for dropdown (id, name only)
router.get("/users-dropdown", async (req, res) => {
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
    console.error("Error fetching users for dropdown:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/companies/:id - Get single company with enhanced validation
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company ID",
        message: "Company ID must be a positive integer",
      });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        userInCharge: {
          select: { id: true, name: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: `Company with ID ${id} does not exist`,
      });
    }

    // Transform to match frontend expectations
    const transformedCompany = {
      ...company,
      status: company.status.toLowerCase(),
    };

    res.json({
      success: true,
      data: transformedCompany,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch company",
      message: "An error occurred while retrieving company information",
    });
  }
});

// POST /api/companies - Create new company with enhanced validation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = createCompanySchema.parse(req.body);

    // Check if userInCharge exists if userInChargeId is provided
    if (data.userInChargeId) {
      const userInCharge = await prisma.user.findUnique({
        where: { id: data.userInChargeId },
        select: { id: true, name: true, isActive: true },
      });
      if (!userInCharge) {
        return res.status(400).json({
          success: false,
          error: "User in charge not found",
          message: `User with ID ${data.userInChargeId} does not exist`,
        });
      }
      if (!userInCharge.isActive) {
        return res.status(400).json({
          success: false,
          error: "User in charge is inactive",
          message: `User ${userInCharge.name} is not active and cannot be assigned`,
        });
      }
    }

    // Check for duplicate company name
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: data.name,
        status: { not: "INACTIVE" },
      },
      select: { id: true, name: true },
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: "Company name already exists",
        message: `A company with the name "${data.name}" already exists`,
      });
    }

    const company = await prisma.company.create({
      data,
      include: {
        userInCharge: {
          select: { id: true, name: true },
        },
      },
    });

    // Transform to match frontend expectations
    const transformedCompany = {
      ...company,
      status: company.status.toLowerCase(),
    };

    res.status(201).json({
      success: true,
      data: transformedCompany,
      message: "Company created successfully",
    });
  } catch (error) {
    console.error("Error creating company:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid company data",
        message: "Please check the provided data and try again",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to create company",
      message: "An error occurred while creating the company",
    });
  }
});

// PUT /api/companies/:id - Update company with enhanced validation
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company ID",
        message: "Company ID must be a positive integer",
      });
    }

    const data = updateCompanySchema.parse(req.body);

    // Check if company exists first
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: `Company with ID ${id} does not exist`,
      });
    }

    // Check if userInCharge exists if userInChargeId is provided
    if (data.userInChargeId) {
      const userInCharge = await prisma.user.findUnique({
        where: { id: data.userInChargeId },
        select: { id: true, name: true, isActive: true },
      });
      if (!userInCharge) {
        return res.status(400).json({
          success: false,
          error: "User in charge not found",
          message: `User with ID ${data.userInChargeId} does not exist`,
        });
      }
      if (!userInCharge.isActive) {
        return res.status(400).json({
          success: false,
          error: "User in charge is inactive",
          message: `User ${userInCharge.name} is not active and cannot be assigned`,
        });
      }
    }

    // Check for duplicate company name if name is being updated
    if (data.name && data.name !== existingCompany.name) {
      const duplicateCompany = await prisma.company.findFirst({
        where: {
          name: data.name,
          id: { not: id },
          status: { not: "INACTIVE" },
        },
        select: { id: true, name: true },
      });

      if (duplicateCompany) {
        return res.status(409).json({
          success: false,
          error: "Company name already exists",
          message: `A company with the name "${data.name}" already exists`,
        });
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data,
      include: {
        userInCharge: {
          select: { id: true, name: true },
        },
      },
    });

    // Transform to match frontend expectations
    const transformedCompany = {
      ...company,
      status: company.status.toLowerCase(),
    };

    res.json({
      success: true,
      data: transformedCompany,
      message: "Company updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating company:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid company data",
        message: "Please check the provided data and try again",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: "Company was deleted during update",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update company",
      message: "An error occurred while updating the company",
    });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    await prisma.company.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: unknown) {
    console.error("Error deleting company:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/companies/available-users - Get available users for dropdown selections
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
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/companies/bulk-delete - Bulk delete companies
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

    // Delete companies
    const result = await prisma.company.deleteMany({
      where: {
        id: {
          in: validIds,
        },
      },
    });

    res.json({ deletedCount: result.count });
  } catch (error: unknown) {
    console.error("Error bulk deleting companies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/companies/:id/photo - Upload company photo with enhanced validation
router.post(
  "/:id/photo",
  authenticateToken,
  (req, res, next) => {
    photoUpload.single("photo")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              error: "File too large",
              message: "Photo file size must be less than 5MB",
            });
          }
          return res.status(400).json({
            success: false,
            error: "Upload error",
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          error: "Invalid file",
          message: err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = parseInt(id);

      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid company ID",
          message: "Company ID must be a positive integer",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
          message: "Please select a photo file to upload",
        });
      }

      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, photo: true, name: true },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: "Company not found",
          message: `Company with ID ${companyId} does not exist`,
        });
      }

      // Delete old photo from S3 if it exists
      if (company.photo) {
        const oldKey = keyFromUrlOrPath(company.photo);
        await deleteObjectFromS3(oldKey).catch(() => {
          console.warn(`Failed to delete old company photo in S3: ${oldKey}`);
        });
      }

      // Upload to S3 and update company with public URL
      const ext = path.extname(req.file.originalname);
      const key = `uploads/company-photos/company-${companyId}-${uuidv4()}${ext}`;
      const photoUrl = await uploadBufferToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });
      const updatedCompany = await companyService.updateCompanyPhoto(
        companyId,
        photoUrl
      );

      res.json({
        success: true,
        data: {
          id: updatedCompany.id,
          photoUrl: updatedCompany.photo,
          companyName: company.name,
        },
        message: "Company photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading company photo:", error);

      // No local cleanup needed when using memoryStorage + S3.

      if (error instanceof Error && error.message.includes("P2025")) {
        return res.status(404).json({
          success: false,
          error: "Company not found",
          message: "Company was deleted during photo upload",
        });
      }

      res.status(500).json({
        success: false,
        error: "Upload failed",
        message:
          "An error occurred while uploading the photo. Please try again.",
      });
    }
  }
);

// GET /api/companies/:id/interactions - Get company interaction records with enhanced validation
router.get("/:id/interactions", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company ID",
        message: "Company ID must be a positive integer",
      });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: `Company with ID ${id} does not exist`,
      });
    }

    const interactions = await companyService.getCompanyInteractionRecords(id);

    res.json({
      success: true,
      data: interactions,
      total: interactions.length,
      companyInfo: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Error fetching company interactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch interactions",
      message: "An error occurred while retrieving company interaction records",
    });
  }
});

// GET /api/companies/:id/documents - Get company documents with enhanced validation
router.get("/:id/documents", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company ID",
        message: "Company ID must be a positive integer",
      });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: `Company with ID ${id} does not exist`,
      });
    }

    const documents = await companyService.getCompanyDocuments(id);

    res.json({
      success: true,
      data: documents,
      total: documents.length,
      companyInfo: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Error fetching company documents:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch documents",
      message: "An error occurred while retrieving company documents",
    });
  }
});

// DELETE /api/companies/:id/photo - Delete company photo
router.delete("/:id/photo", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company ID",
        message: "Company ID must be a positive integer",
      });
    }

    // Verify company exists and has a photo
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, photo: true, name: true },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
        message: `Company with ID ${id} does not exist`,
      });
    }

    if (!company.photo) {
      return res.status(400).json({
        success: false,
        error: "No photo to delete",
        message: "Company does not have a photo",
      });
    }

    // Delete photo from S3
    const key = keyFromUrlOrPath(company.photo);
    await deleteObjectFromS3(key).catch(() => {
      console.warn(`Failed to delete S3 object: ${key}`);
    });

    // Update company record to remove photo
    await companyService.updateCompanyPhoto(id, null);

    res.json({
      success: true,
      message: "Company photo deleted successfully",
      data: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Error deleting company photo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete photo",
      message: "An error occurred while deleting the company photo",
    });
  }
});

// GET /api/companies/photos/:filename - Legacy local serving removed (S3 used now)
router.get("/photos/:filename", (_req, res) => {
  return res.status(404).json({
    success: false,
    error: "Not found",
    message: "Direct photo serving is disabled. Use the stored photo URL.",
  });
});

export default router;
