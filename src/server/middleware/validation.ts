import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { ValidationError } from "./errorHandler";
import {
  enhancedDateOfBirthSchema,
  enhancedPhotoPathSchema,
} from "./enhancedValidation";

/**
 * Recursively convert explicit null values to undefined so that
 * Zod optional() checks treat them as "not provided" instead of failing.
 * This allows clients to send null for optional fields without failing validation.
 */
function sanitizeNulls(value: any, key?: string): any {
  // Special-case: preserve actual null for specific fields (e.g. "photo") so callers can
  // intentionally send null to indicate deletion. When key === 'photo' and value is null,
  // return null instead of converting to undefined.
  if (value === null) {
    if (key === "photo") return null;
    return undefined;
  }

  // Convert literal string "null" (sometimes produced by form serialization) to undefined
  if (typeof value === "string" && value.trim().toLowerCase() === "null") {
    return undefined;
  }

  // Preserve non-object primitives
  if (typeof value !== "object" || value === undefined) return value;

  // Arrays: sanitize each element
  if (Array.isArray(value)) return value.map((v) => sanitizeNulls(v));

  // Objects: sanitize properties (pass the property key so nested fields like 'photo' are preserved)
  const out: Record<string, any> = {};
  for (const k of Object.keys(value)) {
    const child = (value as any)[k];
    // If the child is null and it's the photo field, preserve null; otherwise sanitize recursively
    if (child === null && k === "photo") {
      out[k] = null;
    } else {
      out[k] = sanitizeNulls(child, k);
    }
  }
  return out;
}

// Generic validation middleware factory
export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize explicit nulls coming from clients so optional validators accept them
      if (req.body && typeof req.body === "object") {
        req.body = sanitizeNulls(req.body);
      }

      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        const parsed = schema.query.parse(req.query);
        // Clear existing query properties and assign parsed values
        for (const key in req.query) {
          delete req.query[key];
        }
        for (const key in parsed as any) {
          req.query[key] = (parsed as any)[key];
        }
      }

      // Validate route parameters
      if (schema.params) {
        const parsed = schema.params.parse(req.params);
        req.params = parsed as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as ZodError;
        const errorMessages = zodError.issues.map((issue) => {
          const path = issue.path.join(".");
          return `${path}: ${issue.message}`;
        });

        throw new ValidationError(
          `Validation failed: ${errorMessages.join(", ")}`
        );
      }
      next(error);
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
  }),

  // Pagination query validation
  paginationQuery: z
    .object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    })
    .refine((data) => data.page >= 1, { message: "Page must be >= 1" })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
    }),

  // Search query validation
  searchQuery: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  }),

  // Email validation
  email: z.string().email("Invalid email format"),

  // Password validation
  password: z.string().min(8, "Password must be at least 8 characters long"),

  // Date validation
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .transform((str) => new Date(str)),

  // Optional date validation
  optionalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .transform((str) => new Date(str))
    .optional(),

  // Decimal validation
  decimal: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error("Must be a valid number");
    return num;
  }),

  // Optional decimal validation
  optionalDecimal: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(num)) throw new Error("Must be a valid number");
      return num;
    })
    .optional(),
};

