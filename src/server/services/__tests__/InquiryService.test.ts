import { InquiryService } from "../InquiryService";
import { InquiryStatus } from "@prisma/client";

// Mock the prisma client before importing
jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    inquiry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

// Import the mocked prisma after mocking
import prisma from "../../lib/prisma";

describe("InquiryService", () => {
  let inquiryService: InquiryService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    inquiryService = new InquiryService();
    jest.clearAllMocks();
  });

  const mockInquiryData = {
    id: 1,
    dateOfInquiry: new Date("2024-01-15"),
    inquirerName: "Alice Johnson",
    inquirerContact: "alice@example.com",
    companyId: 1,
    typeOfInquiry: "General Information",
    inquiryContent: "I need information about your services",
    progressStatus: InquiryStatus.OPEN,
    respondentId: 1,
    recorderId: 1,
    resolutionDate: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    company: { id: 1, name: "Test Company" },
    respondent: { id: 1, name: "Respondent User" },
    recorder: { id: 1, name: "Recorder Staff" },
  };

  describe("getInquiries", () => {
    it("should return all inquiries with relationships", async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      const result = await inquiryService.getInquiries();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        inquirerName: "Alice Johnson",
        company: { name: "Test Company" },
        respondent: { name: "Respondent User" },
        recorder: { name: "Recorder Staff" },
      });
    });

    it("should apply filters correctly", async () => {
      const filters = {
        status: InquiryStatus.OPEN,
        companyId: 1,
        search: "Alice",
      };

      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      await inquiryService.getInquiries(filters);

      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        where: {
          progressStatus: InquiryStatus.OPEN,
          companyId: 1,
          OR: [
            { inquirerName: { contains: "Alice" } },
            { inquirerContact: { contains: "Alice" } },
            { typeOfInquiry: { contains: "Alice" } },
            { inquiryContent: { contains: "Alice" } },
          ],
        },
        select: {
          id: true,
          dateOfInquiry: true,
          inquirerName: true,
          inquirerContact: true,
          typeOfInquiry: true,
          inquiryContent: true,
          progressStatus: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfInquiry: "desc" },
      });
    });

    it("should handle date range filters", async () => {
      const filters = {
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-01-31"),
      };

      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      await inquiryService.getInquiries(filters);

      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        where: {
          dateOfInquiry: {
            gte: new Date("2024-01-01"),
            lte: new Date("2024-01-31"),
          },
        },
        select: {
          id: true,
          dateOfInquiry: true,
          inquirerName: true,
          inquirerContact: true,
          typeOfInquiry: true,
          inquiryContent: true,
          progressStatus: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfInquiry: "desc" },
      });
    });

    it("should handle null company and respondent", async () => {
      const inquiryWithNullRelations = {
        ...mockInquiryData,
        companyId: null,
        respondentId: null,
        company: null,
        respondent: null,
      };

      mockPrisma.inquiry.findMany.mockResolvedValue([inquiryWithNullRelations]);

      const result = await inquiryService.getInquiries();

      expect(result[0].company).toBeNull();
      expect(result[0].respondent).toBeNull();
      expect(result[0].recorder).toEqual({ name: "Recorder Staff" });
    });
  });

  describe("getInquiryById", () => {
    it("should return inquiry by ID with relationships", async () => {
      const mockInquiryWithDetails = {
        ...mockInquiryData,
        company: {
          id: 1,
          name: "Test Company",
          address: "123 Test St",
          phone: "555-0123",
          email: "company@example.com",
        },
        respondent: {
          id: 1,
          name: "Respondent User",
          email: "respondent@example.com",
        },
        recorder: {
          id: 1,
          name: "Recorder Staff",
          employeeId: "EMP001",
          position: "Manager",
          department: "HR",
        },
      };

      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiryWithDetails);

      const result = await inquiryService.getInquiryById(1);

      expect(result).toMatchObject({
        id: 1,
        inquirerName: "Alice Johnson",
        company: { name: "Test Company" },
        respondent: { name: "Respondent User" },
        recorder: { name: "Recorder Staff" },
      });
    });

    it("should return null if inquiry not found", async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue(null);

      const result = await inquiryService.getInquiryById(999);

      expect(result).toBeNull();
    });
  });

  describe("createInquiry", () => {
    it("should create new inquiry", async () => {
      const createData = {
        dateOfInquiry: new Date("2024-01-15"),
        inquirerName: "Alice Johnson",
        inquirerContact: "alice@example.com",
        typeOfInquiry: "General Information",
        inquiryContent: "I need information about your services",
        recorderId: 1,
      };

      mockPrisma.inquiry.create.mockResolvedValue(mockInquiryData);

      const result = await inquiryService.createInquiry(createData);

      expect(result).toMatchObject({
        id: 1,
        inquirerName: "Alice Johnson",
        recorder: { name: "Recorder Staff" },
      });
      expect(mockPrisma.inquiry.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          progressStatus: InquiryStatus.OPEN,
          companyId: undefined,
          respondentId: undefined,
          resolutionDate: undefined,
        },
        include: {
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true } },
        },
      });
    });
  });

  describe("updateInquiry", () => {
    it("should update inquiry", async () => {
      const updateData = {
        inquirerName: "Updated Name",
        progressStatus: InquiryStatus.CLOSED,
        resolutionDate: new Date("2024-01-20"),
      };

      const updatedInquiry = {
        ...mockInquiryData,
        ...updateData,
      };

      mockPrisma.inquiry.update.mockResolvedValue(updatedInquiry);

      const result = await inquiryService.updateInquiry(1, updateData);

      expect(result.inquirerName).toBe("Updated Name");
      expect(result.progressStatus).toBe(InquiryStatus.CLOSED);
    });
  });

  describe("getInquiryStatistics", () => {
    it("should return inquiry statistics", async () => {
      mockPrisma.inquiry.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60) // open
        .mockResolvedValueOnce(30) // closed
        .mockResolvedValueOnce(10); // on hold

      mockPrisma.inquiry.groupBy.mockResolvedValue([
        { typeOfInquiry: "General Information", _count: { id: 40 } },
        { typeOfInquiry: "Technical Support", _count: { id: 35 } },
        { typeOfInquiry: "Billing", _count: { id: 25 } },
      ]);

      const result = await inquiryService.getInquiryStatistics();

      expect(result).toEqual({
        total: 100,
        open: 60,
        closed: 30,
        onHold: 10,
        byType: {
          "General Information": 40,
          "Technical Support": 35,
          Billing: 25,
        },
      });
    });
  });

  describe("getInquiriesByCompany", () => {
    it("should return inquiries filtered by company", async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      const result = await inquiryService.getInquiriesByCompany(1);

      expect(result).toHaveLength(1);
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        where: { companyId: 1 },
        select: {
          id: true,
          dateOfInquiry: true,
          inquirerName: true,
          inquirerContact: true,
          typeOfInquiry: true,
          inquiryContent: true,
          progressStatus: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfInquiry: "desc" },
      });
    });
  });

  describe("getInquiriesByRespondent", () => {
    it("should return inquiries filtered by respondent", async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      const result = await inquiryService.getInquiriesByRespondent(1);

      expect(result).toHaveLength(1);
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        where: { respondentId: 1 },
        select: {
          id: true,
          dateOfInquiry: true,
          inquirerName: true,
          inquirerContact: true,
          typeOfInquiry: true,
          inquiryContent: true,
          progressStatus: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfInquiry: "desc" },
      });
    });
  });

  describe("getInquiriesByRecorder", () => {
    it("should return inquiries filtered by recorder", async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([mockInquiryData]);

      const result = await inquiryService.getInquiriesByRecorder(1);

      expect(result).toHaveLength(1);
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        where: { recorderId: 1 },
        select: {
          id: true,
          dateOfInquiry: true,
          inquirerName: true,
          inquirerContact: true,
          typeOfInquiry: true,
          inquiryContent: true,
          progressStatus: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true } },
          respondent: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfInquiry: "desc" },
      });
    });
  });
});
