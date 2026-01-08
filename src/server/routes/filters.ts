import { Router, Request, Response } from "express";
import { z } from "zod";
import filterAnalyzer from "../services/FilterAnalyzer";
import { FilterableColumn, FilterOption } from "../../shared/types/filtering";

const router = Router();

// Schema for column analysis request
const AnalyzeColumnsSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      dataType: z.enum(["string", "number", "date", "enum"]),
    })
  ),
});

/**
 * POST /api/filters/:tableName/analyze
 * Analyze columns for a table to determine which ones are filterable
 */
router.post("/:tableName/analyze", async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    // Validate request body
    const parseResult = AnalyzeColumnsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.issues,
      });
    }

    const { columns } = parseResult.data;

    // Analyze columns using FilterAnalyzer service
    const filterableColumns: FilterableColumn[] =
      await filterAnalyzer.analyzeColumns(tableName, columns);

    res.json(filterableColumns);
  } catch (error) {
    console.error(
      `Error analyzing columns for table ${req.params.tableName}:`,
      error
    );
    res.status(500).json({
      error: "Failed to analyze columns",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/filters/:tableName/:columnKey/options
 * Get filter options for a specific column
 */
router.get(
  "/:tableName/:columnKey/options",
  async (req: Request, res: Response) => {
    try {
      const { tableName, columnKey } = req.params;

      // Validate table and column names
      const validTables = [
        "staff",
        "properties",
        "companies",
        "destinations",
        "complaint_details",
        "daily_record",
        "inquiries",
        "interaction_records",
      ];

      if (!validTables.includes(tableName.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid table name",
          message: `Table '${tableName}' is not supported`,
        });
      }

      // Get filter options using FilterAnalyzer service
      const options: FilterOption[] = await filterAnalyzer.getFilterOptions(
        tableName,
        columnKey
      );

      res.json(options);
    } catch (error) {
      console.error(
        `Error getting filter options for ${req.params.tableName}.${req.params.columnKey}:`,
        error
      );
      res.status(500).json({
        error: "Failed to get filter options",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/filters/:tableName/:columnName/ranges
 * Get numeric range analysis for a specific column
 */
router.get(
  "/:tableName/:columnName/ranges",
  async (req: Request, res: Response) => {
    try {
      const { tableName, columnName } = req.params;

      // Validate table and column names
      const validTables = [
        "staff",
        "properties",
        "companies",
        "destinations",
        "complaint_details",
        "interaction_records",
      ];

      if (!validTables.includes(tableName.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid table name",
          message: `Table '${tableName}' is not supported for numeric range analysis`,
        });
      }

      // Validate numeric columns based on table
      const validNumericColumns: Record<string, string[]> = {
        staff: ["age"],
        properties: ["occupantCount"],
        companies: ["hiringVacancies"],
        destinations: ["hiringVacancies"],
        complaint_details: ["daysPassed"],
        interaction_records: ["daysPassed"],
      };

      const tableColumns = validNumericColumns[tableName.toLowerCase()];
      if (!tableColumns || !tableColumns.includes(columnName)) {
        return res.status(400).json({
          error: "Invalid column name",
          message: `Column '${columnName}' is not a valid numeric column for table '${tableName}'`,
        });
      }

      // Get numeric range analysis using FilterAnalyzer service
      const analysis = await filterAnalyzer.analyzeNumericColumn(
        tableName,
        columnName
      );

      res.json(analysis);
    } catch (error) {
      console.error(
        `Error getting numeric ranges for ${req.params.tableName}.${req.params.columnName}:`,
        error
      );
      res.status(500).json({
        error: "Failed to get numeric ranges",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * DELETE /api/filters/:tableName/cache
 * Clear cache for a specific table
 */
router.delete("/:tableName/cache", async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    filterAnalyzer.clearCache(tableName);

    res.json({
      message: `Cache cleared for table: ${tableName}`,
    });
  } catch (error) {
    console.error(
      `Error clearing cache for table ${req.params.tableName}:`,
      error
    );
    res.status(500).json({
      error: "Failed to clear cache",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /api/filters/cache
 * Clear all filter cache
 */
router.delete("/cache", async (req: Request, res: Response) => {
  try {
    filterAnalyzer.clearCache();

    res.json({
      message: "All filter cache cleared",
    });
  } catch (error) {
    console.error("Error clearing all filter cache:", error);
    res.status(500).json({
      error: "Failed to clear cache",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/filters/:tableName/invalidate
 * Invalidate cache for a table (useful after data mutations)
 */
router.post("/:tableName/invalidate", async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    filterAnalyzer.invalidateTableCache(tableName);

    res.json({
      message: `Cache invalidated for table: ${tableName}`,
    });
  } catch (error) {
    console.error(
      `Error invalidating cache for table ${req.params.tableName}:`,
      error
    );
    res.status(500).json({
      error: "Failed to invalidate cache",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/filters/cache/stats
 * Get cache statistics for monitoring
 */
router.get("/cache/stats", async (req: Request, res: Response) => {
  try {
    const stats = filterAnalyzer.getCacheStats();

    res.json(stats);
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({
      error: "Failed to get cache stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/filters/cache/cleanup
 * Clean up expired cache entries
 */
router.post("/cache/cleanup", async (req: Request, res: Response) => {
  try {
    const removedCount = filterAnalyzer.cleanupExpiredCache();

    res.json({
      message: `Cleaned up ${removedCount} expired cache entries`,
      removedCount,
    });
  } catch (error) {
    console.error("Error cleaning up expired cache:", error);
    res.status(500).json({
      error: "Failed to cleanup cache",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