// Staff validation schemas
export const staffSchemas = {
  create: z.object({
    employeeId: z
      .string()
      .max(50, "ID must be 50 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]*$/,
        "ID can only contain letters, numbers, underscores, and hyphens"
      )
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .regex(
        /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
        "Name can only contain letters, spaces, and Japanese characters"
      ),
    position: z
      .string()
      .max(100, "Position must be 100 characters or less")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    department: z
      .string()
      .max(100, "Department must be 100 characters or less")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    email: commonSchemas.email.optional(),
    phone: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Phone number contains invalid characters")
      .max(20, "Phone number must be 20 characters or less")
      .optional(),
    address: z
      .string()
      .max(1000, "Address must be 1000 characters or less")
      .optional(),
    hireDate: commonSchemas.optionalDate,
    salary: commonSchemas.optionalDecimal.refine(
      (val) => val === null || val === undefined || val >= 0,
      {
        message: "Salary must be a positive number",
      }
    ),
    userId: z
      .union([z.string(), z.number(), z.null()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("User ID must be a valid number");
        return num;
      })
      .optional()
      .nullable(),
    residenceStatus: z
      .string()
      .max(100, "Residence status must be 100 characters or less")
      .optional(),
    age: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Age must be a valid number");
        if (num < 0 || num > 150)
          throw new Error("Age must be between 0 and 150");
        return num;
      })
      .optional(),
    nationality: z
      .string()
      .max(100, "Nationality must be 100 characters or less")
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
    companiesId: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Company ID must be a valid number");
        return num;
      })
      .optional(),

    // New header fields
    photo: enhancedPhotoPathSchema,
    furiganaName: z
      .string()
      .max(255, "Furigana name must be 255 characters or less")
      .regex(
        /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF]*$/,
        "Furigana name can only contain letters, spaces, and Japanese characters"
      )
      .optional(),
    gender: z.enum(["M", "F"]).optional(),

    // New basic information fields
    dateOfBirth: enhancedDateOfBirthSchema,
    postalCode: z
      .string()
      .regex(/^[\d-]*$/, "Postal code can only contain numbers and hyphens")
      .max(10, "Postal code must be 10 characters or less")
      .optional(),
    mobile: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Mobile number contains invalid characters")
      .max(20, "Mobile number must be 20 characters or less")
      .optional(),
    fax: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Fax number contains invalid characters")
      .max(20, "Fax number must be 20 characters or less")
      .optional(),
    periodOfStayDateStart: commonSchemas.optionalDate,
    periodOfStayDateEnd: commonSchemas.optionalDate,
    qualificationsAndLicenses: z
      .string()
      .max(2000, "Qualifications and licenses must be 2000 characters or less")
      .optional(),
    japaneseProficiency: z
      .string()
      .max(2000, "Japanese proficiency must be 2000 characters or less")
      .optional(),
    japaneseProficiencyRemarks: z
      .string()
      .max(2000, "Japanese proficiency remarks must be 2000 characters or less")
      .optional(),

    // Ordered array fields
    educationName: z.array(z.string()).optional(),
    educationType: z
      .array(
        z.enum([
          "UNIVERSITY_POSTGRADUATE",
          "UNIVERSITY_UNDERGRADUATE",
          "VOCATIONAL",
          "HIGH_SCHOOL",
          "LANGUAGE_SCHOOL",
        ])
      )
      .optional(),
    workHistoryName: z.array(z.string()).optional(),
    workHistoryDateStart: z.array(z.string()).optional(),
    workHistoryDateEnd: z.array(z.string()).optional(),
    workHistoryCountryLocation: z.array(z.string()).optional(),
    workHistoryCityLocation: z.array(z.string()).optional(),
    workHistoryPosition: z.array(z.string()).optional(),
    workHistoryEmploymentType: z
      .array(
        z.enum(["FULL_TIME", "DISPATCH", "PART_TIME", "CONTRACT", "OTHERS"])
      )
      .optional(),
    workHistoryDescription: z.array(z.string()).optional(),

    // Additional personal fields
    reasonForApplying: z
      .string()
      .max(2000, "Reason for applying must be 2000 characters or less")
      .optional(),
    motivationToComeJapan: z
      .string()
      .max(2000, "Motivation to come Japan must be 2000 characters or less")
      .optional(),
    familySpouse: z.boolean().optional(),
    familyChildren: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num))
          throw new Error("Family children must be a valid number");
        if (num < 0)
          throw new Error("Family children must be a positive number");
        return num;
      })
      .optional(),
    hobbyAndInterests: z
      .string()
      .max(2000, "Hobby and interests must be 2000 characters or less")
      .optional(),

    // Emergency contacts
    emergencyContactPrimaryName: z
      .string()
      .max(255, "Emergency contact primary name must be 255 characters or less")
      .optional(),
    emergencyContactPrimaryRelationship: z
      .string()
      .max(
        100,
        "Emergency contact primary relationship must be 100 characters or less"
      )
      .optional(),
    emergencyContactPrimaryNumber: z
      .string()
      .regex(
        /^[\d+() \s-]*$/,
        "Emergency contact primary number contains invalid characters"
      )
      .max(20, "Emergency contact primary number must be 20 characters or less")
      .optional(),
    emergencyContactPrimaryEmail: commonSchemas.email.optional(),
    emergencyContactSecondaryName: z
      .string()
      .max(
        255,
        "Emergency contact secondary name must be 255 characters or less"
      )
      .optional(),
    emergencyContactSecondaryRelationship: z
      .string()
      .max(
        100,
        "Emergency contact secondary relationship must be 100 characters or less"
      )
      .optional(),
    emergencyContactSecondaryNumber: z
      .string()
      .regex(
        /^[\d+() \s-]*$/,
        "Emergency contact secondary number contains invalid characters"
      )
      .max(
        20,
        "Emergency contact secondary number must be 20 characters or less"
      )
      .optional(),
    emergencyContactSecondaryEmail: commonSchemas.email.optional(),

    remarks: z
      .string()
      .max(2000, "Remarks must be 2000 characters or less")
      .optional(),
  }),

  update: z.object({
    employeeId: z
      .string()
      .max(50, "ID must be 50 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]*$/,
        "ID can only contain letters, numbers, underscores, and hyphens"
      )
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .regex(
        /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
        "Name can only contain letters, spaces, and Japanese characters"
      )
      .optional(),
    position: z
      .string()
      .max(100, "Position must be 100 characters or less")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    department: z
      .string()
      .max(100, "Department must be 100 characters or less")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    email: commonSchemas.email.optional(),
    phone: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Phone number contains invalid characters")
      .max(20, "Phone number must be 20 characters or less")
      .optional(),
    address: z
      .string()
      .max(1000, "Address must be 1000 characters or less")
      .optional(),
    hireDate: commonSchemas.optionalDate,
    salary: commonSchemas.optionalDecimal.refine(
      (val) => val === null || val === undefined || val >= 0,
      {
        message: "Salary must be a positive number",
      }
    ),
    status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE"]).optional(),
    userId: z
      .union([z.string(), z.number(), z.null()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("User ID must be a valid number");
        return num;
      })
      .optional()
      .nullable(),
    residenceStatus: z
      .string()
      .max(100, "Residence status must be 100 characters or less")
      .optional(),
    age: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Age must be a valid number");
        if (num < 0 || num > 150)
          throw new Error("Age must be between 0 and 150");
        return num;
      })
      .optional(),
    nationality: z
      .string()
      .max(100, "Nationality must be 100 characters or less")
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
    companiesId: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Company ID must be a valid number");
        return num;
      })
      .optional(),

    // New header fields
    furiganaName: z
      .string()
      .max(255, "Furigana name must be 255 characters or less")
      .regex(
        /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF]*$/,
        "Furigana name can only contain letters, spaces, and Japanese characters"
      )
      .optional(),
    gender: z.enum(["M", "F"]).optional(),

    // New basic information fields
    dateOfBirth: enhancedDateOfBirthSchema,
    postalCode: z
      .string()
      .regex(/^[\d-]*$/, "Postal code can only contain numbers and hyphens")
      .max(10, "Postal code must be 10 characters or less")
      .optional(),
    mobile: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Mobile number contains invalid characters")
      .max(20, "Mobile number must be 20 characters or less")
      .optional(),
    fax: z
      .string()
      .regex(/^[\d+() \s-]*$/, "Fax number contains invalid characters")
      .max(20, "Fax number must be 20 characters or less")
      .optional(),
    periodOfStayDateStart: commonSchemas.optionalDate,
    periodOfStayDateEnd: commonSchemas.optionalDate,
    qualificationsAndLicenses: z
      .string()
      .max(2000, "Qualifications and licenses must be 2000 characters or less")
      .optional(),
    japaneseProficiency: z
      .string()
      .max(2000, "Japanese proficiency must be 2000 characters or less")
      .optional(),
    japaneseProficiencyRemarks: z
      .string()
      .max(2000, "Japanese proficiency remarks must be 2000 characters or less")
      .optional(),

    // Ordered array fields
    educationName: z.array(z.string()).optional(),
    educationType: z
      .array(
        z.enum([
          "UNIVERSITY_POSTGRADUATE",
          "UNIVERSITY_UNDERGRADUATE",
          "VOCATIONAL",
          "HIGH_SCHOOL",
          "LANGUAGE_SCHOOL",
        ])
      )
      .optional(),
    workHistoryName: z.array(z.string()).optional(),
    workHistoryDateStart: z.array(z.string()).optional(),
    workHistoryDateEnd: z.array(z.string()).optional(),
    workHistoryCountryLocation: z.array(z.string()).optional(),
    workHistoryCityLocation: z.array(z.string()).optional(),
    workHistoryPosition: z.array(z.string()).optional(),
    workHistoryEmploymentType: z
      .array(
        z.enum(["FULL_TIME", "DISPATCH", "PART_TIME", "CONTRACT", "OTHERS"])
      )
      .optional(),
    workHistoryDescription: z.array(z.string()).optional(),

    // Additional personal fields
    reasonForApplying: z
      .string()
      .max(2000, "Reason for applying must be 2000 characters or less")
      .optional(),
    motivationToComeJapan: z
      .string()
      .max(2000, "Motivation to come Japan must be 2000 characters or less")
      .optional(),
    familySpouse: z.boolean().optional(),
    familyChildren: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num))
          throw new Error("Family children must be a valid number");
        if (num < 0)
          throw new Error("Family children must be a positive number");
        return num;
      })
      .optional(),
    hobbyAndInterests: z
      .string()
      .max(2000, "Hobby and interests must be 2000 characters or less")
      .optional(),

    // Emergency contacts
    emergencyContactPrimaryName: z
      .string()
      .max(255, "Emergency contact primary name must be 255 characters or less")
      .optional(),
    emergencyContactPrimaryRelationship: z
      .string()
      .max(
        100,
        "Emergency contact primary relationship must be 100 characters or less"
      )
      .optional(),
    emergencyContactPrimaryNumber: z
      .string()
      .regex(
        /^[\d+() \s-]*$/,
        "Emergency contact primary number contains invalid characters"
      )
      .max(20, "Emergency contact primary number must be 20 characters or less")
      .optional(),
    emergencyContactPrimaryEmail: commonSchemas.email.optional(),
    emergencyContactSecondaryName: z
      .string()
      .max(
        255,
        "Emergency contact secondary name must be 255 characters or less"
      )
      .optional(),
    emergencyContactSecondaryRelationship: z
      .string()
      .max(
        100,
        "Emergency contact secondary relationship must be 100 characters or less"
      )
      .optional(),
    emergencyContactSecondaryNumber: z
      .string()
      .regex(
        /^[\d+() \s-]*$/,
        "Emergency contact secondary number contains invalid characters"
      )
      .max(
        20,
        "Emergency contact secondary number must be 20 characters or less"
      )
      .optional(),
    emergencyContactSecondaryEmail: commonSchemas.email.optional(),

    remarks: z
      .string()
      .max(2000, "Remarks must be 2000 characters or less")
      .optional(),
  }),

  assignment: z.object({
    propertyId: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num)) throw new Error("Property ID must be a valid number");
      return num;
    }),
    role: z
      .string()
      .min(1, "Role is required")
      .max(100, "Role must be 100 characters or less"),
    startDate: commonSchemas.date,
  }),

  query: z
    .object({
      search: z.string().optional(),
      department: z.string().optional(),
      status: z
        .enum(["ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE", "ALL"])
        .optional()
        .default("ACTIVE"),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    })
    .refine((data) => data.page >= 1, { message: "Page must be >= 1" })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
    }),
};

