import { PrismaClient, Prisma, CompanyStatus } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CompanyFilters {
  status?: CompanyStatus;
  industry?: string;
  search?: string;
}

export interface CompanyCreateData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  description?: string;
  status?: CompanyStatus;
  contactPerson?: string;
  hiringVacancies?: number;
  preferredNationality?: string;
  userInChargeId?: number;

  // Optional display ID
  companyId?: string | null;

  // New header fields
  photo?: string;
  corporateNumber?: string;
  furiganaName?: string;
  establishmentDate?: Date;
  country?: string;
  region?: string;
  prefecture?: string;
  city?: string;
  postalCode?: string;

  // Job Information fields
  preferredStatusOfResidence?: string;
  preferredAge?: string;
  preferredExperience?: string;
  preferredQualifications?: string;
  preferredPersonality?: string;
  preferredEducation?: string;
  preferredJapaneseProficiency?: string;
  destinationWorkEnvironment?: string;
  destinationAverageAge?: string;
  destinationWorkPlace?: string;
  destinationTransfer?: string;
  jobSelectionProcess?: string;
  jobPastRecruitmentHistory?: string;
  jobSalary?: string;
  jobOvertimeRate?: string;
  jobSalaryIncreaseRate?: string;
  jobSalaryBonus?: string;
  jobAllowances?: string;
  jobEmployeeBenefits?: string;
  jobRetirementBenefits?: string;
  jobTermsAndConditions?: string;
  jobDisputePreventionMeasures?: string;
  jobProvisionalHiringConditions?: string;
  jobContractRenewalConditions?: string;
  jobRetirementConditions?: string;
}

export interface CompanyUpdateData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  description?: string;
  status?: CompanyStatus;
  contactPerson?: string;
  hiringVacancies?: number;
  preferredNationality?: string;
  userInChargeId?: number;

  // Optional display ID
  companyId?: string | null;

  // New header fields
  photo?: string;
  corporateNumber?: string;
  furiganaName?: string;
  establishmentDate?: Date;
  country?: string;
  region?: string;
  prefecture?: string;
  city?: string;
  postalCode?: string;

  // Job Information fields
  preferredStatusOfResidence?: string;
  preferredAge?: string;
  preferredExperience?: string;
  preferredQualifications?: string;
  preferredPersonality?: string;
  preferredEducation?: string;
  preferredJapaneseProficiency?: string;
  destinationWorkEnvironment?: string;
  destinationAverageAge?: string;
  destinationWorkPlace?: string;
  destinationTransfer?: string;
  jobSelectionProcess?: string;
  jobPastRecruitmentHistory?: string;
  jobSalary?: string;
  jobOvertimeRate?: string;
  jobSalaryIncreaseRate?: string;
  jobSalaryBonus?: string;
  jobAllowances?: string;
  jobEmployeeBenefits?: string;
  jobRetirementBenefits?: string;
  jobTermsAndConditions?: string;
  jobDisputePreventionMeasures?: string;
  jobProvisionalHiringConditions?: string;
  jobContractRenewalConditions?: string;
  jobRetirementConditions?: string;
}

