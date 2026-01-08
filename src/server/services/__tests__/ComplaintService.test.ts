import { ComplaintService } from "../ComplaintService";
import { ComplaintStatus } from "@prisma/client";

// Mock the prisma client before importing
jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    complaintDetail: {
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

describe("ComplaintService", () => {
  let complaintService: ComplaintService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    complaintService = new ComplaintService();
    jest.clearAllMocks();
  });

  const mockComplaintData = {
    id: 1,
    dateOfOccurrence: new Date("2024-01-15"),
    complainerName: "John Doe",
    complainerContact: "john@example.com",
    personInvolved: "Jane Smith",
    progressStatus: ComplaintStatus.OPEN,
    urgencyLevel: "High",
    complaintContent: "Test complaint content",
    respondentId: 1,
    companyId: 1,
    recorderId: 1,
    resolutionDate: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    respondent: { id: 1, name: "Respondent User" },
    company: { id: 1, name: "Test Company" },
    recorder: { id: 1, name: "Recorder Staff" },
  };

  describe("getComplaintDetails", () => {
    it("should return all complaint details with relationships", async () => {
      mockPrisma.complaintDetail.findMany.mockResolvedValue([
        mockComplaintData,
      ]);

      const result = await complaintService.getComplaintDetails();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        complainerName: "John Doe",
        respondent: { name: "Respondent User" },
        company: { name: "Test Company" },
        recorder: { name: "Recorder Staff" },
      });
      expect(result[0].daysPassed).toBeGreaterThan(0);
    });

    it("should apply filters correctly", async () => {
      const filters = {
        status: ComplaintStatus.OPEN,
        companyId: 1,
        search: "John",
      };

      mockPrisma.complaintDetail.findMany.mockResolvedValue([
        mockComplaintData,
      ]);

      await complaintService.getComplaintDetails(filters);

      expect(mockPrisma.complaintDetail.findMany).toHaveBeenCalledWith({
        where: {
          progressStatus: ComplaintStatus.OPEN,
          companyId: 1,
          OR: [
            { complainerName: { contains: "John" } },
            { complainerContact: { contains: "John" } },
            { personInvolved: { contains: "John" } },
            { complaintContent: { contains: "John" } },
            { urgencyLevel: { contains: "John" } },
          ],
        },
        select: {
          id: true,
          dateOfOccurrence: true,
          complainerName: true,
          complainerContact: true,
          personInvolved: true,
          progressStatus: true,
          urgencyLevel: true,
          complaintContent: true,
          resolutionDate: true,
          createdAt: true,
          updatedAt: true,
          respondent: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true, employeeId: true } },
        },
        orderBy: { dateOfOccurrence: "desc" },
      });
    });
  });

  describe("getComplaintDetailById", () => {
    it("should return complaint detail by ID with relationships", async () => {
      const mockComplaintWithDetails = {
        ...mockComplaintData,
        respondent: {
          id: 1,
          name: "Respondent User",
          email: "respondent@example.com",
        },
        company: {
          id: 1,
          name: "Test Company",
          address: "123 Test St",
          phone: "555-0123",
          email: "company@example.com",
        },
        recorder: {
          id: 1,
          name: "Recorder Staff",
          employeeId: "EMP001",
          position: "Manager",
          department: "HR",
        },
      };

      mockPrisma.complaintDetail.findUnique.mockResolvedValue(
        mockComplaintWithDetails
      );

      const result = await complaintService.getComplaintDetailById(1);

      expect(result).toMatchObject({
        id: 1,
        complainerName: "John Doe",
        respondent: { name: "Respondent User" },
        company: { name: "Test Company" },
        recorder: { name: "Recorder Staff" },
      });
      expect(result?.daysPassed).toBeGreaterThan(0);
    });

    it("should return null if complaint not found", async () => {
      mockPrisma.complaintDetail.findUnique.mockResolvedValue(null);

      const result = await complaintService.getComplaintDetailById(999);

      expect(result).toBeNull();
    });
  });

  describe("createComplaintDetail", () => {
    it("should create new complaint detail", async () => {
      const createData = {
        dateOfOccurrence: new Date("2024-01-15"),
        complainerName: "John Doe",
        complainerContact: "john@example.com",
        personInvolved: "Jane Smith",
        urgencyLevel: "High",
        complaintContent: "Test complaint content",
        recorderId: 1,
      };

      mockPrisma.complaintDetail.create.mockResolvedValue(mockComplaintData);

      const result = await complaintService.createComplaintDetail(createData);

      expect(result).toMatchObject({
        id: 1,
        complainerName: "John Doe",
        recorder: { name: "Recorder Staff" },
      });
      expect(mockPrisma.complaintDetail.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          progressStatus: ComplaintStatus.OPEN,
          respondentId: undefined,
          companyId: undefined,
          resolutionDate: undefined,
        },
        include: {
          respondent: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          recorder: { select: { id: true, name: true } },
        },
      });
    });
  });

  describe("updateComplaintDetail", () => {
    it("should update complaint detail", async () => {
      const updateData = {
        complainerName: "Updated Name",
        progressStatus: ComplaintStatus.CLOSED,
        resolutionDate: new Date("2024-01-20"),
      };

      const updatedComplaint = {
        ...mockComplaintData,
        ...updateData,
      };

      mockPrisma.complaintDetail.update.mockResolvedValue(updatedComplaint);

      const result = await complaintService.updateComplaintDetail(
        1,
        updateData
      );

      expect(result.complainerName).toBe("Updated Name");
      expect(result.progressStatus).toBe(ComplaintStatus.CLOSED);
    });
  });

  describe("daysPassed calculation", () => {
    it("should calculate days passed correctly", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

      const complaintWithPastDate = {
        ...mockComplaintData,
        dateOfOccurrence: pastDate,
      };

      mockPrisma.complaintDetail.findMany.mockResolvedValue([
        complaintWithPastDate,
      ]);

      const result = await complaintService.getComplaintDetails();

      expect(result[0].daysPassed).toBe(10);
    });
  });

  describe("getComplaintStatistics", () => {
    it("should return complaint statistics", async () => {
      mockPrisma.complaintDetail.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60) // open
        .mockResolvedValueOnce(30) // closed
        .mockResolvedValueOnce(10); // on hold

      mockPrisma.complaintDetail.groupBy.mockResolvedValue([
        { urgencyLevel: "High", _count: { id: 20 } },
        { urgencyLevel: "Medium", _count: { id: 50 } },
        { urgencyLevel: "Low", _count: { id: 30 } },
      ]);

      const result = await complaintService.getComplaintStatistics();

      expect(result).toEqual({
        total: 100,
        open: 60,
        closed: 30,
        onHold: 10,
        byUrgency: {
          High: 20,
          Medium: 50,
          Low: 30,
        },
      });
    });
  });
});