// Rest of the schemas remain the same...
// Property validation schemas
export const propertySchemas = {
  create: z.object({
    propertyCode: z
      .string()
      .min(1, "Property code is required")
      .max(50, "Property code must be 50 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Property code can only contain letters, numbers, underscores, and hyphens"
      ),
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be 255 characters or less"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(1000, "Address must be 1000 characters or less"),
    propertyType: z.enum([
      "RESIDENTIAL",
      "COMMERCIAL",
      "INDUSTRIAL",
      "MIXED_USE",
    ]),
    managerId: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Manager ID must be a valid number");
        return num;
      })
      .optional(),
    description: z
      .string()
      .max(2000, "Description must be 2000 characters or less")
      .optional(),
  }),

  update: z.object({
    propertyCode: z
      .string()
      .min(1, "Property code is required")
      .max(50, "Property code must be 50 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Property code can only contain letters, numbers, underscores, and hyphens"
      )
      .optional(),
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be 255 characters or less")
      .optional(),
    address: z
      .string()
      .min(1, "Address is required")
      .max(1000, "Address must be 1000 characters or less")
      .optional(),
    propertyType: z
      .enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "MIXED_USE"])
      .optional(),
    managerId: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num)) throw new Error("Manager ID must be a valid number");
        return num;
      })
      .optional(),
    description: z
      .string()
      .max(2000, "Description must be 2000 characters or less")
      .optional(),
    status: z
      .enum(["ACTIVE", "INACTIVE", "UNDER_CONSTRUCTION", "SOLD"])
      .optional(),
  }),

  query: z
    .object({
      search: z.string().optional(),
      propertyType: z
        .enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "MIXED_USE"])
        .optional(),
      status: z
        .enum(["ACTIVE", "INACTIVE", "UNDER_CONSTRUCTION", "SOLD", "ALL"])
        .optional()
        .default("ACTIVE"),
      managerId: z.string().regex(/^\d+$/).transform(Number).optional(),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    })
    .refine((data) => data.page >= 1, { message: "Page must be >= 1" })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
    }),
};

