import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { FilterableColumn, FilterOption } from "../../shared/types/filtering";
import filterCacheService from "./FilterCacheService";

export interface NumericRange {
  label: string;
  min: number;
  max: number;
}

export interface NumericRangeAnalysis {
  min: number;
  max: number;
  ranges: NumericRange[];
}

interface ColumnDefinition {
  key: string;
  label: string;
  dataType: "string" | "number" | "date" | "enum";
}

export class FilterAnalyzer {
  private prisma: PrismaClient;

  // System columns to exclude from filtering
  private readonly EXCLUDED_COLUMNS = [
    "id",
    "createdAt",
    "updatedAt",
    "created_at",
    "updated_at",
  ];

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Analyze columns for a given table to determine which ones are filterable
   */
  async analyzeColumns(
    tableName: string,
    columns: ColumnDefinition[]
  ): Promise<FilterableColumn[]> {
    const filterableColumns: FilterableColumn[] = [];

    for (const column of columns) {
      // Skip system columns
      if (this.EXCLUDED_COLUMNS.includes(column.key)) {
        continue;
      }

      try {
        const hasMultipleValues = await this.checkColumnHasMultipleValues(
          tableName,
          column.key
        );

        if (hasMultipleValues) {
          const optionCount = await this.getColumnOptionCount(
            tableName,
            column.key
          );

          filterableColumns.push({
            key: column.key,
            label: column.label,
            dataType: column.dataType,
            hasMultipleValues: true,
            optionCount,
          });
        }
      } catch (error) {
        console.error(
          `Error analyzing column ${column.key} for table ${tableName}:`,
          error
        );
        // Continue with other columns even if one fails
      }
    }

    return filterableColumns;
  }

  /**
   * Get filter options for a specific column
   */
  async getFilterOptions(
    tableName: string,
    columnKey: string
  ): Promise<FilterOption[]> {
    // Check cache first
    const cached = filterCacheService.get(tableName, columnKey);
    if (cached) {
      return cached;
    }

    try {
      const options = await this.fetchFilterOptions(tableName, columnKey);

      // Cache the results
      filterCacheService.set(tableName, columnKey, options);

      return options;
    } catch (error) {
      console.error(
        `Error fetching filter options for ${tableName}.${columnKey}:`,
        error
      );
      return [];
    }
  }

  /**
   * Clear cache for a specific table or all tables
   */
  clearCache(tableName?: string): void {
    filterCacheService.clear(tableName);
  }

  /**
   * Invalidate cache for a table (useful after data mutations)
   */
  invalidateTableCache(tableName: string): void {
    filterCacheService.invalidateTable(tableName);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return filterCacheService.getStats();
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): number {
    return filterCacheService.cleanupExpired();
  }

