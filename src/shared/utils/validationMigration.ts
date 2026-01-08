// Validation migration utilities to ensure backward compatibility with existing data

import { validateDateOfBirth, parseDate } from "./dateValidation";
import { validatePhotoPath } from "./photoValidation";
import { formatDateToJST } from "./jstDateUtils";

/**
 * Migration utilities for existing data validation
 */
export class ValidationMigration {
  /**
   * Migrate existing daily record data to ensure it passes new validation
   */
  static migrateDailyRecordData(record: any): any {
    const migrated = { ...record };

    // Ensure photo field is properly formatted
    if (migrated.photo) {
      // If photo is not a string or is empty, set to null
      if (typeof migrated.photo !== "string" || migrated.photo.trim() === "") {
        migrated.photo = null;
      } else {
        // Validate and clean photo path
        const photoValidation = validatePhotoPath(migrated.photo);
        if (!photoValidation.isValid) {
          console.warn(
            `Invalid photo path in daily record ${record.id}: ${photoValidation.error}`
          );
          migrated.photo = null;
        }
      }
    }

    // Ensure date fields are properly formatted
    if (migrated.dateOfRecord) {
      const parsedDate = parseDate(migrated.dateOfRecord);
      if (parsedDate) {
        migrated.dateOfRecord = parsedDate;
      } else {
        console.warn(`Invalid date of record in daily record ${record.id}`);
        // Keep original value but log warning
      }
    }

    // Ensure contact number is properly formatted
    if (migrated.contactNumber) {
      if (typeof migrated.contactNumber !== "string") {
        migrated.contactNumber = String(migrated.contactNumber);
      }
      // Clean up contact number format
      migrated.contactNumber = migrated.contactNumber.replace(
        /[^\d\s\-+()]/g,
        ""
      );
    }

    return migrated;
  }

  /**
   * Migrate existing staff data to ensure it passes new validation
   */
  static migrateStaffData(staff: any): any {
    const migrated = { ...staff };

    // Handle date of birth field
    if (migrated.dateOfBirth) {
      const parsedDate = parseDate(migrated.dateOfBirth);
      if (parsedDate) {
        const validation = validateDateOfBirth(parsedDate);
        if (validation.isValid) {
          migrated.dateOfBirth = parsedDate;
        } else {
          console.warn(
            `Invalid date of birth for staff ${staff.id}: ${validation.error}`
          );
          migrated.dateOfBirth = null;
        }
      } else {
        console.warn(`Could not parse date of birth for staff ${staff.id}`);
        migrated.dateOfBirth = null;
      }
    }

    // Handle age field - ensure it's consistent with date of birth
    if (migrated.dateOfBirth && migrated.age) {
      const calculatedAge = this.calculateAge(migrated.dateOfBirth);
      const providedAge =
        typeof migrated.age === "string"
          ? parseInt(migrated.age)
          : migrated.age;

      // If ages differ significantly, use calculated age
      if (Math.abs(calculatedAge - providedAge) > 1) {
        console.warn(
          `Age mismatch for staff ${staff.id}: provided ${providedAge}, calculated ${calculatedAge}`
        );
        migrated.age = calculatedAge;
      }
    }

    // Ensure photo field is properly formatted
    if (migrated.photo) {
      if (typeof migrated.photo !== "string" || migrated.photo.trim() === "") {
        migrated.photo = null;
      } else {
        const photoValidation = validatePhotoPath(migrated.photo);
        if (!photoValidation.isValid) {
          console.warn(
            `Invalid photo path for staff ${staff.id}: ${photoValidation.error}`
          );
          migrated.photo = null;
        }
      }
    }

    // Clean up phone numbers
    ["phone", "mobile", "fax"].forEach((field) => {
      if (migrated[field]) {
        if (typeof migrated[field] !== "string") {
          migrated[field] = String(migrated[field]);
        }
        // Clean up phone number format
        migrated[field] = migrated[field].replace(/[^\d\s\-+()]/g, "");
      }
    });

    // Clean up email
    if (migrated.email && typeof migrated.email !== "string") {
      migrated.email = String(migrated.email);
    }

    return migrated;
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(birthDate: Date): number {
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
  }

  /**
   * Validate existing data and return migration report
   */
  static validateExistingData(
    data: any[],
    dataType: "dailyRecord" | "staff"
  ): {
    valid: any[];
    invalid: any[];
    migrated: any[];
    report: string[];
  } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const migrated: any[] = [];
    const report: string[] = [];

    data.forEach((item, index) => {
      try {
        const migratedItem =
          dataType === "dailyRecord"
            ? this.migrateDailyRecordData(item)
            : this.migrateStaffData(item);

        // Check if migration changed anything
        const hasChanges =
          JSON.stringify(item) !== JSON.stringify(migratedItem);

        if (hasChanges) {
          migrated.push(migratedItem);
          report.push(`${dataType} ${item.id || index}: migrated with changes`);
        } else {
          valid.push(item);
        }
      } catch (error) {
        invalid.push(item);
        report.push(
          `${dataType} ${item.id || index}: validation failed - ${error}`
        );
      }
    });

    return { valid, invalid, migrated, report };
  }

