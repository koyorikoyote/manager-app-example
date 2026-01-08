import { z } from "zod";

/**
 * Enhanced validation schemas for date and photo fields
 */

// Enhanced date of birth validation
export const enhancedDateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .transform((str) => new Date(str))
  .refine(
    (date) => {
      const today = new Date();
      return date <= today;
    },
    { message: "Date of birth cannot be in the future" }
  )
  .refine(
    (date) => {
      const minDate = new Date(1900, 0, 1);
      return date >= minDate;
    },
    { message: "Date of birth must be after January 1, 1900" }
  )
  .refine(
    (date) => {
      const today = new Date();
      const age = Math.floor(
        (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      return age <= 150;
    },
    { message: "Calculated age seems unrealistic (over 150 years)" }
  )
  .optional();

// Enhanced photo path validation
export const enhancedPhotoPathSchema = z
  .string()
  .max(500, "Photo path must be less than 500 characters")
  .refine(
    (path) => {
      if (!path || path.trim() === "") return true; // Optional field

      // Basic URL/path validation
      const validPathRegex = /^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%/]+$/;
      return validPathRegex.test(path);
    },
    { message: "Invalid photo path format" }
  )
  .optional()
  .nullable();

// Manual date input validation (YYYY/MM/DD format)
export const manualDateInputSchema = z
  .string()
  .refine(
    (input) => {
      if (!input || input.trim() === "") return true; // Optional field

      const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
      const match = input.match(dateRegex);

      if (!match) return false;

      const [, year, month, day] = match;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);

      // Basic range checks
      if (monthNum < 1 || monthNum > 12) return false;
      if (dayNum < 1 || dayNum > 31) return false;

      // Create date and validate it's real
      const date = new Date(yearNum, monthNum - 1, dayNum);

      if (
        date.getFullYear() !== yearNum ||
        date.getMonth() !== monthNum - 1 ||
        date.getDate() !== dayNum
      ) {
        return false;
      }

      // Additional date of birth validations
      const today = new Date();
      const minDate = new Date(1900, 0, 1);

      if (date > today || date < minDate) return false;

      const age = Math.floor(
        (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age > 150) return false;

      return true;
    },
    { message: "Invalid date format or unrealistic date" }
  )
  .optional();

// Daily record validation schema updates
export const dailyRecordEnhancedSchemas = {
  create: z.object({
    dateOfRecord: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .transform((str) => new Date(str))
      .refine(
        (date) => {
          const today = new Date();
          return date <= today;
        },
        { message: "Record date cannot be in the future" }
      ),
    staffId: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val) : val;
      if (isNaN(num) || num <= 0)
        throw new Error("Please select a valid staff member");
      return num;
    }),
    conditionStatus: z.enum(["Excellent", "Good", "Fair", "Poor"], {
      message: "Please select a valid condition status",
    }),
    feedbackContent: z
      .string()
      .min(10, "Feedback content must be at least 10 characters")
      .max(1000, "Feedback content must be 1000 characters or less"),
    contactNumber: z
      .string()
      .regex(/^[\d\s\-+()]+$/, "Contact number contains invalid characters")
      .min(10, "Contact number must be at least 10 characters")
      .max(20, "Contact number must be 20 characters or less")
      .optional()
      .nullable(),
    photo: enhancedPhotoPathSchema,
  }),

  update: z.object({
    dateOfRecord: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .transform((str) => new Date(str))
      .refine(
        (date) => {
          const today = new Date();
          return date <= today;
        },
        { message: "Record date cannot be in the future" }
      )
      .optional(),
    staffId: z
      .union([z.string(), z.number()])
      .transform((val) => {
        const num = typeof val === "string" ? parseInt(val) : val;
        if (isNaN(num) || num <= 0)
          throw new Error("Please select a valid staff member");
        return num;
      })
      .optional(),
    conditionStatus: z
      .enum(["Excellent", "Good", "Fair", "Poor"], {
        message: "Please select a valid condition status",
      })
      .optional(),
    feedbackContent: z
      .string()
      .min(10, "Feedback content must be at least 10 characters")
      .max(1000, "Feedback content must be 1000 characters or less")
      .optional(),
    contactNumber: z
      .string()
      .regex(/^[\d\s\-+()]+$/, "Contact number contains invalid characters")
      .min(10, "Contact number must be at least 10 characters")
      .max(20, "Contact number must be 20 characters or less")
      .optional()
      .nullable(),
    photo: enhancedPhotoPathSchema,
  }),
};

// Staff validation schema updates for date of birth
export const staffEnhancedSchemas = {
  dateOfBirth: enhancedDateOfBirthSchema,
  manualDateInput: manualDateInputSchema,
};

// Validation error messages
export const enhancedValidationMessages = {
  dateOfBirth: {
    required: "Date of birth is required",
    invalid: "Please enter a valid date",
    future: "Date of birth cannot be in the future",
    tooOld: "Date of birth must be after January 1, 1900",
    unrealistic: "Calculated age seems unrealistic (over 150 years)",
    format: "Date must be in YYYY-MM-DD format",
  },
  photo: {
    tooLong: "Photo path too long (maximum 500 characters)",
    invalidFormat: "Invalid photo path format",
    required: "Photo is required",
  },
  manualDate: {
    format: "Date must be in YYYY/MM/DD format",
    invalid: "Invalid date (e.g., February 30th doesn't exist)",
    monthRange: "Month must be between 1 and 12",
    dayRange: "Day must be between 1 and 31",
  },
};