  /**
   * Analyze numeric column to calculate min/max values and create 4 range groups
   */
  async analyzeNumericColumn(
    tableName: string,
    columnName: string
  ): Promise<NumericRangeAnalysis> {
    try {
      let result;

      switch (tableName.toLowerCase()) {
        case "staff":
          // Handle age column specifically
          if (columnName === "age") {
            const agg = await this.prisma.staff.aggregate({
              _min: { age: true },
              _max: { age: true },
              where: { age: { not: null } },
            });
            result = [
              {
                minValue: agg._min.age ?? null,
                maxValue: agg._max.age ?? null,
              },
            ];
          } else {
            result = await this.prisma.$queryRaw`
              SELECT MIN(${this.prisma.$queryRawUnsafe(
                columnName
              )}) as minValue, MAX(${this.prisma.$queryRawUnsafe(
              columnName
            )}) as maxValue
              FROM staff 
              WHERE ${this.prisma.$queryRawUnsafe(columnName)} IS NOT NULL
            `;
          }
          break;

        case "properties":
          result = await this.prisma.$queryRaw`
            SELECT MIN(${this.prisma.$queryRawUnsafe(
              columnName
            )}) as minValue, MAX(${this.prisma.$queryRawUnsafe(
            columnName
          )}) as maxValue
            FROM properties 
            WHERE ${this.prisma.$queryRawUnsafe(columnName)} IS NOT NULL
          `;
          break;

        case "companies":
        case "destinations":
          // Handle hiringVacancies column
          if (columnName === "hiringVacancies") {
            result = await this.prisma.$queryRaw`
              SELECT MIN(hiring_vacancies) as minValue, 
                     MAX(hiring_vacancies) as maxValue
              FROM companies 
              WHERE hiring_vacancies IS NOT NULL
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT MIN(${this.prisma.$queryRawUnsafe(
                columnName
              )}) as minValue, MAX(${this.prisma.$queryRawUnsafe(
              columnName
            )}) as maxValue
              FROM companies 
              WHERE ${this.prisma.$queryRawUnsafe(columnName)} IS NOT NULL
            `;
          }
          break;

        case "complaint_details":
          // Handle special case for daysPassed calculation
          if (columnName === "daysPassed") {
            result = await this.prisma.$queryRaw`
              SELECT MIN(DATEDIFF(NOW(), date_of_occurrence)) as minValue, 
                     MAX(DATEDIFF(NOW(), date_of_occurrence)) as maxValue
              FROM complaint_details 
              WHERE date_of_occurrence IS NOT NULL
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT MIN(${this.prisma.$queryRawUnsafe(
                columnName
              )}) as minValue, MAX(${this.prisma.$queryRawUnsafe(
              columnName
            )}) as maxValue
              FROM complaint_details 
              WHERE ${this.prisma.$queryRawUnsafe(columnName)} IS NOT NULL
            `;
          }
          break;

        case "interaction_records":
          // Handle special case for daysPassed calculation
          if (columnName === "daysPassed") {
            result = await this.prisma.$queryRaw`
              SELECT MIN(DATEDIFF(NOW(), date)) as minValue, 
                     MAX(DATEDIFF(NOW(), date)) as maxValue
              FROM interaction_records 
              WHERE date IS NOT NULL
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT MIN(${this.prisma.$queryRawUnsafe(
                columnName
              )}) as minValue, MAX(${this.prisma.$queryRawUnsafe(
              columnName
            )}) as maxValue
              FROM interaction_records 
              WHERE ${this.prisma.$queryRawUnsafe(columnName)} IS NOT NULL
            `;
          }
          break;

        default:
          throw new Error(`Unsupported table: ${tableName}`);
      }

      const row = (
        result as { minValue: number | null; maxValue: number | null }[]
      )[0];

      if (!row || row.minValue === null || row.maxValue === null) {
        // Provide fallback ranges for age column when no data exists
        if (columnName === "age") {
          return {
            min: 18,
            max: 65,
            ranges: [
              { label: "18 to 30", min: 18, max: 30 },
              { label: "31 to 45", min: 31, max: 45 },
              { label: "46 to 60", min: 46, max: 60 },
              { label: "61 to 65", min: 61, max: 65 },
            ],
          };
        }
        return {
          min: 0,
          max: 0,
          ranges: [{ label: "0 to 0", min: 0, max: 0 }],
        };
      }

      const min = Number(row.minValue);
      const max = Number(row.maxValue);

      // Handle edge case where min equals max
      if (min === max) {
        return {
          min,
          max,
          ranges: [{ label: `${min} to ${max}`, min, max }],
        };
      }

      // Calculate 4 equal ranges
      const difference = max - min;
      const rangeSize = Math.ceil(difference / 4);
      const ranges: NumericRange[] = [];

      for (let i = 0; i < 4; i++) {
        const rangeMin = min + i * rangeSize;
        let rangeMax = min + (i + 1) * rangeSize - 1;

        // Ensure the last range includes the maximum value
        if (i === 3) {
          rangeMax = max;
        }

        ranges.push({
          label: `${rangeMin} to ${rangeMax}`,
          min: rangeMin,
          max: rangeMax,
        });
      }

      return {
        min,
        max,
        ranges,
      };
    } catch (error) {
      console.error(
        `Error analyzing numeric column ${tableName}.${columnName}:`,
        error
      );

      // Provide fallback ranges for age column when query fails
      if (columnName === "age" && tableName.toLowerCase() === "staff") {
        return {
          min: 18,
          max: 65,
          ranges: [
            { label: "18 to 30", min: 18, max: 30 },
            { label: "31 to 45", min: 31, max: 45 },
            { label: "46 to 60", min: 46, max: 60 },
            { label: "61 to 65", min: 61, max: 65 },
          ],
        };
      }

      throw new Error(`Failed to analyze numeric column: ${columnName}`);
    }
  }