// User validation schemas
export const userSchemas = {
  create: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(50, "Username must be 50 characters or less")
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Username can only contain letters, numbers, underscores, dots, and hyphens"
      ),
    email: commonSchemas.email,
    password: commonSchemas.password,
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .regex(
        /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
        "Name can only contain letters, spaces, and Japanese characters"
      ),
    role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional().default("USER"),
    languagePreference: z.enum(["EN", "JA"]).optional().default("EN"),
  }),

  update: z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(50, "Username must be 50 characters or less")
        .regex(
          /^[a-zA-Z0-9_.-]+$/,
          "Username can only contain letters, numbers, underscores, dots, and hyphens"
        )
        .optional(),
      email: commonSchemas.email.optional(),
      name: z
        .string()
        .min(1, "Name is required")
        .max(100, "Name must be 100 characters or less")
        .regex(
          /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
          "Name can only contain letters, spaces, and Japanese characters"
        )
        .optional(),
      role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
      languagePreference: z.enum(["EN", "JA"]).optional(),
      isActive: z.boolean().optional(),
      currentPassword: z.string().optional(),
      newPassword: commonSchemas.password.optional(),
    })
    .refine(
      (data) => {
        // If newPassword is provided, currentPassword should also be provided (for own profile updates)
        if (data.newPassword && !data.currentPassword) {
          return false;
        }
        return true;
      },
      { message: "Current password is required when changing password" }
    ),

  query: z
    .object({
      search: z.string().optional(),
      role: z
        .enum(["USER", "ADMIN", "SUPER_ADMIN", "ALL"])
        .optional()
        .default("ALL"),
      isActive: z.enum(["true", "false", "all"]).optional().default("true"),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    })
    .refine((data) => data.page >= 1, { message: "Page must be >= 1" })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
    }),
};

