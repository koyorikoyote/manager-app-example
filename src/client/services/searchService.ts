import {
  Staff,
  Property,
  Company,
  InteractionRecord,
  AttendanceRecord,
  Document,
  DailyRecordWithRelations,
  InquiryWithRelations,
} from "../../shared/types";
import { staffService } from "./staffService";
import { propertyService } from "./propertyService";
import { companyService } from "./companyService";
import { interactionService } from "./interactionService";
import { attendanceService } from "./attendanceService";
import { documentService } from "./documentService";
import { dailyRecordService } from "./dailyRecordService";
import { inquiryService } from "./inquiryService";

// Enhanced SearchResult interface to support all data table types
export interface SearchResult {
  id: string;
  type:
    | "staff"
    | "destinations"
    | "interactions"
    | "residences"
    | "attendance"
    | "manual"
    | "dailyRecord"
    | "inquiriesNotifications";
  title: string;
  subtitle?: string;
  description?: string;
  metadata: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
  // Legacy field for backward compatibility
  nationality?: string;
}

export interface SearchResultsResponse {
  results: SearchResult[];
  total: number;
  counts: Record<string, number>;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  partialFailure?: boolean;
  failedSources?: string[];
}

// Search field mappings for each data table type
const SEARCH_FIELD_MAPPING = {
  staff: [
    "name",
    "position",
    "department",
    "email",
    "phone",
    "address",
    "residenceStatus",
  ],
  destinations: [
    "name",
    "industry",
    "address",
    "phone",
    "email",
    "website",
    "description",
  ],
  interactions: ["description", "createdBy", "type", "status"],
  residences: ["name", "address", "propertyType", "status"],
  attendance: ["staffName", "status", "notes"],
  manual: ["name", "uploadedBy", "type"],
  dailyRecord: [
    "staff.name",
    "conditionStatus",
    "feedbackContent",
    "contactNumber",
  ],
  inquiriesNotifications: [
    "inquirerName",
    "inquirerContact",
    "company.name",
    "typeOfInquiry",
    "inquiryContent",
    "progressStatus",
    "responder.name",
  ],
};

// Error types for better error handling
export interface SearchError {
  type: "network" | "timeout" | "server" | "validation" | "unknown";
  message: string;
  retryable: boolean;
  details?: unknown;
}

class SearchService {
  private retryAttempts: Map<string, number> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // Base delay in ms

  // Enhanced error handling utility
  private createSearchError(
    error: unknown,
    type: SearchError["type"] = "unknown"
  ): SearchError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network errors
      if (
        message.includes("fetch") ||
        message.includes("network") ||
        message.includes("connection")
      ) {
        return {
          type: "network",
          message:
            "Network connection failed. Please check your internet connection. ネットワーク接続に失敗しました。インターネット接続を確認してください。",
          retryable: true,
          details: error,
        };
      }

      // Timeout errors
      if (message.includes("timeout") || message.includes("aborted")) {
        return {
          type: "timeout",
          message:
            "Request timed out. Please try again. リクエストがタイムアウトしました。もう一度お試しください。",
          retryable: true,
          details: error,
        };
      }

      // Server errors (5xx)
      if (
        message.includes("500") ||
        message.includes("server") ||
        message.includes("internal")
      ) {
        return {
          type: "server",
          message:
            "Server error occurred. Please try again in a moment. サーバーエラーが発生しました。しばらくしてからもう一度お試しください。",
          retryable: true,
          details: error,
        };
      }

      // Validation errors (4xx)
      if (
        message.includes("400") ||
        message.includes("validation") ||
        message.includes("bad request")
      ) {
        return {
          type: "validation",
          message:
            "Invalid search parameters. Please check your input. 検索パラメータが無効です。入力内容をご確認ください。",
          retryable: false,
          details: error,
        };
      }