  /**
   * Check if a column has multiple values using GROUP BY and HAVING COUNT(*) > 1
   */
  private async checkColumnHasMultipleValues(
    tableName: string,
    columnKey: string
  ): Promise<boolean> {
    try {
      let result;

      switch (tableName.toLowerCase()) {
        case "staff":
          // Handle specific staff columns with proper column names
          if (columnKey === "residenceStatus") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT residence_status) as distinctCount
              FROM staff 
              WHERE residence_status IS NOT NULL AND residence_status != ''
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as distinctCount
              FROM staff 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "properties":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as distinctCount
            FROM properties 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        case "companies":
        case "destinations":
          // Handle specific company columns with proper column names
          if (columnKey === "preferredNationality") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT preferred_nationality) as distinctCount
              FROM companies 
              WHERE preferred_nationality IS NOT NULL AND preferred_nationality != ''
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as distinctCount
              FROM companies 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "complaint_details":
          // Handle specific complaint columns with proper column names
          if (columnKey === "progressStatus") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT progress_status) as distinctCount
              FROM complaint_details 
              WHERE progress_status IS NOT NULL AND progress_status != ''
            `;
          } else if (columnKey === "urgencyLevel") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT urgency_level) as distinctCount
              FROM complaint_details 
              WHERE urgency_level IS NOT NULL AND urgency_level != ''
            `;
          } else if (columnKey === "responder") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT responder_id) as distinctCount
              FROM complaint_details 
              WHERE responder_id IS NOT NULL
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as distinctCount
              FROM complaint_details 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "daily_record":
          // Handle specific daily record columns with proper column names
          if (columnKey === "conditionStatus") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT condition_status) as distinctCount
              FROM daily_record 
              WHERE condition_status IS NOT NULL AND condition_status != ''
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as distinctCount
              FROM daily_record 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "inquiries":
          // Handle specific inquiry columns with proper column names
          if (columnKey === "typeOfInquiry") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT type_of_inquiry) as distinctCount
              FROM inquiries 
              WHERE type_of_inquiry IS NOT NULL AND type_of_inquiry != ''
            `;
          } else if (columnKey === "progressStatus") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT progress_status) as distinctCount
              FROM inquiries 
              WHERE progress_status IS NOT NULL AND progress_status != ''
            `;
          } else if (columnKey === "responder") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT responder_id) as distinctCount
              FROM inquiries 
              WHERE responder_id IS NOT NULL
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as distinctCount
              FROM inquiries 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "interaction_records":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as distinctCount
            FROM interaction_records 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        default:
          return false;
      }

      const distinctCount = Number(
        (result as { distinctCount: bigint }[])[0]?.distinctCount || 0
      );
      return distinctCount > 1;
    } catch (error) {
      console.error(
        `Error checking multiple values for ${tableName}.${columnKey}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get the count of distinct options for a column
   */
  private async getColumnOptionCount(
    tableName: string,
    columnKey: string
  ): Promise<number> {
    try {
      let result;

      switch (tableName.toLowerCase()) {
        case "staff":
          // Handle specific staff columns with proper column names
          if (columnKey === "residenceStatus") {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT residence_status) as optionCount
              FROM staff 
              WHERE residence_status IS NOT NULL AND residence_status != ''
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
                columnKey
              )}) as optionCount
              FROM staff 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            `;
          }
          break;

        case "properties":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as optionCount
            FROM properties 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        case "complaint_details":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as optionCount
            FROM complaint_details 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        case "daily_record":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as optionCount
            FROM daily_record 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        case "inquiries":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as optionCount
            FROM inquiries 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        case "interaction_records":
          result = await this.prisma.$queryRaw`
            SELECT COUNT(DISTINCT ${this.prisma.$queryRawUnsafe(
              columnKey
            )}) as optionCount
            FROM interaction_records 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
          `;
          break;

        default:
          return 0;
      }

      return Number((result as { optionCount: bigint }[])[0]?.optionCount || 0);
    } catch (error) {
      console.error(
        `Error getting option count for ${tableName}.${columnKey}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Fetch filter options for a specific column using GROUP BY and HAVING COUNT(*) > 1
   */
  private async fetchFilterOptions(
    tableName: string,
    columnKey: string
  ): Promise<FilterOption[]> {
    try {
      let result;

      switch (tableName.toLowerCase()) {
        case "staff":
          // Handle specific staff columns with proper data
          if (columnKey === "residenceStatus") {
            result = await this.prisma.$queryRaw`
              SELECT residence_status as value, COUNT(*) as count
              FROM staff 
              WHERE residence_status IS NOT NULL AND residence_status != ''
              GROUP BY residence_status
              ORDER BY count DESC, residence_status ASC
            `;
          } else if (columnKey === "nationality") {
            result = await this.prisma.$queryRaw`
              SELECT nationality as value, COUNT(*) as count
              FROM staff 
              WHERE nationality IS NOT NULL AND nationality != ''
              GROUP BY nationality
              ORDER BY count DESC, nationality ASC
            `;
          } else if (columnKey === "status") {
            result = await this.prisma.$queryRaw`
              SELECT status as value, COUNT(*) as count
              FROM staff 
              GROUP BY status
              ORDER BY count DESC, status ASC
            `;
          } else if (columnKey === "department") {
            result = await this.prisma.$queryRaw`
              SELECT department as value, COUNT(*) as count
              FROM staff 
              WHERE department IS NOT NULL AND department != ''
              GROUP BY department
              ORDER BY count DESC, department ASC
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT ${this.prisma.$queryRawUnsafe(
                columnKey
              )} as value, COUNT(*) as count
              FROM staff 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
              GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
              ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
            `;
          }
          break;

        case "properties":
          result = await this.prisma.$queryRaw`
            SELECT ${this.prisma.$queryRawUnsafe(
              columnKey
            )} as value, COUNT(*) as count
            FROM properties 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
            HAVING COUNT(*) > 1
            ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
          `;
          break;

        case "companies":
        case "destinations":
          // Handle specific company columns with proper column names
          if (columnKey === "preferredNationality") {
            result = await this.prisma.$queryRaw`
              SELECT preferred_nationality as value, COUNT(*) as count
              FROM companies 
              WHERE preferred_nationality IS NOT NULL AND preferred_nationality != ''
              GROUP BY preferred_nationality
              ORDER BY count DESC, preferred_nationality ASC
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT ${this.prisma.$queryRawUnsafe(
                columnKey
              )} as value, COUNT(*) as count
              FROM companies 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
              GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
              HAVING COUNT(*) > 1
              ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
            `;
          }
          break;

        case "complaint_details":
          // Handle specific complaint columns with proper column names and joins
          if (columnKey === "progressStatus") {
            result = await this.prisma.$queryRaw`
              SELECT progress_status as value, COUNT(*) as count
              FROM complaint_details 
              WHERE progress_status IS NOT NULL AND progress_status != ''
              GROUP BY progress_status
              ORDER BY count DESC, progress_status ASC
            `;
          } else if (columnKey === "urgencyLevel") {
            result = await this.prisma.$queryRaw`
              SELECT urgency_level as value, COUNT(*) as count
              FROM complaint_details 
              WHERE urgency_level IS NOT NULL AND urgency_level != ''
              GROUP BY urgency_level
              ORDER BY count DESC, urgency_level ASC
            `;
          } else if (columnKey === "responder") {
            result = await this.prisma.$queryRaw`
              SELECT u.name as value, COUNT(*) as count
              FROM complaint_details cd
              JOIN users u ON cd.responder_id = u.id
              WHERE cd.responder_id IS NOT NULL
              GROUP BY u.name
              ORDER BY count DESC, u.name ASC
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT ${this.prisma.$queryRawUnsafe(
                columnKey
              )} as value, COUNT(*) as count
              FROM complaint_details 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
              GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
              HAVING COUNT(*) > 1
              ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
            `;
          }
          break;

        case "daily_record":
          // Handle specific daily record columns with proper column names
          if (columnKey === "conditionStatus") {
            result = await this.prisma.$queryRaw`
              SELECT condition_status as value, COUNT(*) as count
              FROM daily_record 
              WHERE condition_status IS NOT NULL AND condition_status != ''
              GROUP BY condition_status
              ORDER BY count DESC, condition_status ASC
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT ${this.prisma.$queryRawUnsafe(
                columnKey
              )} as value, COUNT(*) as count
              FROM daily_record 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
              GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
              HAVING COUNT(*) > 1
              ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
            `;
          }
          break;

        case "inquiries":
          // Handle specific inquiry columns with proper column names and joins
          if (columnKey === "typeOfInquiry") {
            result = await this.prisma.$queryRaw`
              SELECT type_of_inquiry as value, COUNT(*) as count
              FROM inquiries 
              WHERE type_of_inquiry IS NOT NULL AND type_of_inquiry != ''
              GROUP BY type_of_inquiry
              ORDER BY count DESC, type_of_inquiry ASC
            `;
          } else if (columnKey === "progressStatus") {
            result = await this.prisma.$queryRaw`
              SELECT progress_status as value, COUNT(*) as count
              FROM inquiries 
              WHERE progress_status IS NOT NULL AND progress_status != ''
              GROUP BY progress_status
              ORDER BY count DESC, progress_status ASC
            `;
          } else if (columnKey === "responder") {
            result = await this.prisma.$queryRaw`
              SELECT u.name as value, COUNT(*) as count
              FROM inquiries i
              JOIN users u ON i.responder_id = u.id
              WHERE i.responder_id IS NOT NULL
              GROUP BY u.name
              ORDER BY count DESC, u.name ASC
            `;
          } else {
            result = await this.prisma.$queryRaw`
              SELECT ${this.prisma.$queryRawUnsafe(
                columnKey
              )} as value, COUNT(*) as count
              FROM inquiries 
              WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
              GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
              HAVING COUNT(*) > 1
              ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
            `;
          }
          break;

        case "interaction_records":
          result = await this.prisma.$queryRaw`
            SELECT ${this.prisma.$queryRawUnsafe(
              columnKey
            )} as value, COUNT(*) as count
            FROM interaction_records 
            WHERE ${this.prisma.$queryRawUnsafe(columnKey)} IS NOT NULL
            GROUP BY ${this.prisma.$queryRawUnsafe(columnKey)}
            HAVING COUNT(*) > 1
            ORDER BY count DESC, ${this.prisma.$queryRawUnsafe(columnKey)} ASC
          `;
          break;

        default:
          return [];
      }

      return (result as { value: string; count: bigint }[]).map((row) => ({
        value: String(row.value),
        label: String(row.value),
        count: Number(row.count),
      }));
    } catch (error) {
      console.error(
        `Error fetching filter options for ${tableName}.${columnKey}:`,
        error
      );
      return [];
    }
  }
}

export default new FilterAnalyzer();
