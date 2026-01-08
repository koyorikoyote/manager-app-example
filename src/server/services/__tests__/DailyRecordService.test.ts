import { DailyRecordService } from "../DailyRecordService";
import { PrismaClient } from "@prisma/client";

// Mock Prisma Client
const mockPrisma = {
  dailyRecord: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
} as unknown as PrismaClient;

describe("DailyRecordService", () => {
  let service: DailyRecordService;

  beforeEach(() => {
    service = new DailyRecordService(mockPrisma);
    jest.clearAllMocks();
  });

  describe("getDailyRecords", () => {
    it("should return daily records with staff information", async () => {
      const mockData = [
        {
          id: 1,
          dateOfRecord: new Date("2024-01-15"),
          conditionStatus: "Good",
          feedbackContent: "Everything is working well",
          createdAt: new Date(),
          updatedAt: new Date(),
          staff: {
            id: 1,
            name: "John Doe",
            phone: "123-456-7890",
          },
        },
      ];

      (mockPrisma.dailyRecord.findMany as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await service.getDailyRecords();

      expect(mockPrisma.dailyRecord.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          dateOfRecord: "desc",
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        dateOfRecord: new Date("2024-01-15"),
        conditionStatus: "Good",
        feedbackContent: "Everything is working well",
        staff: {
          id: 1,
          name: "John Doe",
          phone: "123-456-7890",
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should filter by staffId when provided", async () => {
      (mockPrisma.dailyRecord.findMany as jest.Mock).mockResolvedValue([]);

      await service.getDailyRecords({ staffId: 1 });

      expect(mockPrisma.dailyRecord.findMany).toHaveBeenCalledWith({
        where: { staffId: 1 },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          dateOfRecord: "desc",
        },
      });
    });

    it("should filter by date range when provided", async () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-01-31");

      (mockPrisma.dailyRecord.findMany as jest.Mock).mockResolvedValue([]);

      await service.getDailyRecords({ dateFrom, dateTo });

      expect(mockPrisma.dailyRecord.findMany).toHaveBeenCalledWith({
        where: {
          dateOfRecord: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          dateOfRecord: "desc",
        },
      });
    });
  });

  describe("getDailyRecordById", () => {
    it("should return daily record by id", async () => {
      const mockData = {
        id: 1,
        dateOfRecord: new Date("2024-01-15"),
        conditionStatus: "Good",
        feedbackContent: "Everything is working well",
        createdAt: new Date(),
        updatedAt: new Date(),
        staff: {
          id: 1,
          name: "John Doe",
          phone: "123-456-7890",
          employeeId: "EMP001",
          position: "Manager",
          department: "IT",
          email: "john@example.com",
        },
      };

      (mockPrisma.dailyRecord.findUnique as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await service.getDailyRecordById(1);

      expect(mockPrisma.dailyRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
              employeeId: true,
              position: true,
              department: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 1,
        dateOfRecord: new Date("2024-01-15"),
        conditionStatus: "Good",
        feedbackContent: "Everything is working well",
        staff: {
          id: 1,
          name: "John Doe",
          phone: "123-456-7890",
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should return null when record not found", async () => {
      (mockPrisma.dailyRecord.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getDailyRecordById(999);

      expect(result).toBeNull();
    });
  });

  describe("createDailyRecord", () => {
    it("should create a new daily record", async () => {
      const createData = {
        dateOfRecord: new Date("2024-01-15"),
        staffId: 1,
        conditionStatus: "Good",
        feedbackContent: "Everything is working well",
      };

      const mockCreatedRecord = {
        id: 1,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
        staff: {
          id: 1,
          name: "John Doe",
          phone: "123-456-7890",
        },
      };

      (mockPrisma.dailyRecord.create as jest.Mock).mockResolvedValue(
        mockCreatedRecord
      );

      const result = await service.createDailyRecord(createData);

      expect(mockPrisma.dailyRecord.create).toHaveBeenCalledWith({
        data: createData,
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      expect(result.id).toBe(1);
      expect(result.conditionStatus).toBe("Good");
      expect(result.staff.name).toBe("John Doe");
    });
  });
});