export class CompanyService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all companies with optional filtering
   */
  async getAllCompanies(filters?: CompanyFilters) {
    const where: Prisma.CompanyWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.industry) {
      where.industry = {
        contains: filters.industry,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { industry: { contains: filters.search } },
        { contactPerson: { contains: filters.search } },
        { furiganaName: { contains: filters.search } },
        { corporateNumber: { contains: filters.search } },
      ];
    }

    return this.prisma.company.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        name: true,
        postalCode: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        industry: true,
        description: true,
        status: true,
        contactPerson: true,
        hiringVacancies: true,
        preferredNationality: true,
        // New header fields
        photo: true,
        corporateNumber: true,
        furiganaName: true,
        establishmentDate: true,
        country: true,
        region: true,
        prefecture: true,
        city: true,
        // Job Information fields
        preferredStatusOfResidence: true,
        preferredAge: true,
        preferredExperience: true,
        preferredQualifications: true,
        preferredPersonality: true,
        preferredEducation: true,
        preferredJapaneseProficiency: true,
        destinationWorkEnvironment: true,
        destinationAverageAge: true,
        destinationWorkPlace: true,
        destinationTransfer: true,
        jobSelectionProcess: true,
        jobPastRecruitmentHistory: true,
        jobSalary: true,
        jobOvertimeRate: true,
        jobSalaryIncreaseRate: true,
        jobSalaryBonus: true,
        jobAllowances: true,
        jobEmployeeBenefits: true,
        jobRetirementBenefits: true,
        jobTermsAndConditions: true,
        jobDisputePreventionMeasures: true,
        jobProvisionalHiringConditions: true,
        jobContractRenewalConditions: true,
        jobRetirementConditions: true,
        createdAt: true,
        updatedAt: true,
        userInCharge: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: number) {
    return this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        name: true,
        postalCode: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        industry: true,
        description: true,
        status: true,
        contactPerson: true,
        hiringVacancies: true,
        preferredNationality: true,
        // New header fields
        photo: true,
        corporateNumber: true,
        furiganaName: true,
        establishmentDate: true,
        country: true,
        region: true,
        prefecture: true,
        city: true,
        // Job Information fields
        preferredStatusOfResidence: true,
        preferredAge: true,
        preferredExperience: true,
        preferredQualifications: true,
        preferredPersonality: true,
        preferredEducation: true,
        preferredJapaneseProficiency: true,
        destinationWorkEnvironment: true,
        destinationAverageAge: true,
        destinationWorkPlace: true,
        destinationTransfer: true,
        jobSelectionProcess: true,
        jobPastRecruitmentHistory: true,
        jobSalary: true,
        jobOvertimeRate: true,
        jobSalaryIncreaseRate: true,
        jobSalaryBonus: true,
        jobAllowances: true,
        jobEmployeeBenefits: true,
        jobRetirementBenefits: true,
        jobTermsAndConditions: true,
        jobDisputePreventionMeasures: true,
        jobProvisionalHiringConditions: true,
        jobContractRenewalConditions: true,
        jobRetirementConditions: true,
        createdAt: true,
        updatedAt: true,
        userInCharge: {
          select: { id: true, name: true },
        },
        complaints: {
          select: {
            id: true,
            dateOfOccurrence: true,
            complainerName: true,
            progressStatus: true,
            urgencyLevel: true,
          },
          orderBy: { dateOfOccurrence: "desc" },
        },
        inquiries: {
          select: {
            id: true,
            dateOfInquiry: true,
            inquirerName: true,
            progressStatus: true,
            typeOfInquiry: true,
          },
          orderBy: { dateOfInquiry: "desc" },
        },
      },
    });
  }

  /**
   * Create new company
   */
  async createCompany(data: CompanyCreateData) {
    return this.prisma.company.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        industry: data.industry,
        description: data.description,
        status: data.status || CompanyStatus.ACTIVE,
        contactPerson: data.contactPerson,
        hiringVacancies: data.hiringVacancies || 0,
        preferredNationality: data.preferredNationality,
        userInCharge: data.userInChargeId
          ? { connect: { id: data.userInChargeId } }
          : undefined,
        // Optional display ID
        companyId: data.companyId,

        // New header fields
        photo: data.photo,
        corporateNumber: data.corporateNumber,
        furiganaName: data.furiganaName,
        establishmentDate: data.establishmentDate,
        country: data.country,
        region: data.region,
        prefecture: data.prefecture,
        city: data.city,
        postalCode: data.postalCode,

        // Job Information fields
        preferredStatusOfResidence: data.preferredStatusOfResidence,
        preferredAge: data.preferredAge,
        preferredExperience: data.preferredExperience,
        preferredQualifications: data.preferredQualifications,
        preferredPersonality: data.preferredPersonality,
        preferredEducation: data.preferredEducation,
        preferredJapaneseProficiency: data.preferredJapaneseProficiency,
        destinationWorkEnvironment: data.destinationWorkEnvironment,
        destinationAverageAge: data.destinationAverageAge,
        destinationWorkPlace: data.destinationWorkPlace,
        destinationTransfer: data.destinationTransfer,
        jobSelectionProcess: data.jobSelectionProcess,
        jobPastRecruitmentHistory: data.jobPastRecruitmentHistory,
        jobSalary: data.jobSalary,
        jobOvertimeRate: data.jobOvertimeRate,
        jobSalaryIncreaseRate: data.jobSalaryIncreaseRate,
        jobSalaryBonus: data.jobSalaryBonus,
        jobAllowances: data.jobAllowances,
        jobEmployeeBenefits: data.jobEmployeeBenefits,
        jobRetirementBenefits: data.jobRetirementBenefits,
        jobTermsAndConditions: data.jobTermsAndConditions,
        jobDisputePreventionMeasures: data.jobDisputePreventionMeasures,
        jobProvisionalHiringConditions: data.jobProvisionalHiringConditions,
        jobContractRenewalConditions: data.jobContractRenewalConditions,
        jobRetirementConditions: data.jobRetirementConditions,
      },
      include: {
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update company
   */
  async updateCompany(id: number, data: CompanyUpdateData) {
    const updateData: Prisma.CompanyUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.contactPerson !== undefined)
      updateData.contactPerson = data.contactPerson;
    if (data.hiringVacancies !== undefined)
      updateData.hiringVacancies = data.hiringVacancies;
    if (data.preferredNationality !== undefined)
      updateData.preferredNationality = data.preferredNationality;
    if (data.userInChargeId !== undefined) {
      updateData.userInCharge = data.userInChargeId
        ? { connect: { id: data.userInChargeId } }
        : { disconnect: true };
    }

    // New header fields
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.photo !== undefined) updateData.photo = data.photo;
    if (data.corporateNumber !== undefined)
      updateData.corporateNumber = data.corporateNumber;
    if (data.furiganaName !== undefined)
      updateData.furiganaName = data.furiganaName;
    if (data.establishmentDate !== undefined)
      updateData.establishmentDate = data.establishmentDate;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.prefecture !== undefined) updateData.prefecture = data.prefecture;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;

    // Job Information fields
    if (data.preferredStatusOfResidence !== undefined)
      updateData.preferredStatusOfResidence = data.preferredStatusOfResidence;
    if (data.preferredAge !== undefined)
      updateData.preferredAge = data.preferredAge;
    if (data.preferredExperience !== undefined)
      updateData.preferredExperience = data.preferredExperience;
    if (data.preferredQualifications !== undefined)
      updateData.preferredQualifications = data.preferredQualifications;
    if (data.preferredPersonality !== undefined)
      updateData.preferredPersonality = data.preferredPersonality;
    if (data.preferredEducation !== undefined)
      updateData.preferredEducation = data.preferredEducation;
    if (data.preferredJapaneseProficiency !== undefined)
      updateData.preferredJapaneseProficiency =
        data.preferredJapaneseProficiency;
    if (data.destinationWorkEnvironment !== undefined)
      updateData.destinationWorkEnvironment = data.destinationWorkEnvironment;
    if (data.destinationAverageAge !== undefined)
      updateData.destinationAverageAge = data.destinationAverageAge;
    if (data.destinationWorkPlace !== undefined)
      updateData.destinationWorkPlace = data.destinationWorkPlace;
    if (data.destinationTransfer !== undefined)
      updateData.destinationTransfer = data.destinationTransfer;
    if (data.jobSelectionProcess !== undefined)
      updateData.jobSelectionProcess = data.jobSelectionProcess;
    if (data.jobPastRecruitmentHistory !== undefined)
      updateData.jobPastRecruitmentHistory = data.jobPastRecruitmentHistory;
    if (data.jobSalary !== undefined) updateData.jobSalary = data.jobSalary;
    if (data.jobOvertimeRate !== undefined)
      updateData.jobOvertimeRate = data.jobOvertimeRate;
    if (data.jobSalaryIncreaseRate !== undefined)
      updateData.jobSalaryIncreaseRate = data.jobSalaryIncreaseRate;
    if (data.jobSalaryBonus !== undefined)
      updateData.jobSalaryBonus = data.jobSalaryBonus;
    if (data.jobAllowances !== undefined)
      updateData.jobAllowances = data.jobAllowances;
    if (data.jobEmployeeBenefits !== undefined)
      updateData.jobEmployeeBenefits = data.jobEmployeeBenefits;
    if (data.jobRetirementBenefits !== undefined)
      updateData.jobRetirementBenefits = data.jobRetirementBenefits;
    if (data.jobTermsAndConditions !== undefined)
      updateData.jobTermsAndConditions = data.jobTermsAndConditions;
    if (data.jobDisputePreventionMeasures !== undefined)
      updateData.jobDisputePreventionMeasures =
        data.jobDisputePreventionMeasures;
    if (data.jobProvisionalHiringConditions !== undefined)
      updateData.jobProvisionalHiringConditions =
        data.jobProvisionalHiringConditions;
    if (data.jobContractRenewalConditions !== undefined)
      updateData.jobContractRenewalConditions =
        data.jobContractRenewalConditions;
    if (data.jobRetirementConditions !== undefined)
      updateData.jobRetirementConditions = data.jobRetirementConditions;

    return this.prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete company (set status to INACTIVE)
   */
  async deleteCompany(id: number) {
    return this.prisma.company.update({
      where: { id },
      data: {
        status: CompanyStatus.INACTIVE,
      },
    });
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics() {
    const [total, active, inactive, suspended] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: CompanyStatus.ACTIVE } }),
      this.prisma.company.count({ where: { status: CompanyStatus.INACTIVE } }),
      this.prisma.company.count({ where: { status: CompanyStatus.SUSPENDED } }),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
    };
  }

  /**
   * Update company photo
   */
  async updateCompanyPhoto(id: number, photoUrl: string | null) {
    return this.prisma.company.update({
      where: { id },
      data: { photo: photoUrl },
      select: {
        id: true,
        photo: true,
      },
    });
  }

  /**
   * Get interaction records for a company
   */
  async getCompanyInteractionRecords(companyId: number) {
    return this.prisma.interactionRecord.findMany({
      where: { companiesId: companyId },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        status: true,
        name: true,
        title: true,
        personConcerned: true,
        location: true,
        means: true,
        responseDetails: true,
        createdAt: true,
        updatedAt: true,
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  /**
   * Get documents for a company
   */
  async getCompanyDocuments(companyId: number) {
    return this.prisma.document.findMany({
      where: { companiesId: companyId },
      select: {
        id: true,
        title: true,
        type: true,
        relatedEntityId: true,
        filePath: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });
  }
}

export default new CompanyService();