      return {
        type,
        message: error.message,
        retryable: type !== "validation",
        details: error,
      };
    }

    return {
      type: "unknown",
      message:
        "An unexpected error occurred. Please try again. 予期しないエラーが発生しました。もう一度お試しください。",
      retryable: true,
      details: error,
    };
  }

  // Retry mechanism with exponential backoff
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationKey: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const currentAttempt = this.retryAttempts.get(operationKey) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationKey);
      return result;
    } catch (error) {
      const searchError = this.createSearchError(error);

      // Don't retry if error is not retryable or max attempts reached
      if (!searchError.retryable || currentAttempt >= maxRetries) {
        this.retryAttempts.delete(operationKey);
        throw searchError;
      }

      // Increment retry count
      this.retryAttempts.set(operationKey, currentAttempt + 1);

      // Calculate exponential backoff delay
      const delay = this.retryDelay * Math.pow(2, currentAttempt);

      console.warn(
        `Search operation failed (attempt ${currentAttempt + 1}/${
          maxRetries + 1
        }), retrying in ${delay}ms:`,
        searchError.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the operation
      return this.retryOperation(operation, operationKey, maxRetries);
    }
  }

  // Main search method that aggregates results from multiple sources
  async searchAll(
    query: string,
    filters: string[] = [],
    page: number = 1,
    pageSize: number = 10
  ): Promise<SearchResultsResponse> {
    const searchPromises: Promise<SearchResult[]>[] = [];
    const sourceNames: string[] = [];
    const counts: Record<string, number> = {};

    // Determine which data sources to search based on filters
    const shouldSearchAll = filters.length === 0;
    const searchStaff = shouldSearchAll || filters.includes("staff");
    const searchDestinations =
      shouldSearchAll || filters.includes("destinations");
    const searchInteractions =
      shouldSearchAll || filters.includes("interactions");
    const searchResidences = shouldSearchAll || filters.includes("residences");
    const searchAttendance = shouldSearchAll || filters.includes("attendance");
    const searchManual = shouldSearchAll || filters.includes("manual");
    const searchDailyRecord =
      shouldSearchAll || filters.includes("dailyRecord");
    const searchInquiriesNotifications =
      shouldSearchAll || filters.includes("inquiriesNotifications");

    // Execute searches in parallel and track source names
    if (searchStaff) {
      searchPromises.push(this.searchStaff(query));
      sourceNames.push("staff");
    }
    if (searchDestinations) {
      searchPromises.push(this.searchDestinations(query));
      sourceNames.push("destinations");
    }
    if (searchInteractions) {
      searchPromises.push(this.searchInteractions(query));
      sourceNames.push("interactions");
    }
    if (searchResidences) {
      searchPromises.push(this.searchResidences(query));
      sourceNames.push("residences");
    }
    if (searchAttendance) {
      searchPromises.push(this.searchAttendance(query));
      sourceNames.push("attendance");
    }
    if (searchManual) {
      searchPromises.push(this.searchManuals(query));
      sourceNames.push("manual");
    }
    if (searchDailyRecord) {
      searchPromises.push(this.searchDailyRecords(query));
      sourceNames.push("dailyRecord");
    }
    if (searchInquiriesNotifications) {
      searchPromises.push(this.searchInquiriesNotifications(query));
      sourceNames.push("inquiriesNotifications");
    }

    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled(searchPromises);
      const allResults: SearchResult[] = [];
      const failedSources: string[] = [];

      // Process results and track failures
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          allResults.push(...result.value);
        } else {
          // Track which data source failed using the correct source name
          const failedSource = sourceNames[index];
          if (failedSource) {
            failedSources.push(failedSource);
          }
          console.warn(`Search failed for ${failedSource}:`, result.reason);
        }
      });

      // Calculate counts by type
      allResults.forEach((result) => {
        counts[result.type] = (counts[result.type] || 0) + 1;
      });

      // Sort results by relevance (title matches first, then subtitle, then description)
      const sortedResults = this.sortResultsByRelevance(allResults, query);

      // Apply pagination
      const totalResults = sortedResults.length;
      const totalPages = Math.ceil(totalResults / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = sortedResults.slice(startIndex, endIndex);

      // If some sources failed but we have results, include a warning
      if (failedSources.length > 0 && allResults.length > 0) {
        console.warn(
          `Partial search failure. Failed sources: ${failedSources.join(", ")}`
        );
      }

      // If all sources failed, throw an error
      if (
        failedSources.length === searchPromises.length &&
        searchPromises.length > 0
      ) {
        throw this.createSearchError(
          new Error(
            `Server error: All search sources failed: ${failedSources.join(
              ", "
            )}`
          )
        );
      }

      return {
        results: paginatedResults,
        total: totalResults,
        counts,
        page,
        pageSize,
        totalPages,
        partialFailure: failedSources.length > 0,
        failedSources,
      };
    } catch (error) {
      console.error("Search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search staff data with enhanced error handling
  async searchStaff(query: string): Promise<SearchResult[]> {
    try {
      const { staff } = await staffService.searchStaff({
        search: query,
        limit: 50,
      });
      return this.convertStaffToSearchResults(staff);
    } catch (error) {
      console.error("Staff search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search destinations (companies) with enhanced error handling
  async searchDestinations(query: string): Promise<SearchResult[]> {
    try {
      const { companies } = await companyService.getCompanies({
        search: query,
        limit: 50,
      });
      return this.convertCompaniesToSearchResults(companies);
    } catch (error) {
      console.error("Destinations search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search interactions with enhanced error handling
  async searchInteractions(query: string): Promise<SearchResult[]> {
    try {
      // InteractionService doesn't have a search method, so we get all and filter
      const { data: interactions } = await interactionService.getInteractions();
      const filtered = this.filterByQuery(
        interactions as unknown as Record<string, unknown>[],
        query,
        SEARCH_FIELD_MAPPING.interactions
      ) as unknown as InteractionRecord[];
      return this.convertInteractionsToSearchResults(filtered);
    } catch (error) {
      console.error("Interactions search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search residences (properties) with enhanced error handling
  async searchResidences(query: string): Promise<SearchResult[]> {
    try {
      const response = await propertyService.getAll({
        search: query,
        limit: 50,
      });
      return this.convertPropertiesToSearchResults(response.data);
    } catch (error) {
      console.error("Residences search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search attendance records with enhanced error handling
  async searchAttendance(query: string): Promise<SearchResult[]> {
    try {
      const attendanceRecords =
        await attendanceService.getAllAttendanceRecords();
      const filtered = this.filterByQuery(
        attendanceRecords as unknown as Record<string, unknown>[],
        query,
        SEARCH_FIELD_MAPPING.attendance
      ) as unknown as AttendanceRecord[];
      return this.convertAttendanceToSearchResults(filtered);
    } catch (error) {
      console.error("Attendance search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search manual documents with enhanced error handling
  async searchManuals(query: string): Promise<SearchResult[]> {
    try {
      const { documents } = await documentService.getDocuments({
        search: query,
        limit: 50,
      });
      return this.convertDocumentsToSearchResults(documents);
    } catch (error) {
      console.error("Manual documents search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search daily records with enhanced error handling
  async searchDailyRecords(query: string): Promise<SearchResult[]> {
    try {
      // Get all daily records and filter client-side
      const { data: dailyRecords } = await dailyRecordService.getAll({
        limit: 50,
      });
      const filtered = this.filterDailyRecords(dailyRecords, query);
      return this.convertDailyRecordsToSearchResults(filtered);
    } catch (error) {
      console.error("Daily records search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Search inquiries & notifications with enhanced error handling
  async searchInquiriesNotifications(query: string): Promise<SearchResult[]> {
    try {
      // Get all inquiries and filter client-side
      const { data: inquiries } = await inquiryService.getAll({
        limit: 50,
      });
      const filtered = this.filterInquiries(inquiries, query);
      return this.convertInquiriesToSearchResults(filtered);
    } catch (error) {
      console.error("Inquiries & notifications search failed:", error);
      throw this.createSearchError(error);
    }
  }

  // Generic filter function for data that doesn't have built-in search
  private filterByQuery<T extends Record<string, unknown>>(
    items: T[],
    query: string,
    searchFields: (keyof T)[]
  ): T[] {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }

  // Custom filter for daily records with nested properties
  private filterDailyRecords(
    records: DailyRecordWithRelations[],
    query: string
  ): DailyRecordWithRelations[] {
    if (!query.trim()) return records;

    const lowerQuery = query.toLowerCase();
    return records.filter((record) => {
      return (
        record.staff?.name?.toLowerCase().includes(lowerQuery) ||
        record.conditionStatus?.toLowerCase().includes(lowerQuery) ||
        record.feedbackContent?.toLowerCase().includes(lowerQuery) ||
        record.contactNumber?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  // Custom filter for inquiries with nested properties
  private filterInquiries(
    inquiries: InquiryWithRelations[],
    query: string
  ): InquiryWithRelations[] {
    if (!query.trim()) return inquiries;

    const lowerQuery = query.toLowerCase();
    return inquiries.filter((inquiry) => {
      return (
        inquiry.inquirerName?.toLowerCase().includes(lowerQuery) ||
        inquiry.inquirerContact?.toLowerCase().includes(lowerQuery) ||
        inquiry.company?.name?.toLowerCase().includes(lowerQuery) ||
        inquiry.typeOfInquiry?.toLowerCase().includes(lowerQuery) ||
        inquiry.inquiryContent?.toLowerCase().includes(lowerQuery) ||
        inquiry.progressStatus?.toLowerCase().includes(lowerQuery) ||
        inquiry.responder?.name?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  // Sort results by relevance to search query
  private sortResultsByRelevance(
    results: SearchResult[],
    query: string
  ): SearchResult[] {
    if (!query.trim()) return results;

    const lowerQuery = query.toLowerCase();

    return results.sort((a, b) => {
      // Calculate relevance scores
      const scoreA = this.calculateRelevanceScore(a, lowerQuery);
      const scoreB = this.calculateRelevanceScore(b, lowerQuery);

      // Sort by score (higher is better), then by title alphabetically
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return a.title.localeCompare(b.title);
    });
  }

  // Calculate relevance score for a search result
  private calculateRelevanceScore(result: SearchResult, query: string): number {
    let score = 0;

    // Title matches get highest score (exact match gets bonus)
    if (result.title.toLowerCase().includes(query)) {
      score += 10;
      if (result.title.toLowerCase() === query) {
        score += 5;
      }
      // Title starts with query gets bonus
      if (result.title.toLowerCase().startsWith(query)) {
        score += 3;
      }
    }

    // Subtitle matches get high score
    if (result.subtitle?.toLowerCase().includes(query)) {
      score += 7;
      if (result.subtitle.toLowerCase() === query) {
        score += 2;
      }
    }

    // Description matches get medium score
    if (result.description?.toLowerCase().includes(query)) {
      score += 4;
      if (result.description.toLowerCase().startsWith(query)) {
        score += 1;
      }
    }

    // Metadata matches get varying scores based on field importance
    Object.entries(result.metadata || {}).forEach(([key, value]) => {
      if (value.toLowerCase().includes(query)) {
        // Important fields get higher scores
        const importantFields = [
          "name",
          "email",
          "phone",
          "address",
          "industry",
          "type",
        ];
        const isImportant = importantFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase())
        );
        score += isImportant ? 3 : 1;

        // Exact metadata match gets bonus
        if (value.toLowerCase() === query) {
          score += 1;
        }
      }
    });

    return score;
  }

  // Result transformation utilities
  private convertStaffToSearchResults(staffList: Staff[]): SearchResult[] {
    return staffList.map((staff) => ({
      id: staff.id.toString(),
      type: "staff" as const,
      title: staff.name,
      subtitle: staff.position || undefined,
      description: `${staff.position || "N/A"} in ${staff.department || "N/A"}`,
      metadata: {
        Department: staff.department || "N/A",
        Position: staff.position || "N/A",
        Phone: staff.phone || "N/A",
        Email: staff.email || "N/A",
        Status: staff.status,
        "Residence Status": staff.residenceStatus || "N/A",
      },
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    }));
  }

  private convertCompaniesToSearchResults(
    companies: Company[]
  ): SearchResult[] {
    return companies.map((company) => ({
      id: company.id.toString(),
      type: "destinations" as const,
      title: company.name,
      subtitle: company.industry || "Company",
      description:
        company.description ||
        `${company.industry || "Company"} located at ${company.address}`,
      metadata: {
        Industry: company.industry || "N/A",
        Address: company.address,
        Phone: company.phone || "N/A",
        Email: company.email || "N/A",
        Status: company.status,
      },
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));
  }

  private convertInteractionsToSearchResults(
    interactions: InteractionRecord[]
  ): SearchResult[] {
    return interactions.map((interaction) => ({
      id: interaction.id.toString(),
      type: "interactions" as const,
      title: `${
        interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)
      } Record`,
      subtitle: interaction.status || "Interaction",
      description: interaction.description,
      metadata: {
        Description: interaction.description,
        Type: interaction.type,
        Status: interaction.status || "N/A",
        "Person Involved": interaction.personInvolved?.name || "N/A",
        "Created By": interaction.creator?.name || "N/A",
        Date: interaction.date.toLocaleDateString(),
      },
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
    }));
  }

  private convertPropertiesToSearchResults(
    properties: Property[]
  ): SearchResult[] {
    return properties.map((property) => ({
      id: property.id.toString(),
      type: "residences" as const,
      title: property.name,
      subtitle: property.propertyType,
      description: `${property.status} property located at ${property.address}`,
      metadata: {
        Type: property.propertyType,
        Address: property.address,
        Status: property.status,
        Code: property.propertyCode || "N/A",
        Manager: property.manager?.name || "N/A",
      },
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }));
  }

  private convertAttendanceToSearchResults(
    attendanceRecords: AttendanceRecord[]
  ): SearchResult[] {
    return attendanceRecords.map((record) => ({
      id: record.id,
      type: "attendance" as const,
      title: `Attendance Record - ${record.date.toLocaleDateString()}`,
      subtitle: record.status,
      description:
        record.notes ||
        `${record.status} attendance record for staff ${record.staffId}`,
      metadata: {
        "Staff ID": record.staffId,
        "Staff Name": record.staffId, // This will be the searchable staff name field
        Status: record.status,
        Date: record.date.toLocaleDateString(),
        "Hours Worked": record.hoursWorked?.toString() || "N/A",
        "Check In": record.checkInTime?.toLocaleTimeString() || "N/A",
        "Check Out": record.checkOutTime?.toLocaleTimeString() || "N/A",
        Notes: record.notes || "N/A",
      },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  private convertDocumentsToSearchResults(
    documents: Document[]
  ): SearchResult[] {
    return documents.map((document) => ({
      id: document.id.toString(),
      type: "manual" as const,
      title: document.title,
      subtitle: document.type,
      description: `${document.type} document for ${document.relatedEntityId}`,
      metadata: {
        Name: document.title,
        Type: document.type,
        Status: document.status,
        "Uploaded By": "N/A", // This field may not exist in current Document type
        "Related Entity": document.relatedEntityId,
        "Start Date": document.startDate.toLocaleDateString(),
        "End Date": document.endDate?.toLocaleDateString() || "N/A",
      },
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }));
  }

  private convertDailyRecordsToSearchResults(
    dailyRecords: DailyRecordWithRelations[]
  ): SearchResult[] {
    return dailyRecords.map((record) => ({
      id: record.id.toString(),
      type: "dailyRecord" as const,
      title: `Daily Record - ${record.staff.name}`,
      subtitle: record.conditionStatus,
      description:
        record.feedbackContent ||
        `${record.conditionStatus} condition record for ${record.staff.name}`,
      metadata: {
        "Staff Name": record.staff.name,
        "Employee ID": record.staff.employeeId,
        "Condition Status": record.conditionStatus,
        "Feedback Content": record.feedbackContent,
        "Contact Number": record.contactNumber || "N/A",
        "Date of Record": new Date(record.dateOfRecord).toLocaleDateString(),
      },
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }));
  }

  private convertInquiriesToSearchResults(
    inquiries: InquiryWithRelations[]
  ): SearchResult[] {
    return inquiries.map((inquiry) => ({
      id: inquiry.id.toString(),
      type: "inquiriesNotifications" as const,
      title: `Inquiry from ${inquiry.inquirerName}`,
      subtitle: inquiry.typeOfInquiry,
      description: inquiry.inquiryContent,
      metadata: {
        "Inquirer Name": inquiry.inquirerName,
        "Contact Info": inquiry.inquirerContact,
        "Company Name": inquiry.company?.name || "N/A",
        "Type of Inquiry": inquiry.typeOfInquiry,
        "Inquiry Content": inquiry.inquiryContent,
        "Progress Status": inquiry.progressStatus,
        "Responder Name": inquiry.responder?.name || "N/A",
        "Recorder Name": inquiry.recorder.name,
        "Date of Inquiry": new Date(inquiry.dateOfInquiry).toLocaleDateString(),
        "Resolution Date": inquiry.resolutionDate
          ? new Date(inquiry.resolutionDate).toLocaleDateString()
          : "N/A",
      },
      createdAt: new Date(inquiry.createdAt),
      updatedAt: new Date(inquiry.updatedAt),
    }));
  }

  // Cleanup method to clear retry attempts
  cleanup(): void {
    this.retryAttempts.clear();
  }
}

// Create singleton instance
export const searchService = new SearchService();