// System configuration validation schemas
export const systemConfigSchemas = {
  create: z
    .object({
      key: z
        .string()
        .min(1, "Key is required")
        .max(100, "Key must be 100 characters or less")
        .regex(
          /^[a-zA-Z0-9_.-]+$/,
          "Key can only contain letters, numbers, underscores, dots, and hyphens"
        ),
      value: z.string().min(1, "Value is required"),
      description: z
        .string()
        .max(500, "Description must be 500 characters or less")
        .optional(),
      category: z
        .string()
        .min(1, "Category is required")
        .max(50, "Category must be 50 characters or less"),
      dataType: z
        .enum(["STRING", "NUMBER", "BOOLEAN", "JSON"])
        .optional()
        .default("STRING"),
    })
    .refine(
      (data) => {
        // Validate value based on data type
        if (data.dataType === "NUMBER") {
          const numValue = parseFloat(data.value);
          return !isNaN(numValue);
        } else if (data.dataType === "BOOLEAN") {
          return ["true", "false"].includes(data.value.toLowerCase());
        } else if (data.dataType === "JSON") {
          try {
            JSON.parse(data.value);
            return true;
          } catch {
            return false;
          }
        }
        return true;
      },
      {
        message: "Value must match the specified data type",
        path: ["value"],
      }
    ),

  update: z
    .object({
      key: z
        .string()
        .min(1, "Key is required")
        .max(100, "Key must be 100 characters or less")
        .regex(
          /^[a-zA-Z0-9_.-]+$/,
          "Key can only contain letters, numbers, underscores, dots, and hyphens"
        )
        .optional(),
      value: z.string().min(1, "Value is required").optional(),
      description: z
        .string()
        .max(500, "Description must be 500 characters or less")
        .optional(),
      category: z
        .string()
        .min(1, "Category is required")
        .max(50, "Category must be 50 characters or less")
        .optional(),
      dataType: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON"]).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // Validate value based on data type if both are provided
        if (data.value && data.dataType) {
          if (data.dataType === "NUMBER") {
            const numValue = parseFloat(data.value);
            return !isNaN(numValue);
          } else if (data.dataType === "BOOLEAN") {
            return ["true", "false"].includes(data.value.toLowerCase());
          } else if (data.dataType === "JSON") {
            try {
              JSON.parse(data.value);
              return true;
            } catch {
              return false;
            }
          }
        }
        return true;
      },
      {
        message: "Value must match the specified data type",
        path: ["value"],
      }
    ),

  query: z
    .object({
      category: z.string().optional(),
      isActive: z.enum(["true", "false", "all"]).optional().default("true"),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default(20),
    })
    .refine((data) => data.page >= 1, { message: "Page must be >= 1" })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
    }),
};