  /**
   * Generate migration SQL for database updates
   */
  static generateMigrationSQL(
    migratedData: any[],
    dataType: "dailyRecord" | "staff"
  ): string[] {
    const sqlStatements: string[] = [];

    migratedData.forEach((item) => {
      if (dataType === "dailyRecord") {
        const updates: string[] = [];

        if (item.photo !== undefined) {
          updates.push(`photo = ${item.photo ? `'${item.photo}'` : "NULL"}`);
        }

        if (item.contactNumber !== undefined) {
          updates.push(
            `contact_number = ${
              item.contactNumber ? `'${item.contactNumber}'` : "NULL"
            }`
          );
        }

        if (updates.length > 0) {
          sqlStatements.push(
            `UPDATE daily_records SET ${updates.join(", ")} WHERE id = ${
              item.id
            };`
          );
        }
      } else if (dataType === "staff") {
        const updates: string[] = [];

        if (item.dateOfBirth !== undefined) {
          updates.push(
            `date_of_birth = ${
              item.dateOfBirth
                ? `'${formatDateToJST(item.dateOfBirth)}'`
                : "NULL"
            }`
          );
        }

        if (item.age !== undefined) {
          updates.push(`age = ${item.age || "NULL"}`);
        }

        if (item.photo !== undefined) {
          updates.push(`photo = ${item.photo ? `'${item.photo}'` : "NULL"}`);
        }

        if (updates.length > 0) {
          sqlStatements.push(
            `UPDATE staff SET ${updates.join(", ")} WHERE id = ${item.id};`
          );
        }
      }
    });

    return sqlStatements;
  }
}

/**
 * Utility functions for backward compatibility
 */
export const backwardCompatibility = {
  /**
   * Check if data needs migration
   */
  needsMigration: (data: any, dataType: "dailyRecord" | "staff"): boolean => {
    try {
      const migrated =
        dataType === "dailyRecord"
          ? ValidationMigration.migrateDailyRecordData(data)
          : ValidationMigration.migrateStaffData(data);

      return JSON.stringify(data) !== JSON.stringify(migrated);
    } catch {
      return true; // If migration fails, assume it needs migration
    }
  },

  /**
   * Safely migrate single item
   */
  migrateSafely: (data: any, dataType: "dailyRecord" | "staff"): any => {
    try {
      return dataType === "dailyRecord"
        ? ValidationMigration.migrateDailyRecordData(data)
        : ValidationMigration.migrateStaffData(data);
    } catch (error) {
      console.error(`Migration failed for ${dataType}:`, error);
      return data; // Return original data if migration fails
    }
  },

  /**
   * Validate migrated data
   */
  validateMigrated: (
    data: unknown,
    dataType: "dailyRecord" | "staff"
  ): boolean => {
    // This would use the actual validators to check if migrated data is valid
    // For now, return true as a placeholder
    return true;
  },
};