// Authentication validation schemas
export const authSchemas = {
  login: z.object({
    id: z.string().min(1, "User ID or email is required"),
    password: z.string().min(1, "Password is required"),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: commonSchemas.password,
  }),

  resetPassword: z.object({
    email: commonSchemas.email,
  }),
};

// Property Staff Assignment validation schemas
export const propertyStaffAssignmentSchemas = {
  create: z.object({
    propertyId: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num)) throw new Error("Property ID must be a valid number");
      return num;
    }),
    staffId: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num)) throw new Error("Staff ID must be a valid number");
      return num;
    }),
    role: z
      .string()
      .min(1, "Role is required")
      .max(100, "Role must be 100 characters or less"),
    startDate: commonSchemas.date,
    endDate: commonSchemas.optionalDate,
  }),

  update: z.object({
    role: z
      .string()
      .min(1, "Role is required")
      .max(100, "Role must be 100 characters or less")
      .optional(),
    endDate: commonSchemas.optionalDate,
    isActive: z.boolean().optional(),
  }),
};

// User Session validation schemas
export const userSessionSchemas = {
  create: z.object({
    userId: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num)) throw new Error("User ID must be a valid number");
      return num;
    }),
    tokenHash: z.string().min(1, "Token hash is required"),
    deviceInfo: z
      .string()
      .max(500, "Device info must be 500 characters or less")
      .optional(),
    ipAddress: z
      .string()
      .regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
        "Invalid IP address format"
      )
      .optional(),
    expiresAt: commonSchemas.date,
  }),
};

// Conversation (Reply) validation schemas
export const conversationSchemas = {
  // Create reply request validation
  createReply: z.object({
    messageText: z
      .string()
      .min(1, "Message text is required")
      .max(2000, "Message text must be 2000 characters or less")
      .trim(),
  }),

  // Update reply request validation
  updateReply: z.object({
    messageText: z
      .string()
      .min(1, "Message text is required")
      .max(2000, "Message text must be 2000 characters or less")
      .trim(),
  }),

  // Get replies query parameters validation
  getRepliesQuery: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(20),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default(0),
  }),

  // Reply ID parameter validation
  replyIdParam: z.object({
    replyId: z
      .string()
      .regex(/^\d+$/, "Reply ID must be a positive integer")
      .transform(Number),
  }),

  // Parent ID parameter validation (inquiry or daily record)
  parentIdParam: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
  }),

  // Combined parent and reply ID parameters
  parentAndReplyIdParams: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a positive integer")
      .transform(Number),
    replyId: z
      .string()
      .regex(/^\d+$/, "Reply ID must be a positive integer")
      .transform(Number),
  }),
};
