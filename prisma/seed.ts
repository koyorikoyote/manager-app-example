/// <reference types="node" />
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const REGION = process.env.AWS_REGION || "ap-northeast-1";
const BUCKET = process.env.S3_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

/**
 * @param {string} input
 * @returns {string}
 */
function s3url(input: string): string {
  const clean = input.replace(/^\/+/, "");
  const key = clean.startsWith("uploads/") ? clean : `uploads/${clean}`;
  if (CLOUDFRONT_DOMAIN) return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  if (BUCKET) return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return `https://example-cloudfront.domain/${key}`;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Truncate all tables first (in correct order to handle foreign key constraints)
  console.log("🗑️  Truncating all tables...");

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

  // Truncate tables in reverse dependency order
  await prisma.$executeRaw`TRUNCATE TABLE attendance_records`;
  await prisma.$executeRaw`TRUNCATE TABLE interaction_records`;
  await prisma.$executeRaw`TRUNCATE TABLE documents`;
  await prisma.$executeRaw`TRUNCATE TABLE complaint_details`;
  await prisma.$executeRaw`TRUNCATE TABLE daily_record`;
  await prisma.$executeRaw`TRUNCATE TABLE inquiries`;
  await prisma.$executeRaw`TRUNCATE TABLE message_replies`;
  await prisma.$executeRaw`TRUNCATE TABLE companies`;

  await prisma.$executeRaw`TRUNCATE TABLE property_staff_assignments`;
  await prisma.$executeRaw`TRUNCATE TABLE system_configurations`;
  await prisma.$executeRaw`TRUNCATE TABLE user_sessions`;
  await prisma.$executeRaw`TRUNCATE TABLE staff`;
  await prisma.$executeRaw`TRUNCATE TABLE properties`;
  await prisma.$executeRaw`TRUNCATE TABLE users`;
  await prisma.$executeRaw`TRUNCATE TABLE user_roles`;

  // Mobile tables (Dispatch App)
  await prisma.$executeRaw`TRUNCATE TABLE mobile_refresh_tokens`;
  await prisma.$executeRaw`TRUNCATE TABLE mobile_users`;
  await prisma.$executeRaw`TRUNCATE TABLE mobile_user_roles`;

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

  console.log("✅ All tables truncated successfully");

  // 1. Create User Roles
  console.log("👥 Creating user roles...");
  const adminRole = await prisma.userRole.create({
    data: {
      name: "Administrator",
      description: "Full system access",
      level: 3,
    },
  });

  const managerRole = await prisma.userRole.create({
    data: {
      name: "Manager",
      description: "Management access",
      level: 2,
    },
  });

  const userRole = await prisma.userRole.create({
    data: {
      name: "User",
      description: "Basic user access",
      level: 1,
    },
  });

  // 2. Create Users
  console.log("👤 Creating users...");
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@imas.com",
      passwordHash:
        "$2b$10$3C0eR3N44e3YQp1juCRDe.Dq5FkesD3viZEx.o9x9fhhHvPmViIN2", // hashed 'admin123'
      name: "Kondou",
      roleId: adminRole.id,
      languagePreference: "EN",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: "manager",
      email: "manager@imas.com",
      passwordHash:
        "$2b$10$nFHZv90IpH83UfC9.eTho.O.3dij7B4Oy2e1H1bhrKkBiijwormXe", // hashed 'manager123'
      name: "Otake",
      roleId: managerRole.id,
      languagePreference: "JA",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      username: "user",
      email: "user@imas.com",
      passwordHash:
        "$2b$10$75xcpdFniXqYHyMALgR./.bVGvPyoeN4diMvu4K8cPxVUuuAcek32", // hashed 'user123'
      name: "Imazumi",
      roleId: userRole.id,
      languagePreference: "JA",
    },
  });

  // 2b. Create Mobile Users for Dispatch App
  console.log("📱 Creating mobile users...");

  // Seed mobile user roles (User=1, Manager=2, Administrator=3)
  await prisma.$executeRaw`
    INSERT INTO mobile_user_roles (name, level) VALUES
      ('User', 1),
      ('Manager', 2),
      ('Administrator', 3)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      level = VALUES(level)
  `;

  // Create mobile users with staff_id and user_id associations
  await prisma.$executeRaw`
    INSERT INTO mobile_users
      (username, email, password_hash, display_name, is_active, staff_id, user_id, created_at, updated_at)
    VALUES
      ('admin', 'admin@mobile.local', ${"$2b$10$3C0eR3N44e3YQp1juCRDe.Dq5FkesD3viZEx.o9x9fhhHvPmViIN2"}, 'Admin', true, NULL, ${
    adminUser.id
  }, NOW(), NOW()),
      ('manager', 'manager@mobile.local', ${"$2b$10$nFHZv90IpH83UfC9.eTho.O.3dij7B4Oy2e1H1bhrKkBiijwormXe"}, 'Manager', true, NULL, ${
    managerUser.id
  }, NOW(), NOW()),
      ('user', 'user@mobile.local', ${"$2b$10$75xcpdFniXqYHyMALgR./.bVGvPyoeN4diMvu4K8cPxVUuuAcek32"}, 'User', true, NULL, ${
    regularUser.id
  }, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      password_hash = VALUES(password_hash),
      display_name = VALUES(display_name),
      is_active = VALUES(is_active),
      staff_id = VALUES(staff_id),
      user_id = VALUES(user_id),
      updated_at = NOW()
  `;

  // Assign roles to mobile accounts
  await prisma.$executeRaw`
    UPDATE mobile_users
    SET mobile_role_id = (SELECT id FROM mobile_user_roles WHERE name = 'Administrator')
    WHERE username = 'admin'
  `;

  await prisma.$executeRaw`
    UPDATE mobile_users
    SET mobile_role_id = (SELECT id FROM mobile_user_roles WHERE name = 'Manager')
    WHERE username = 'manager'
  `;

  await prisma.$executeRaw`
    UPDATE mobile_users
    SET mobile_role_id = (SELECT id FROM mobile_user_roles WHERE name = 'User')
    WHERE username = 'user'
  `;

  // 3. Create Companies first (needed for staff foreign key references)
  console.log("🏢 Creating company records...");
  const companyData: Prisma.CompanyCreateManyInput[] = [
    // Japanese companies (majority)
    {
      companyId: "C00001",
      name: "株式会社東京システム開発",
      address: "東京都渋谷区渋谷1-2-3",
      phone: "+81-3-1234-5678",
      email: "info@tokyosystem.co.jp",
      website: "https://www.tokyosystem.co.jp",
      industry: "Technology",
      description:
        "企業向けソフトウェア開発とモバイルアプリケーション開発を専門とする大手ソフトウェア開発会社。",
      status: "ACTIVE" as const,
      contactPerson: "山田太郎",
      hiringVacancies: 8,
      preferredNationality: "日本",
      userInChargeId: adminUser.id,
      // New header fields
      photo: "company-photos/tokyo-system-dev.jpg",
      corporateNumber: "1234567890123",
      furiganaName: "カブシキガイシャトウキョウシステムカイハツ",
      establishmentDate: new Date("2010-04-01"),
      country: "日本",
      region: "関東",
      prefecture: "東京都",
      city: "渋谷区",
      // Job Information fields
      preferredStatusOfResidence: "技術・人文知識・国際業務",
      preferredAge: "25-40歳",
      preferredExperience: "プログラミング経験3年以上",
      preferredQualifications: "情報処理技術者試験、Java認定資格",
      preferredPersonality: "チームワークを重視し、積極的に学習する姿勢",
      preferredEducation: "大学卒業（情報系学部優遇）",
      preferredJapaneseProficiency: "ビジネスレベル（JLPT N2以上）",
      destinationWorkEnvironment: "オープンオフィス、最新開発環境",
      destinationAverageAge: "32歳",
      destinationWorkPlace: "東京本社、一部リモートワーク可",
      destinationTransfer: "国内転勤の可能性あり",
      jobSelectionProcess: "書類選考→技術面接→最終面接",
      jobPastRecruitmentHistory: "年間15-20名の新卒・中途採用実績",
      jobSalary: "月給35-60万円（経験・スキルに応じて）",
      jobOvertimeRate: "時給2,500円（25%割増）",
      jobSalaryIncreaseRate: "年1回昇給査定（平均5-10%）",
      jobSalaryBonus: "年2回（夏・冬）、業績連動",
      jobAllowances: "交通費全額、住宅手当月3万円",
      jobEmployeeBenefits: "社会保険完備、退職金制度、研修制度",
      jobRetirementBenefits: "企業年金、退職一時金",
      jobTermsAndConditions: "正社員、試用期間3ヶ月",
      jobDisputePreventionMeasures: "労働組合、人事相談窓口設置",
      jobProvisionalHiringConditions: "技術スキル確認、適性検査合格",
      jobContractRenewalConditions: "年次評価に基づく契約更新",
      jobRetirementConditions: "定年60歳、再雇用制度65歳まで",
    },
    {
      companyId: "C00002",
      name: "大阪製造株式会社",
      address: "大阪府大阪市中央区難波4-5-6",
      phone: "+81-6-9876-5432",
      email: "contact@osakamfg.co.jp",
      website: "https://www.osakamfg.co.jp",
      industry: "Manufacturing",
      description: "自動車部品と精密機械の製造を行う工業製造会社。",
      status: "ACTIVE" as const,
      contactPerson: "鈴木花子",
      hiringVacancies: 15,
      preferredNationality: "指定なし",
      userInChargeId: managerUser.id,
      // New header fields
      photo: "company-photos/osaka-manufacturing.jpg",
      corporateNumber: "2345678901234",
      furiganaName: "オオサカセイゾウカブシキガイシャ",
      establishmentDate: new Date("1985-07-15"),
      country: "日本",
      region: "関西",
      prefecture: "大阪府",
      city: "大阪市",
      // Job Information fields
      preferredStatusOfResidence: "技能実習、特定技能",
      preferredAge: "20-45歳",
      preferredExperience: "製造業経験2年以上",
      preferredQualifications: "フォークリフト免許、安全衛生責任者",
      preferredPersonality: "責任感が強く、安全意識の高い方",
      preferredEducation: "高校卒業以上",
      preferredJapaneseProficiency: "日常会話レベル（JLPT N3以上）",
      destinationWorkEnvironment: "工場内作業、クリーンルーム",
      destinationAverageAge: "38歳",
      destinationWorkPlace: "大阪工場、滋賀工場",
      destinationTransfer: "工場間異動の可能性あり",
      jobSelectionProcess: "書類選考→実技試験→面接",
      jobPastRecruitmentHistory: "年間30-40名の技能実習生受入実績",
      jobSalary: "時給1,200-1,800円（経験により決定）",
      jobOvertimeRate: "時給1,500円（25%割増）",
      jobSalaryIncreaseRate: "年1回昇給（平均3-5%）",
      jobSalaryBonus: "年2回（夏・冬）、勤務成績による",
      jobAllowances: "交通費支給、作業服貸与",
      jobEmployeeBenefits: "社会保険、労災保険、健康診断",
      jobRetirementBenefits: "退職金制度（勤続3年以上）",
      jobTermsAndConditions: "正社員・契約社員、試用期間2ヶ月",
      jobDisputePreventionMeasures: "安全委員会、労使協議会",
      jobProvisionalHiringConditions: "健康診断合格、実技試験合格",
      jobContractRenewalConditions: "勤務態度・技能評価による更新",
      jobRetirementConditions: "定年60歳、継続雇用制度あり",
    },
    {
      companyId: "C00003",
      name: "京都医療システム株式会社",
      address: "京都府京都市東山区祇園7-8-9",
      phone: "+81-75-2468-1357",
      email: "admin@kyotomedical.co.jp",
      website: "https://www.kyotomedical.co.jp",
      industry: "Healthcare",
      description:
        "医療ソフトウェアと医療機器ソリューションを提供する医療技術プロバイダー。",
      status: "ACTIVE" as const,
      contactPerson: "渡辺健二",
      hiringVacancies: 5,
      preferredNationality: "日本",
      userInChargeId: adminUser.id,
      // New header fields
      photo: "company-photos/kyoto-medical.jpg",
      corporateNumber: "3456789012345",
      furiganaName: "キョウトイリョウシステムカブシキガイシャ",
      establishmentDate: new Date("2005-03-20"),
      country: "日本",
      region: "関西",
      prefecture: "京都府",
      city: "京都市",
      // Job Information fields
      preferredStatusOfResidence: "技術・人文知識・国際業務",
      preferredAge: "28-50歳",
      preferredExperience: "医療システム開発経験5年以上",
      preferredQualifications: "医療情報技師、システムアーキテクト",
      preferredPersonality: "患者の安全を最優先に考える責任感の強い方",
      preferredEducation: "大学卒業（医学・工学系優遇）",
      preferredJapaneseProficiency: "ネイティブレベル",
      destinationWorkEnvironment: "病院内システム室、開発センター",
      destinationAverageAge: "35歳",
      destinationWorkPlace: "京都本社、病院常駐",
      destinationTransfer: "病院への出向の可能性あり",
      jobSelectionProcess: "書類選考→専門面接→役員面接",
      jobPastRecruitmentHistory: "年間5-8名の専門職採用",
      jobSalary: "月給40-70万円（資格・経験考慮）",
      jobOvertimeRate: "時給3,000円（25%割増）",
      jobSalaryIncreaseRate: "年1回昇給（平均7-12%）",
      jobSalaryBonus: "年2回、業績・個人評価連動",
      jobAllowances: "交通費、資格手当、危険手当",
      jobEmployeeBenefits: "社会保険、企業年金、医療費補助",
      jobRetirementBenefits: "退職金制度、企業年金",
      jobTermsAndConditions: "正社員、試用期間6ヶ月",
      jobDisputePreventionMeasures: "医療安全委員会、倫理委員会",
      jobProvisionalHiringConditions: "医療関連資格、適性検査合格",
      jobContractRenewalConditions: "専門性評価、継続教育受講",
      jobRetirementConditions: "定年65歳、専門職継続雇用制度",
    },
    {
      companyId: "C00004",
      name: "名古屋金融サービス株式会社",
      address: "愛知県名古屋市中区栄10-11-12",
      phone: "+81-52-3579-2468",
      email: "info@nagoyafinance.co.jp",
      website: "https://www.nagoyafinance.co.jp",
      industry: "Finance",
      description:
        "銀行業務と投資ソリューションを提供する地域金融サービス会社。",
      status: "ACTIVE" as const,
      contactPerson: "中村由紀",
      hiringVacancies: 12,
      preferredNationality: "日本",
      userInChargeId: managerUser.id,
    },
    {
      companyId: "C00005",
      name: "横浜小売グループ株式会社",
      address: "神奈川県横浜市西区みなとみらい13-14-15",
      phone: "+81-45-4680-1357",
      email: "contact@yokohamaretail.co.jp",
      website: "https://www.yokohamaretail.co.jp",
      industry: "Retail",
      description:
        "日本全国でデパートと専門店を運営するマルチブランド小売チェーン。",
      status: "ACTIVE" as const,
      contactPerson: "高橋明",
      hiringVacancies: 20,
      preferredNationality: "指定なし",
      userInChargeId: regularUser.id,
    },
    {
      companyId: "C00006",
      name: "札幌建設株式会社",
      address: "北海道札幌市中央区すすきの16-17-18",
      phone: "+81-11-5791-3468",
      email: "projects@sapporoconstruction.co.jp",
      website: "https://www.sapporoconstruction.co.jp",
      industry: "Construction",
      description: "商業ビルとインフラプロジェクトを専門とする建設会社。",
      status: "ACTIVE" as const,
      contactPerson: "佐藤博",
      hiringVacancies: 25,
      preferredNationality: "日本",
      userInChargeId: adminUser.id,
    },
    {
      companyId: "C00007",
      name: "福岡運輸ソリューション株式会社",
      address: "福岡県福岡市中央区天神19-20-21",
      phone: "+81-92-6802-4579",
      email: "logistics@fukuokatransport.co.jp",
      website: "https://www.fukuokatransport.co.jp",
      industry: "Transportation",
      description: "九州全域で貨物と配送サービスを提供する物流・運輸会社。",
      status: "ACTIVE" as const,
      contactPerson: "伊藤雅子",
      hiringVacancies: 10,
      preferredNationality: "指定なし",
      userInChargeId: managerUser.id,
    },
    {
      companyId: "C00008",
      name: "仙台教育研究所",
      address: "宮城県仙台市青葉区青葉22-23-24",
      phone: "+81-22-7913-5680",
      email: "admissions@sendaiedu.ac.jp",
      website: "https://www.sendaiedu.ac.jp",
      industry: "Education",
      description: "職業訓練と専門能力開発プログラムを提供する私立教育機関。",
      status: "ACTIVE" as const,
      contactPerson: "小林恵美子",
      hiringVacancies: 6,
      preferredNationality: "日本",
      userInChargeId: regularUser.id,
    },
    {
      companyId: "C00009",
      name: "広島エネルギー株式会社",
      address: "広島県広島市中区本通25-26-27",
      phone: "+81-82-8024-6791",
      email: "info@hiroshimaenergy.co.jp",
      website: "https://www.hiroshimaenergy.co.jp",
      industry: "Technology",
      description:
        "商業クライアント向けの太陽光・風力発電ソリューションを開発する再生可能エネルギー会社。",
      status: "SUSPENDED" as const,
      contactPerson: "藤原武志",
      hiringVacancies: 0,
      preferredNationality: "日本",
      userInChargeId: adminUser.id,
    },
    {
      companyId: "C00010",
      name: "神戸海運サービス株式会社",
      address: "兵庫県神戸市中央区ハーバーランド28-29-30",
      phone: "+81-78-9135-7802",
      email: "operations@kobemarine.co.jp",
      website: "https://www.kobemarine.co.jp",
      industry: "Transportation",
      description: "貨物と旅客運航を扱う海上輸送・港湾サービス会社。",
      status: "INACTIVE" as const,
      contactPerson: "松本涼子",
      hiringVacancies: 0,
      preferredNationality: "指定なし",
      userInChargeId: managerUser.id,
    },
    {
      companyId: "C00011",
      name: "株式会社九州テクノロジー",
      address: "福岡県福岡市博多区博多駅前31-32-33",
      phone: "+81-92-4567-8901",
      email: "info@kyushutech.co.jp",
      website: "https://www.kyushutech.co.jp",
      industry: "Technology",
      description:
        "AI・IoT技術を活用したスマートシティソリューションの開発企業。",
      status: "ACTIVE" as const,
      contactPerson: "田中一郎",
      hiringVacancies: 18,
      preferredNationality: "指定なし",
      userInChargeId: adminUser.id,
    },
    {
      companyId: "C00012",
      name: "沖縄観光開発株式会社",
      address: "沖縄県那覇市国際通り34-35-36",
      phone: "+81-98-1234-5678",
      email: "info@okinawatourism.co.jp",
      website: "https://www.okinawatourism.co.jp",
      industry: "Tourism",
      description: "沖縄県内のホテル・リゾート施設の運営と観光サービスを提供。",
      status: "ACTIVE" as const,
      contactPerson: "比嘉美咲",
      hiringVacancies: 22,
      preferredNationality: "指定なし",
      userInChargeId: regularUser.id,
    },
    // English companies (reduced to half - 3 companies)
    {
      companyId: "C00013",
      name: "Tokyo Tech Solutions",
      address: "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002, Japan",
      phone: "+81-3-1234-5678",
      email: "info@tokyotech.co.jp",
      website: "https://www.tokyotech.co.jp",
      industry: "Technology",
      description:
        "Leading software development company specializing in enterprise solutions and mobile applications.",
      status: "ACTIVE" as const,
      contactPerson: "Yamada Taro",
      hiringVacancies: 5,
      preferredNationality: "Japan",
      userInChargeId: adminUser.id,
      // New header fields
      photo: "company-photos/tokyo-tech-solutions.jpg",
      corporateNumber: "9876543210987",
      furiganaName: "トウキョウテックソリューションズ",
      establishmentDate: new Date("2015-09-10"),
      country: "Japan",
      region: "Kanto",
      prefecture: "Tokyo",
      city: "Shibuya",
      // Job Information fields
      preferredStatusOfResidence: "Engineer visa, Skilled worker",
      preferredAge: "25-40 years old",
      preferredExperience: "3+ years software development",
      preferredQualifications: "AWS certification, Agile methodology",
      preferredPersonality: "Team-oriented, continuous learner",
      preferredEducation: "Bachelor's degree in Computer Science",
      preferredJapaneseProficiency: "Business level (JLPT N2 or higher)",
      destinationWorkEnvironment: "Modern office, flexible workspace",
      destinationAverageAge: "30 years old",
      destinationWorkPlace: "Tokyo headquarters, remote work available",
      destinationTransfer: "Possible domestic relocation",
      jobSelectionProcess:
        "Resume screening → Technical interview → Final interview",
      jobPastRecruitmentHistory: "10-15 new hires annually",
      jobSalary: "¥4,000,000-8,000,000 annually",
      jobOvertimeRate: "¥2,500/hour (25% premium)",
      jobSalaryIncreaseRate: "Annual review (5-10% average)",
      jobSalaryBonus: "Twice yearly, performance-based",
      jobAllowances: "Transportation, housing allowance ¥30,000",
      jobEmployeeBenefits: "Full social insurance, training programs",
      jobRetirementBenefits: "Corporate pension, retirement lump sum",
      jobTermsAndConditions: "Full-time employee, 3-month probation",
      jobDisputePreventionMeasures: "HR consultation, employee union",
      jobProvisionalHiringConditions: "Technical skills assessment",
      jobContractRenewalConditions: "Annual performance evaluation",
      jobRetirementConditions: "Retirement at 60, re-employment until 65",
    },
    {
      companyId: "C00014",
      name: "Goodlife Solutions",
      address: "33-22-11 Roseland, Chuo-ku, Kobe 123-3355, Japan",
      phone: "+81-78-3485-9483",
      email: "operations@goodlife.com",
      website: "https://www.goodlife.com",
      industry: "Technology",
      description: "AI Technology operations.",
      status: "INACTIVE" as const,
      contactPerson: "Johnson Michael",
      hiringVacancies: 0,
      preferredNationality: "English Speaker",
      userInChargeId: regularUser.id,
    },
    {
      companyId: "C00015",
      name: "International Business Corp",
      address: "45-46-47 Global District, Minato-ku, Tokyo 106-0032, Japan",
      phone: "+81-3-9876-5432",
      email: "contact@intlbusiness.com",
      website: "https://www.intlbusiness.com",
      industry: "Consulting",
      description:
        "International business consulting and market expansion services.",
      status: "ACTIVE" as const,
      contactPerson: "Smith Jennifer",
      hiringVacancies: 7,
      preferredNationality: "Any",
      userInChargeId: managerUser.id,
    },
  ];

  await prisma.company.createMany({
    data: companyData.map((c) => ({
      ...c,
      ...(typeof c.photo === "string" ? { photo: s3url(c.photo) } : {}),
    })),
  });

  // Get created companies for foreign key references
  const companies = await prisma.company.findMany();

  // 4. Create Staff Records (now with companies_id references)
  console.log("👷 Creating staff records...");

  // Japanese staff (majority)
  const staff1 = await prisma.staff.create({
    data: {
      userId: adminUser.id,
      employeeId: "C00001",
      name: "田中太郎",
      position: "システム部長",
      department: "システム開発部",
      email: "tanaka.taro@manager-app.com",
      phone: "+81-90-1234-5678",
      address: "東京都渋谷区渋谷1-1-1",
      hireDate: new Date("2020-04-01"),
      salary: 85000.0,
      status: "ACTIVE",
      residenceStatus: "DESIGNATED_ACTIVITIES",
      age: 42,
      nationality: "Japan",
      userInChargeId: adminUser.id,
      companiesId: companies[0].id,
      // New header fields
      photo: s3url("staff-photos/tanaka-taro.jpg"),
      furiganaName: "タナカ タロウ",
      gender: "M",
      // New basic information fields
      dateOfBirth: new Date("1982-03-15"),
      postalCode: "150-0002",
      mobile: "+81-90-1234-5678",
      fax: "+81-3-1234-5679",
      periodOfStayDateStart: new Date("2020-04-01"),
      periodOfStayDateEnd: new Date("2030-03-31"),
      qualificationsAndLicenses:
        "情報処理技術者試験、プロジェクトマネージャー試験、TOEIC 850点",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["東京大学", "東京工業高等学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "HIGH_SCHOOL"],
      // Ordered array fields for work history
      workHistoryName: ["株式会社ABC", "フリーランス"],
      workHistoryDateStart: ["2005-04-01", "2018-01-01"],
      workHistoryDateEnd: ["2017-12-31", "2020-03-31"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["東京", "東京"],
      workHistoryPosition: ["シニアエンジニア", "ITコンサルタント"],
      workHistoryEmploymentType: ["FULL_TIME", "CONTRACT"],
      workHistoryDescription: [
        "大規模システム開発プロジェクトのリーダー",
        "中小企業向けIT導入支援",
      ],
      // Additional personal fields
      reasonForApplying: "技術力を活かして会社の成長に貢献したい",
      motivationToComeJapan: "日本出身",
      familySpouse: true,
      familyChildren: 2,
      hobbyAndInterests: "読書、プログラミング、ゴルフ",
      // Emergency contacts
      emergencyContactPrimaryName: "田中花子",
      emergencyContactPrimaryRelationship: "配偶者",
      emergencyContactPrimaryNumber: "+81-90-9876-5432",
      emergencyContactPrimaryEmail: "tanaka.hanako@email.com",
      emergencyContactSecondaryName: "田中一郎",
      emergencyContactSecondaryRelationship: "父親",
      emergencyContactSecondaryNumber: "+81-80-1111-2222",
      emergencyContactSecondaryEmail: "tanaka.ichiro@email.com",
      remarks:
        "優秀なリーダーシップスキルを持つ。チームマネジメントに長けている。",
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      userId: managerUser.id,
      employeeId: "C00002",
      name: "佐藤花子",
      position: "プロジェクトマネージャー",
      department: "営業部",
      email: "sato.hanako@manager-app.com",
      phone: "+81-90-2345-6789",
      address: "大阪府大阪市中央区難波2-2-2",
      hireDate: new Date("2021-06-15"),
      salary: 75000.0,
      status: "ACTIVE",
      residenceStatus: "OTHER",
      age: 35,
      nationality: "Japan",
      userInChargeId: managerUser.id,
      companiesId: companies[1].id,
      // New header fields
      photo: s3url("staff-photos/sato-hanako.jpg"),
      furiganaName: "サトウ ハナコ",
      gender: "F",
      // New basic information fields
      dateOfBirth: new Date("1989-07-22"),
      postalCode: "542-0076",
      mobile: "+81-90-2345-6789",
      fax: "+81-6-2345-6790",
      periodOfStayDateStart: new Date("2021-06-15"),
      periodOfStayDateEnd: new Date("2031-06-14"),
      qualificationsAndLicenses: "PMP資格、販売士検定2級、簿記2級",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["関西大学", "大阪府立高等学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "HIGH_SCHOOL"],
      // Ordered array fields for work history
      workHistoryName: ["株式会社XYZ商事", "株式会社DEF"],
      workHistoryDateStart: ["2012-04-01", "2018-10-01"],
      workHistoryDateEnd: ["2018-09-30", "2021-06-14"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["大阪", "京都"],
      workHistoryPosition: ["営業担当", "営業主任"],
      workHistoryEmploymentType: ["FULL_TIME", "FULL_TIME"],
      workHistoryDescription: [
        "新規顧客開拓と既存顧客管理",
        "営業チームのマネジメント",
      ],
      // Additional personal fields
      reasonForApplying: "営業経験を活かしてより大きなプロジェクトに挑戦したい",
      motivationToComeJapan: "日本出身",
      familySpouse: false,
      familyChildren: 0,
      hobbyAndInterests: "テニス、料理、映画鑑賞",
      // Emergency contacts
      emergencyContactPrimaryName: "佐藤太郎",
      emergencyContactPrimaryRelationship: "父親",
      emergencyContactPrimaryNumber: "+81-90-8765-4321",
      emergencyContactPrimaryEmail: "sato.taro@email.com",
      emergencyContactSecondaryName: "佐藤美咲",
      emergencyContactSecondaryRelationship: "母親",
      emergencyContactSecondaryNumber: "+81-80-2222-3333",
      emergencyContactSecondaryEmail: "sato.misaki@email.com",
      remarks: "コミュニケーション能力が高く、顧客との関係構築が得意。",
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      employeeId: "C00003",
      name: "鈴木一郎",
      position: "マーケティングスペシャリスト",
      department: "マーケティング部",
      email: "suzuki.ichiro@manager-app.com",
      phone: "+81-90-3456-7890",
      address: "京都府京都市東山区祇園3-3-3",
      hireDate: new Date("2022-03-01"),
      salary: 65000.0,
      status: "ACTIVE",
      residenceStatus: "LONG_TERM_RESIDENT",
      age: 29,
      nationality: "Japan",
      userInChargeId: adminUser.id,
      companiesId: companies[2].id,
      // New header fields
      photo: s3url("staff-photos/suzuki-ichiro.jpg"),
      furiganaName: "スズキ イチロウ",
      gender: "M",
      // New basic information fields
      dateOfBirth: new Date("1995-11-08"),
      postalCode: "605-0073",
      mobile: "+81-90-3456-7890",
      fax: "+81-75-3456-7891",
      periodOfStayDateStart: new Date("2022-03-01"),
      periodOfStayDateEnd: new Date("2032-02-29"),
      qualificationsAndLicenses:
        "Google Analytics認定資格、ウェブ解析士、マーケティング検定2級",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["京都大学", "京都府立高等学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "HIGH_SCHOOL"],
      // Ordered array fields for work history
      workHistoryName: ["株式会社GHI広告", "インターン"],
      workHistoryDateStart: ["2018-04-01", "2017-07-01"],
      workHistoryDateEnd: ["2022-02-28", "2017-08-31"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["京都", "京都"],
      workHistoryPosition: [
        "マーケティングアシスタント",
        "マーケティングインターン",
      ],
      workHistoryEmploymentType: ["FULL_TIME", "PART_TIME"],
      workHistoryDescription: [
        "デジタルマーケティング施策の企画・実行",
        "市場調査とデータ分析",
      ],
      // Additional personal fields
      reasonForApplying: "デジタルマーケティングの専門性を深めたい",
      motivationToComeJapan: "日本出身",
      familySpouse: false,
      familyChildren: 0,
      hobbyAndInterests: "写真撮影、旅行、データ分析",
      // Emergency contacts
      emergencyContactPrimaryName: "鈴木健太",
      emergencyContactPrimaryRelationship: "兄",
      emergencyContactPrimaryNumber: "+81-90-7654-3210",
      emergencyContactPrimaryEmail: "suzuki.kenta@email.com",
      emergencyContactSecondaryName: "鈴木由美",
      emergencyContactSecondaryRelationship: "母親",
      emergencyContactSecondaryNumber: "+81-80-3333-4444",
      emergencyContactSecondaryEmail: "suzuki.yumi@email.com",
      remarks:
        "データ分析に長けており、創造的なマーケティング施策を提案できる。",
    },
  });

  const staff4 = await prisma.staff.create({
    data: {
      employeeId: "C00004",
      name: "山田美咲",
      position: "UXデザイナー",
      department: "デザイン部",
      email: "yamada.misaki@manager-app.com",
      phone: "+81-90-4567-8901",
      address: "愛知県名古屋市中区栄4-4-4",
      hireDate: new Date("2021-09-15"),
      salary: 60000.0,
      status: "ACTIVE",
      residenceStatus: "HIGHLY_SKILLED_PROFESSIONAL",
      age: 27,
      nationality: "Japan",
      userInChargeId: managerUser.id,
      companiesId: companies[3].id,
      // New header fields
      photo: s3url("staff-photos/yamada-misaki.jpg"),
      furiganaName: "ヤマダ ミサキ",
      gender: "F",
      // New basic information fields
      dateOfBirth: new Date("1997-05-12"),
      postalCode: "460-0008",
      mobile: "+81-90-4567-8901",
      fax: "+81-52-4567-8902",
      periodOfStayDateStart: new Date("2021-09-15"),
      periodOfStayDateEnd: new Date("2031-09-14"),
      qualificationsAndLicenses:
        "Adobe認定エキスパート、UXデザイン検定、色彩検定2級",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["名古屋芸術大学", "愛知県立デザイン専門学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "VOCATIONAL"],
      // Ordered array fields for work history
      workHistoryName: ["フリーランスデザイナー", "株式会社JKLデザイン"],
      workHistoryDateStart: ["2019-04-01", "2020-10-01"],
      workHistoryDateEnd: ["2020-09-30", "2021-09-14"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["名古屋", "名古屋"],
      workHistoryPosition: ["グラフィックデザイナー", "ジュニアUXデザイナー"],
      workHistoryEmploymentType: ["CONTRACT", "FULL_TIME"],
      workHistoryDescription: [
        "ウェブサイトとモバイルアプリのUI設計",
        "ユーザー体験の改善とプロトタイプ作成",
      ],
      // Additional personal fields
      reasonForApplying: "ユーザー中心のデザインでより良い体験を創造したい",
      motivationToComeJapan: "日本出身",
      familySpouse: false,
      familyChildren: 0,
      hobbyAndInterests: "イラスト、カフェ巡り、ヨガ",
      // Emergency contacts
      emergencyContactPrimaryName: "山田健二",
      emergencyContactPrimaryRelationship: "父親",
      emergencyContactPrimaryNumber: "+81-90-6543-2109",
      emergencyContactPrimaryEmail: "yamada.kenji@email.com",
      emergencyContactSecondaryName: "山田恵子",
      emergencyContactSecondaryRelationship: "母親",
      emergencyContactSecondaryNumber: "+81-80-4444-5555",
      emergencyContactSecondaryEmail: "yamada.keiko@email.com",
      remarks: "創造性豊かで、ユーザビリティを重視したデザインが得意。",
    },
  });

  const staff5 = await prisma.staff.create({
    data: {
      employeeId: "C00005",
      name: "高橋健太",
      position: "ソフトウェアエンジニア",
      department: "エンジニアリング部",
      email: "takahashi.kenta@manager-app.com",
      phone: "+81-90-5678-9012",
      address: "神奈川県横浜市西区みなとみらい5-5-5",
      hireDate: new Date("2023-01-10"),
      salary: 70000.0,
      status: "ACTIVE",
      residenceStatus: "NURSING_CARE",
      age: 31,
      nationality: "Japan",
      userInChargeId: regularUser.id,
      companiesId: companies[4].id,
      // New header fields
      photo: s3url("staff-photos/takahashi-kenta.jpg"),
      furiganaName: "タカハシ ケンタ",
      gender: "M",
      // New basic information fields
      dateOfBirth: new Date("1993-09-25"),
      postalCode: "220-0012",
      mobile: "+81-90-5678-9012",
      fax: "+81-45-5678-9013",
      periodOfStayDateStart: new Date("2023-01-10"),
      periodOfStayDateEnd: new Date("2033-01-09"),
      qualificationsAndLicenses:
        "基本情報技術者試験、応用情報技術者試験、AWS認定ソリューションアーキテクト",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["横浜国立大学", "神奈川県立工業高等学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "HIGH_SCHOOL"],
      // Ordered array fields for work history
      workHistoryName: ["株式会社MNOテック", "株式会社PQRシステム"],
      workHistoryDateStart: ["2016-04-01", "2020-07-01"],
      workHistoryDateEnd: ["2020-06-30", "2023-01-09"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["東京", "横浜"],
      workHistoryPosition: ["ソフトウェア開発者", "シニアエンジニア"],
      workHistoryEmploymentType: ["FULL_TIME", "FULL_TIME"],
      workHistoryDescription: [
        "Webアプリケーション開発",
        "クラウドインフラ設計・構築",
      ],
      // Additional personal fields
      reasonForApplying: "最新技術を活用した大規模システム開発に携わりたい",
      motivationToComeJapan: "日本出身",
      familySpouse: true,
      familyChildren: 1,
      hobbyAndInterests: "プログラミング、ロードバイク、音楽鑑賞",
      // Emergency contacts
      emergencyContactPrimaryName: "高橋美香",
      emergencyContactPrimaryRelationship: "配偶者",
      emergencyContactPrimaryNumber: "+81-90-5432-1098",
      emergencyContactPrimaryEmail: "takahashi.mika@email.com",
      emergencyContactSecondaryName: "高橋正雄",
      emergencyContactSecondaryRelationship: "父親",
      emergencyContactSecondaryNumber: "+81-80-5555-6666",
      emergencyContactSecondaryEmail: "takahashi.masao@email.com",
      remarks: "技術力が高く、新しい技術の習得が早い。チームワークも良好。",
    },
  });

  const staff6 = await prisma.staff.create({
    data: {
      employeeId: "C00006",
      name: "渡辺由美",
      position: "人事スペシャリスト",
      department: "人事部",
      email: "watanabe.yumi@manager-app.com",
      phone: "+81-90-6789-0123",
      address: "北海道札幌市中央区すすきの6-6-6",
      hireDate: new Date("2022-11-15"),
      salary: 58000.0,
      status: "ON_LEAVE",
      residenceStatus: "BUSINESS_MANAGEMENT",
      age: 33,
      nationality: "Japan",
      userInChargeId: adminUser.id,
      companiesId: companies[5].id,
      // New header fields
      photo: s3url("staff-photos/watanabe-yumi.jpg"),
      furiganaName: "ワタナベ ユミ",
      gender: "F",
      // New basic information fields
      dateOfBirth: new Date("1991-02-18"),
      postalCode: "064-0804",
      mobile: "+81-90-6789-0123",
      fax: "+81-11-6789-0124",
      periodOfStayDateStart: new Date("2022-11-15"),
      periodOfStayDateEnd: new Date("2032-11-14"),
      qualificationsAndLicenses:
        "社会保険労務士、キャリアコンサルタント、メンタルヘルス・マネジメント検定",
      japaneseProficiency: "母国語",
      japaneseProficiencyRemarks: "日本語ネイティブスピーカー",
      // Ordered array fields for education
      educationName: ["北海道大学", "札幌市立高等学校"],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "HIGH_SCHOOL"],
      // Ordered array fields for work history
      workHistoryName: ["株式会社STU人材", "株式会社VWX総合"],
      workHistoryDateStart: ["2014-04-01", "2019-08-01"],
      workHistoryDateEnd: ["2019-07-31", "2022-11-14"],
      workHistoryCountryLocation: ["日本", "日本"],
      workHistoryCityLocation: ["札幌", "札幌"],
      workHistoryPosition: ["人事担当", "人事主任"],
      workHistoryEmploymentType: ["FULL_TIME", "FULL_TIME"],
      workHistoryDescription: ["採用業務と労務管理", "人事制度の企画・運用"],
      // Additional personal fields
      reasonForApplying:
        "人事のプロフェッショナルとしてより幅広い経験を積みたい",
      motivationToComeJapan: "日本出身",
      familySpouse: true,
      familyChildren: 1,
      hobbyAndInterests: "読書、スキー、温泉巡り",
      // Emergency contacts
      emergencyContactPrimaryName: "渡辺大輔",
      emergencyContactPrimaryRelationship: "配偶者",
      emergencyContactPrimaryNumber: "+81-90-4321-0987",
      emergencyContactPrimaryEmail: "watanabe.daisuke@email.com",
      emergencyContactSecondaryName: "渡辺信子",
      emergencyContactSecondaryRelationship: "母親",
      emergencyContactSecondaryNumber: "+81-80-6666-7777",
      emergencyContactSecondaryEmail: "watanabe.nobuko@email.com",
      remarks:
        "人事業務に精通しており、従業員のサポートに熱心。現在育児休暇中。",
    },
  });

  const staff7 = await prisma.staff.create({
    data: {
      employeeId: "C00007",
      name: "中村雄太",
      position: "営業担当",
      department: "営業部",
      email: "nakamura.yuta@manager-app.com",
      phone: "+81-90-7890-1234",
      address: "福岡県福岡市中央区天神7-7-7",
      hireDate: new Date("2023-05-20"),
      salary: 52000.0,
      status: "ACTIVE",
      residenceStatus: "ARTIST",
      age: 26,
      nationality: "Japan",
      userInChargeId: managerUser.id,
      companiesId: companies[6].id,
    },
  });

  const staff8 = await prisma.staff.create({
    data: {
      employeeId: "C00008",
      name: "小林真理",
      position: "教育コーディネーター",
      department: "教育部",
      email: "kobayashi.mari@manager-app.com",
      phone: "+81-90-8901-2345",
      address: "宮城県仙台市青葉区青葉8-8-8",
      hireDate: new Date("2022-08-01"),
      salary: 55000.0,
      status: "ACTIVE",
      residenceStatus: "PROFESSOR",
      age: 30,
      nationality: "Japan",
      userInChargeId: regularUser.id,
      companiesId: companies[7].id,
    },
  });

  const staff9 = await prisma.staff.create({
    data: {
      employeeId: "C00009",
      name: "伊藤慎一",
      position: "エネルギーアナリスト",
      department: "技術部",
      email: "ito.shinichi@manager-app.com",
      phone: "+81-90-9012-3456",
      address: "広島県広島市中区本通9-9-9",
      hireDate: new Date("2021-12-01"),
      salary: 68000.0,
      status: "TERMINATED",
      residenceStatus: "TEACHER",
      age: 38,
      nationality: "Japan",
      userInChargeId: adminUser.id,
      companiesId: companies[8].id,
    },
  });

  const staff10 = await prisma.staff.create({
    data: {
      employeeId: "C00010",
      name: "松本涼子",
      position: "海運オペレーター",
      department: "運輸部",
      email: "matsumoto.ryoko@manager-app.com",
      phone: "+81-90-0123-4567",
      address: "兵庫県神戸市中央区ハーバーランド10-10-10",
      hireDate: new Date("2020-10-15"),
      salary: 62000.0,
      status: "INACTIVE",
      residenceStatus: "STUDENT",
      age: 34,
      nationality: "Japan",
      userInChargeId: managerUser.id,
      companiesId: companies[9].id,
    },
  });

  // English staff (reduced to half - 3 staff members)
  const staff11 = await prisma.staff.create({
    data: {
      employeeId: "C00011",
      name: "John Smith",
      position: "Senior Manager",
      department: "Administration",
      email: "john.smith@manager-app.com",
      phone: "+1-555-0123",
      address: "123 Main St, Tokyo, Japan",
      hireDate: new Date("2023-01-15"),
      salary: 85000.0,
      status: "ACTIVE",
      residenceStatus: "LEGAL_ACCOUNTING_SERVICES",
      age: 35,
      nationality: "United States",
      userInChargeId: adminUser.id,
      companiesId: companies[12].id,
      // New header fields
      photo: s3url("staff-photos/john-smith.jpg"),
      furiganaName: "ジョン スミス",
      gender: "M",
      // New basic information fields
      dateOfBirth: new Date("1989-04-10"),
      postalCode: "150-0001",
      mobile: "+1-555-0123",
      fax: "+81-3-5555-0124",
      periodOfStayDateStart: new Date("2023-01-15"),
      periodOfStayDateEnd: new Date("2028-01-14"),
      qualificationsAndLicenses: "MBA, PMP Certification, Six Sigma Black Belt",
      japaneseProficiency: "Business Level",
      japaneseProficiencyRemarks:
        "JLPT N2 certified, can conduct meetings in Japanese",
      // Ordered array fields for education
      educationName: [
        "Harvard Business School",
        "University of California Berkeley",
      ],
      educationType: ["UNIVERSITY_POSTGRADUATE", "UNIVERSITY_UNDERGRADUATE"],
      // Ordered array fields for work history
      workHistoryName: ["McKinsey & Company", "Goldman Sachs"],
      workHistoryDateStart: ["2015-06-01", "2020-03-01"],
      workHistoryDateEnd: ["2020-02-29", "2023-01-14"],
      workHistoryCountryLocation: ["United States", "United States"],
      workHistoryCityLocation: ["New York", "San Francisco"],
      workHistoryPosition: ["Management Consultant", "Senior Analyst"],
      workHistoryEmploymentType: ["FULL_TIME", "FULL_TIME"],
      workHistoryDescription: [
        "Strategic consulting for Fortune 500 companies",
        "Financial analysis and investment banking",
      ],
      // Additional personal fields
      reasonForApplying:
        "Seeking international experience and contributing to Japanese business growth",
      motivationToComeJapan:
        "Fascinated by Japanese business culture and technology innovation",
      familySpouse: true,
      familyChildren: 2,
      hobbyAndInterests: "Golf, Japanese language study, photography",
      // Emergency contacts
      emergencyContactPrimaryName: "Sarah Smith",
      emergencyContactPrimaryRelationship: "Spouse",
      emergencyContactPrimaryNumber: "+1-555-0199",
      emergencyContactPrimaryEmail: "sarah.smith@email.com",
      emergencyContactSecondaryName: "Robert Smith",
      emergencyContactSecondaryRelationship: "Father",
      emergencyContactSecondaryNumber: "+1-555-0188",
      emergencyContactSecondaryEmail: "robert.smith@email.com",
      remarks:
        "Strong leadership skills with international business experience. Fluent in English and conversational Japanese.",
    },
  });

  const staff12 = await prisma.staff.create({
    data: {
      employeeId: "C00012",
      name: "Maria Garcia",
      position: "Marketing Specialist",
      department: "Marketing",
      email: "maria.garcia@manager-app.com",
      phone: "+34-600-123-456",
      address: "789 International Ave, Tokyo, Japan",
      hireDate: new Date("2022-06-01"),
      salary: 55000.0,
      status: "ACTIVE",
      residenceStatus: "PERMANENT_RESIDENT",
      age: 28,
      nationality: "Spain",
      userInChargeId: adminUser.id,
      companiesId: companies[13].id,
      // New header fields
      photo: s3url("staff-photos/maria-garcia.jpg"),
      furiganaName: "マリア ガルシア",
      gender: "F",
      // New basic information fields
      dateOfBirth: new Date("1996-08-14"),
      postalCode: "106-0032",
      mobile: "+34-600-123-456",
      fax: "+81-3-6000-1234",
      periodOfStayDateStart: new Date("2022-06-01"),
      periodOfStayDateEnd: new Date("2025-05-31"),
      qualificationsAndLicenses:
        "Google Ads Certification, Facebook Marketing Certification, DELE B2",
      japaneseProficiency: "Intermediate",
      japaneseProficiencyRemarks:
        "JLPT N3 certified, actively studying to improve",
      // Ordered array fields for education
      educationName: [
        "Universidad Complutense Madrid",
        "Instituto de Marketing Digital",
      ],
      educationType: ["UNIVERSITY_UNDERGRADUATE", "VOCATIONAL"],
      // Ordered array fields for work history
      workHistoryName: ["Agencia Creativa Barcelona", "Freelance Marketing"],
      workHistoryDateStart: ["2019-09-01", "2021-01-01"],
      workHistoryDateEnd: ["2020-12-31", "2022-05-31"],
      workHistoryCountryLocation: ["Spain", "Spain"],
      workHistoryCityLocation: ["Barcelona", "Madrid"],
      workHistoryPosition: [
        "Junior Marketing Assistant",
        "Digital Marketing Consultant",
      ],
      workHistoryEmploymentType: ["FULL_TIME", "CONTRACT"],
      workHistoryDescription: [
        "Social media management and content creation",
        "Digital marketing campaigns for small businesses",
      ],
      // Additional personal fields
      reasonForApplying:
        "Interested in Japanese market and expanding international marketing experience",
      motivationToComeJapan:
        "Attracted to Japanese culture and business innovation",
      familySpouse: false,
      familyChildren: 0,
      hobbyAndInterests: "Travel, language learning, cooking",
      // Emergency contacts
      emergencyContactPrimaryName: "Carmen Garcia",
      emergencyContactPrimaryRelationship: "Mother",
      emergencyContactPrimaryNumber: "+34-600-987-654",
      emergencyContactPrimaryEmail: "carmen.garcia@email.com",
      emergencyContactSecondaryName: "Luis Garcia",
      emergencyContactSecondaryRelationship: "Father",
      emergencyContactSecondaryNumber: "+34-600-876-543",
      emergencyContactSecondaryEmail: "luis.garcia@email.com",
      remarks:
        "Enthusiastic about digital marketing with strong creative skills. Adapting well to Japanese work culture.",
    },
  });

  const staff13 = await prisma.staff.create({
    data: {
      employeeId: "C00013",
      name: "Jennifer Brown",
      position: "Business Consultant",
      department: "Consulting",
      email: "jennifer.brown@manager-app.com",
      phone: "+1-555-0199",
      address: "987 Global Ave, Tokyo, Japan",
      hireDate: new Date("2022-11-15"),
      salary: 78000.0,
      status: "ACTIVE",
      residenceStatus: "SPOUSE_OF_PERMANENT_RESIDENT",
      age: 33,
      nationality: "Canada",
      userInChargeId: managerUser.id,
      companiesId: companies[14].id,
      // New header fields
      photo: s3url("staff-photos/jennifer-brown.jpg"),
      furiganaName: "ジェニファー ブラウン",
      gender: "F",
      // New basic information fields
      dateOfBirth: new Date("1991-12-03"),
      postalCode: "107-0052",
      mobile: "+1-555-0199",
      fax: "+81-3-7000-1999",
      periodOfStayDateStart: new Date("2022-11-15"),
      periodOfStayDateEnd: new Date("2027-11-14"),
      qualificationsAndLicenses:
        "CPA, MBA, Project Management Professional (PMP)",
      japaneseProficiency: "Advanced",
      japaneseProficiencyRemarks:
        "JLPT N1 certified, can conduct business negotiations in Japanese",
      // Ordered array fields for education
      educationName: ["University of Toronto", "York University"],
      educationType: ["UNIVERSITY_POSTGRADUATE", "UNIVERSITY_UNDERGRADUATE"],
      // Ordered array fields for work history
      workHistoryName: ["Deloitte Consulting", "KPMG Canada"],
      workHistoryDateStart: ["2016-09-01", "2020-01-01"],
      workHistoryDateEnd: ["2019-12-31", "2022-11-14"],
      workHistoryCountryLocation: ["Canada", "Canada"],
      workHistoryCityLocation: ["Toronto", "Vancouver"],
      workHistoryPosition: ["Senior Consultant", "Manager"],
      workHistoryEmploymentType: ["FULL_TIME", "FULL_TIME"],
      workHistoryDescription: [
        "Business process optimization and strategy consulting",
        "Financial advisory and risk management",
      ],
      // Additional personal fields
      reasonForApplying:
        "Seeking to apply international consulting experience in Japanese market",
      motivationToComeJapan:
        "Married to Japanese national, interested in long-term career in Japan",
      familySpouse: true,
      familyChildren: 1,
      hobbyAndInterests: "Yoga, hiking, Japanese tea ceremony",
      // Emergency contacts
      emergencyContactPrimaryName: "Hiroshi Tanaka",
      emergencyContactPrimaryRelationship: "Spouse",
      emergencyContactPrimaryNumber: "+81-90-1111-2222",
      emergencyContactPrimaryEmail: "hiroshi.tanaka@email.com",
      emergencyContactSecondaryName: "Margaret Brown",
      emergencyContactSecondaryRelationship: "Mother",
      emergencyContactSecondaryNumber: "+1-416-555-0123",
      emergencyContactSecondaryEmail: "margaret.brown@email.com",
      remarks:
        "Highly experienced consultant with excellent Japanese language skills. Strong cultural adaptation abilities.",
    },
  });

  // 5. Create Properties (with all new enhanced fields)
  console.log("🏢 Creating properties...");

  // Japanese properties (majority)
  const property1 = await prisma.property.create({
    data: {
      propertyCode: "PROP001",
      name: "東京都心オフィスビル",
      address: "東京都千代田区丸の内1-1-1",
      propertyType: "COMMERCIAL",
      managerId: managerUser.id,
      status: "ACTIVE",
      description: "東京ビジネス地区の中心部にある近代的なオフィスビル",
      contractDate: new Date("2023-03-15"),
      // New header fields
      photo: s3url("property-photos/tokyo-office-building.jpg"),
      furiganaName: "トウキョウトシンオフィスビル",
      establishmentDate: new Date("2020-04-01"),
      // New property information fields
      postalCode: "100-0005",
      country: "日本",
      region: "関東",
      prefecture: "東京都",
      city: "千代田区",
      owner: "東京不動産株式会社",
      ownerPhone: "03-1234-5678",
      ownerEmail: "info@tokyo-realestate.co.jp",
      ownerFax: "03-1234-5679",
    },
  });

  const property2 = await prisma.property.create({
    data: {
      propertyCode: "PROP002",
      name: "大阪住宅マンション",
      address: "大阪府大阪市住吉区住宅街2-2-2",
      propertyType: "RESIDENTIAL",
      managerId: managerUser.id,
      status: "ACTIVE",
      description: "近代的な設備を備えたファミリー向けマンション",
      contractDate: new Date("2022-08-20"),
      // New header fields
      photo: s3url("property-photos/osaka-residential-mansion.jpg"),
      furiganaName: "オオサカジュウタクマンション",
      establishmentDate: new Date("2019-09-15"),
      // New property information fields
      postalCode: "558-0033",
      country: "日本",
      region: "関西",
      prefecture: "大阪府",
      city: "大阪市",
      owner: "関西住宅開発株式会社",
      ownerPhone: "06-9876-5432",
      ownerEmail: "contact@kansai-housing.co.jp",
      ownerFax: "06-9876-5433",
    },
  });

  const property3 = await prisma.property.create({
    data: {
      propertyCode: "PROP003",
      name: "横浜工業倉庫",
      address: "神奈川県横浜市工業地帯3-3-3",
      propertyType: "INDUSTRIAL",
      managerId: adminUser.id,
      status: "INACTIVE",
      description: "保管・配送用の大型倉庫施設",
      contractDate: new Date("2021-11-10"),
      // New header fields
      photo: s3url("property-photos/yokohama-industrial-warehouse.jpg"),
      furiganaName: "ヨコハマコウギョウソウコ",
      establishmentDate: new Date("2018-03-20"),
      // New property information fields
      postalCode: "230-0053",
      country: "日本",
      region: "関東",
      prefecture: "神奈川県",
      city: "横浜市",
      owner: "横浜物流株式会社",
      ownerPhone: "045-1111-2222",
      ownerEmail: "logistics@yokohama-logistics.co.jp",
      ownerFax: "045-1111-2223",
    },
  });

  const property4 = await prisma.property.create({
    data: {
      propertyCode: "PROP004",
      name: "京都ショッピングセンター",
      address: "京都府京都市商業地区4-4-4",
      propertyType: "MIXED_USE",
      managerId: managerUser.id,
      status: "ACTIVE",
      description: "小売店と飲食店を備えた多層階ショッピングセンター",
      contractDate: new Date("2024-01-05"),
      // New header fields
      photo: s3url("property-photos/kyoto-shopping-center.jpg"),
      furiganaName: "キョウトショッピングセンター",
      establishmentDate: new Date("2021-11-30"),
      // New property information fields
      postalCode: "604-8005",
      country: "日本",
      region: "関西",
      prefecture: "京都府",
      city: "京都市",
      owner: "京都商業開発株式会社",
      ownerPhone: "075-3333-4444",
      ownerEmail: "info@kyoto-commercial.co.jp",
      ownerFax: "075-3333-4445",
    },
  });

  const property5 = await prisma.property.create({
    data: {
      propertyCode: "PROP005",
      name: "名古屋ビジネスパーク",
      address: "愛知県名古屋市ビジネス地区5-5-5",
      propertyType: "COMMERCIAL",
      managerId: adminUser.id,
      status: "ACTIVE",
      description: "複数の企業が入居するビジネスパーク",
      contractDate: new Date("2023-07-20"),
      // New header fields
      photo: s3url("property-photos/nagoya-business-park.jpg"),
      furiganaName: "ナゴヤビジネスパーク",
      establishmentDate: new Date("2022-05-15"),
      // New property information fields
      postalCode: "460-0008",
      country: "日本",
      region: "中部",
      prefecture: "愛知県",
      city: "名古屋市",
      owner: "中部ビジネス開発株式会社",
      ownerPhone: "052-5555-6666",
      ownerEmail: "business@chubu-development.co.jp",
      ownerFax: "052-5555-6667",
    },
  });

  const property6 = await prisma.property.create({
    data: {
      propertyCode: "PROP006",
      name: "福岡住宅団地",
      address: "福岡県福岡市住宅地区6-6-6",
      propertyType: "RESIDENTIAL",
      managerId: managerUser.id,
      status: "ACTIVE",
      description: "緑豊かな環境の住宅団地",
      contractDate: new Date("2023-12-01"),
      // New header fields
      photo: s3url("property-photos/fukuoka-residential-complex.jpg"),
      furiganaName: "フクオカジュウタクダンチ",
      establishmentDate: new Date("2020-08-10"),
      // New property information fields
      postalCode: "810-0001",
      country: "日本",
      region: "九州",
      prefecture: "福岡県",
      city: "福岡市",
      owner: "九州住宅株式会社",
      ownerPhone: "092-7777-8888",
      ownerEmail: "housing@kyushu-housing.co.jp",
      ownerFax: "092-7777-8889",
    },
  });

  // English properties (reduced to half - 2 properties)
  const property7 = await prisma.property.create({
    data: {
      propertyCode: "PROP007",
      name: "International Business Tower",
      address: "789 Global District, Minato-ku, Tokyo, Japan",
      propertyType: "COMMERCIAL",
      managerId: adminUser.id,
      status: "ACTIVE",
      description: "High-rise office tower for international businesses",
      contractDate: new Date("2023-09-15"),
      // New header fields
      photo: s3url("property-photos/international-business-tower.jpg"),
      furiganaName: "インターナショナルビジネスタワー",
      establishmentDate: new Date("2021-12-01"),
      // New property information fields
      postalCode: "106-0032",
      country: "Japan",
      region: "Kanto",
      prefecture: "Tokyo",
      city: "Minato-ku",
      owner: "Global Properties International Ltd.",
      ownerPhone: "03-9999-0000",
      ownerEmail: "info@global-properties.com",
      ownerFax: "03-9999-0001",
    },
  });

  const property8 = await prisma.property.create({
    data: {
      propertyCode: "PROP008",
      name: "Modern Residential Complex",
      address: "456 International Ave, Shibuya-ku, Tokyo, Japan",
      propertyType: "RESIDENTIAL",
      managerId: managerUser.id,
      status: "ACTIVE",
      description: "Modern apartment complex with international amenities",
      contractDate: new Date("2024-02-10"),
      // New header fields
      photo: s3url("property-photos/modern-residential-complex.jpg"),
      furiganaName: "モダンレジデンシャルコンプレックス",
      establishmentDate: new Date("2023-06-15"),
      // New property information fields
      postalCode: "150-0002",
      country: "Japan",
      region: "Kanto",
      prefecture: "Tokyo",
      city: "Shibuya-ku",
      owner: "Modern Living Properties Co.",
      ownerPhone: "03-8888-9999",
      ownerEmail: "contact@modern-living.jp",
      ownerFax: "03-8888-9998",
    },
  });

  // 6. Create Property Staff Assignments (with room numbers and rent prices)
  console.log("🔗 Creating property staff assignments...");
  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property1.id,
      staffId: staff1.id,
      room: "A-101",
      startDate: new Date("2023-01-15"),
      isActive: true,
      rentPriceHigh: 85000,
      rentPriceLow: 75000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property2.id,
      staffId: staff2.id,
      room: "B-202",
      startDate: new Date("2023-03-01"),
      isActive: true,
      rentPriceHigh: 95000,
      rentPriceLow: 85000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property4.id,
      staffId: staff3.id,
      room: "C-301",
      startDate: new Date("2022-06-01"),
      isActive: true,
      rentPriceHigh: 120000,
      rentPriceLow: 110000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property5.id,
      staffId: staff4.id,
      room: "D-105",
      startDate: new Date("2023-08-01"),
      isActive: true,
      rentPriceHigh: 78000,
      rentPriceLow: 68000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property6.id,
      staffId: staff5.id,
      room: "E-203",
      startDate: new Date("2024-01-01"),
      isActive: true,
      rentPriceHigh: 65000,
      rentPriceLow: 55000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property7.id,
      staffId: staff11.id,
      room: "F-1501",
      startDate: new Date("2023-09-15"),
      isActive: true,
      rentPriceHigh: 150000,
      rentPriceLow: 140000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property8.id,
      staffId: staff12.id,
      room: "G-804",
      startDate: new Date("2024-02-10"),
      isActive: true,
      rentPriceHigh: 110000,
      rentPriceLow: 100000,
    },
  });

  await prisma.propertyStaffAssignment.create({
    data: {
      propertyId: property3.id,
      staffId: staff13.id,
      room: "H-001",
      startDate: new Date("2023-11-01"),
      endDate: new Date("2024-10-31"),
      isActive: false,
      rentPriceHigh: 45000,
      rentPriceLow: 40000,
    },
  });

  // 7. Create System Configurations
  console.log("⚙️ Creating system configurations...");
  await prisma.systemConfiguration.createMany({
    data: [
      {
        key: "app.name",
        value: "Crew System",
        description: "Application name",
        category: "General",
        dataType: "STRING",
        createdBy: adminUser.id,
      },
      {
        key: "app.version",
        value: "1.0.0",
        description: "Application version",
        category: "General",
        dataType: "STRING",
        createdBy: adminUser.id,
      },
      {
        key: "attendance.work_hours_per_day",
        value: "8",
        description: "Standard work hours per day",
        category: "Attendance",
        dataType: "NUMBER",
        createdBy: adminUser.id,
      },
      {
        key: "notifications.email_enabled",
        value: "true",
        description: "Enable email notifications",
        category: "Notifications",
        dataType: "BOOLEAN",
        createdBy: adminUser.id,
      },
      {
        key: "ui.theme",
        value: "light",
        description: "Default UI theme",
        category: "UI",
        dataType: "STRING",
        createdBy: adminUser.id,
      },
      {
        key: "ui.theme.available",
        value: JSON.stringify([
          {
            id: "light-beige",
            name: "Light Beige",
            description: "Warm beige theme with soft tones",
            isDefault: true,
            isActive: true,
          },
          {
            id: "light-blue",
            name: "Light Blue",
            description:
              "Modern blue theme inspired by contemporary web design",
            isDefault: false,
            isActive: true,
          },
        ]),
        description: "Available theme configurations with metadata",
        category: "UI",
        dataType: "JSON",
        createdBy: adminUser.id,
      },
    ],
  });

  // 8. Create Attendance Records
  console.log("📅 Creating attendance records...");
  const attendanceData = [
    {
      staffId: staff1.id,
      date: new Date("2024-01-15"),
      checkInTime: new Date("2024-01-15T09:00:00"),
      checkOutTime: new Date("2024-01-15T18:00:00"),
      status: "PRESENT" as const,
      hoursWorked: 8.0,
      createdBy: "admin",
    },
    {
      staffId: staff1.id,
      date: new Date("2024-01-16"),
      checkInTime: new Date("2024-01-16T09:15:00"),
      checkOutTime: new Date("2024-01-16T18:00:00"),
      status: "LATE" as const,
      hoursWorked: 7.75,
      notes: "Traffic delay",
      createdBy: "admin",
    },
    {
      staffId: staff2.id,
      date: new Date("2024-01-15"),
      checkInTime: new Date("2024-01-15T08:45:00"),
      checkOutTime: new Date("2024-01-15T17:45:00"),
      status: "PRESENT" as const,
      hoursWorked: 8.0,
      createdBy: "admin",
    },
    {
      staffId: staff2.id,
      date: new Date("2024-01-16"),
      status: "SICK" as const,
      notes: "Called in sick with flu",
      createdBy: "admin",
    },
    {
      staffId: staff3.id,
      date: new Date("2024-01-15"),
      checkInTime: new Date("2024-01-15T09:00:00"),
      checkOutTime: new Date("2024-01-15T13:00:00"),
      status: "HALF_DAY" as const,
      hoursWorked: 4.0,
      notes: "Doctor appointment in afternoon",
      createdBy: "admin",
    },
    {
      staffId: staff4.id,
      date: new Date("2024-01-15"),
      status: "VACATION" as const,
      notes: "Planned vacation day",
      createdBy: "admin",
    },
  ];

  await prisma.attendanceRecord.createMany({
    data: attendanceData,
  });

  // 9. Create Interaction Records (with person_concerned values and new fields)
  console.log("💬 Creating interaction records...");
  const interactionData = [
    // Japanese interaction records (majority)
    {
      type: "DISCUSSION" as const,
      date: new Date("2024-01-15"),
      description: "チームリーダーとの日次チェックインミーティング",
      status: "RESOLVED" as const,
      createdBy: adminUser.id,
      name: "田中太郎",
      title: "チーム調整会議",
      personInvolvedStaffId: staff1.id,
      userInChargeId: adminUser.id,
      personConcerned: "山田健二",
      companiesId: companies[0].id,
      location: "東京オフィス 会議室A",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "チーム目標の進捗確認を行い、来週のスケジュール調整を完了。全メンバーのタスク状況を把握し、必要なサポートを提供することを確認。",
    },
    {
      type: "INTERVIEW" as const,
      date: new Date("2024-01-16"),
      description: "ポジション評価のための初回面接",
      status: "IN_PROGRESS" as const,
      createdBy: managerUser.id,
      name: "佐藤花子",
      title: "技術職位評価面接",
      personInvolvedStaffId: staff2.id,
      userInChargeId: managerUser.id,
      personConcerned: "鈴木一郎",
      companiesId: companies[1].id,
      location: "人事部面接室",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "技術スキルの評価を実施。プログラミング能力と問題解決スキルについて詳細な質疑応答を行った。次回は実技テストを予定。",
    },
    {
      type: "CONSULTATION" as const,
      date: new Date("2024-01-17"),
      description: "キャリア開発相談セッション",
      status: "OPEN" as const,
      createdBy: adminUser.id,
      name: "鈴木一郎",
      title: "専門成長計画",
      personInvolvedStaffId: staff3.id,
      userInChargeId: adminUser.id,
      personConcerned: "田中美咲",
      companiesId: companies[2].id,
      location: "オンライン会議",
      means: "ONLINE" as const,
      responseDetails:
        "キャリア目標の設定と必要なスキル開発について議論。研修プログラムの選択肢を提示し、個人の興味と会社のニーズを調整中。",
    },
    {
      type: "OTHER" as const,
      date: new Date("2024-01-18"),
      description: "職場環境に関する懸念事項",
      status: "IN_PROGRESS" as const,
      createdBy: managerUser.id,
      name: "山田美咲",
      title: "環境安全に関する懸念",
      personInvolvedStaffId: staff4.id,
      userInChargeId: managerUser.id,
      personConcerned: "高橋健太",
      companiesId: companies[3].id,
      location: "電話相談",
      means: "PHONE" as const,
      responseDetails:
        "職場の騒音レベルと空調システムについての苦情を受理。設備管理チームと連携して改善策を検討中。来週までに対応計画を提示予定。",
    },
    {
      type: "INTERVIEW" as const,
      date: new Date("2024-01-19"),
      description: "昇進のための技術スキル評価",
      status: "OPEN" as const,
      createdBy: adminUser.id,
      name: "高橋健太",
      title: "昇進評価面接",
      personInvolvedStaffId: staff5.id,
      userInChargeId: adminUser.id,
      personConcerned: "渡辺由美",
      location: "大阪支社 会議室B",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "リーダーシップスキルとプロジェクト管理能力について評価。過去の実績と将来のビジョンについて詳細な討議を実施。",
    },
    {
      type: "CONSULTATION" as const,
      date: new Date("2024-01-20"),
      description: "休職後の職場復帰相談",
      status: "RESOLVED" as const,
      createdBy: managerUser.id,
      name: "渡辺由美",
      title: "休職後復帰統合",
      personInvolvedStaffId: staff6.id,
      userInChargeId: managerUser.id,
      personConcerned: "中村雄太",
      location: "メール相談",
      means: "EMAIL" as const,
      responseDetails:
        "段階的な業務復帰計画を策定。最初の2週間は半日勤務から開始し、徐々にフルタイムに移行する計画で合意。必要なサポート体制も整備完了。",
    },
    {
      type: "DISCUSSION" as const,
      date: new Date("2024-01-21"),
      description: "営業チームとの定期ミーティング",
      status: "RESOLVED" as const,
      createdBy: adminUser.id,
      name: "中村雄太",
      title: "営業進捗確認会議",
      personInvolvedStaffId: staff7.id,
      userInChargeId: adminUser.id,
      personConcerned: "小林真理",
      location: "営業部会議室",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "月次売上目標の達成状況を確認。新規顧客開拓の進捗と既存顧客のフォローアップ状況について報告を受けた。来月の戦略調整を実施。",
    },
    {
      type: "INTERVIEW" as const,
      date: new Date("2024-01-22"),
      description: "教育プログラム評価面接",
      status: "IN_PROGRESS" as const,
      createdBy: managerUser.id,
      name: "小林真理",
      title: "教育効果評価",
      personInvolvedStaffId: staff8.id,
      userInChargeId: managerUser.id,
      personConcerned: "伊藤慎一",
      location: "オンライン面接",
      means: "ONLINE" as const,
      responseDetails:
        "研修プログラムの効果測定と参加者のフィードバック収集。カリキュラムの改善点を特定し、次期プログラムへの反映を検討中。",
    },
    {
      type: "CONSULTATION" as const,
      date: new Date("2024-01-23"),
      description: "退職手続きに関する相談",
      status: "RESOLVED" as const,
      createdBy: adminUser.id,
      name: "伊藤慎一",
      title: "退職手続き相談",
      personInvolvedStaffId: staff9.id,
      userInChargeId: adminUser.id,
      personConcerned: "松本涼子",
      location: "人事部相談室",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "退職に伴う各種手続きについて説明。有給休暇の消化、退職金の計算、引き継ぎスケジュールについて詳細を確認し、円滑な退職プロセスを確保。",
    },
    {
      type: "OTHER" as const,
      date: new Date("2024-01-24"),
      description: "運輸業務の安全性に関する苦情",
      status: "OPEN" as const,
      createdBy: managerUser.id,
      name: "松本涼子",
      title: "運輸安全性懸念",
      personInvolvedStaffId: staff10.id,
      userInChargeId: managerUser.id,
      personConcerned: "田中太郎",
      location: "電話相談",
      means: "PHONE" as const,
      responseDetails:
        "運輸車両の安全点検頻度と運転手の労働時間管理について懸念を表明。安全管理部門と連携して現状調査を開始。改善計画の策定を進行中。",
    },
    // English interaction records (reduced to half - 3 records)
    {
      type: "DISCUSSION" as const,
      date: new Date("2024-01-25"),
      description: "Daily standup meeting with international team",
      status: "RESOLVED" as const,
      createdBy: adminUser.id,
      name: "John Smith",
      title: "International Team Coordination",
      personInvolvedStaffId: staff11.id,
      userInChargeId: adminUser.id,
      personConcerned: "Wilson Robert",
      location: "International Conference Room",
      means: "FACE_TO_FACE" as const,
      responseDetails:
        "Reviewed project milestones and resource allocation across international offices. Addressed timezone coordination challenges and established new communication protocols for better collaboration.",
    },
    {
      type: "INTERVIEW" as const,
      date: new Date("2024-01-26"),
      description: "Marketing strategy assessment interview",
      status: "IN_PROGRESS" as const,
      createdBy: managerUser.id,
      name: "Maria Garcia",
      title: "Marketing Strategy Review",
      personInvolvedStaffId: staff12.id,
      userInChargeId: managerUser.id,
      personConcerned: "Thompson Sarah",
      location: "Video Conference",
      means: "ONLINE" as const,
      responseDetails:
        "Evaluated current marketing campaigns and ROI metrics. Discussed expansion into new market segments and digital marketing strategies. Follow-up meeting scheduled to finalize recommendations.",
    },
    {
      type: "CONSULTATION" as const,
      date: new Date("2024-01-27"),
      description: "Business expansion consultation session",
      status: "OPEN" as const,
      createdBy: adminUser.id,
      name: "Jennifer Brown",
      title: "Business Growth Planning",
      personInvolvedStaffId: staff13.id,
      userInChargeId: adminUser.id,
      personConcerned: "Anderson Michael",
      location: "Email Consultation",
      means: "EMAIL" as const,
      responseDetails:
        "Provided strategic guidance on market entry strategies for Asian markets. Shared market research data and regulatory compliance requirements. Awaiting client feedback on proposed expansion timeline.",
    },
  ];

  await prisma.interactionRecord.createMany({
    data: interactionData,
  });

  // 10. Create Documents (with staff_id foreign key relationships)
  console.log("📄 Creating documents...");
  const documentData = [
    // Staff-related documents with staff_id foreign key
    {
      title: "Employment Contract - 田中太郎",
      type: "STAFF" as const,
      relatedEntityId: staff1.id.toString(),
      filePath: "documents/employment-tanaka-taro.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2020-04-01"),
      endDate: new Date("2025-03-31"),
      staffId: staff1.id,
    },
    {
      title: "Work Visa Application - 佐藤花子",
      type: "STAFF" as const,
      relatedEntityId: staff2.id.toString(),
      filePath: "documents/visa-sato-hanako.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2021-06-15"),
      endDate: new Date("2024-06-14"),
      staffId: staff2.id,
    },
    {
      title: "Training Certificate - 鈴木一郎",
      type: "STAFF" as const,
      relatedEntityId: staff3.id.toString(),
      filePath: "documents/training-suzuki-ichiro.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2022-03-01"),
      endDate: new Date("2025-02-28"),
      staffId: staff3.id,
    },
    {
      title: "Performance Review - 山田美咲",
      type: "STAFF" as const,
      relatedEntityId: staff4.id.toString(),
      filePath: "documents/review-yamada-misaki.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-09-15"),
      endDate: new Date("2024-09-14"),
      staffId: staff4.id,
    },
    {
      title: "Technical Certification - 高橋健太",
      type: "STAFF" as const,
      relatedEntityId: staff5.id.toString(),
      filePath: "documents/cert-takahashi-kenta.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-01-10"),
      endDate: new Date("2026-01-09"),
      staffId: staff5.id,
    },
    {
      title: "Maternity Leave Documentation - 渡辺由美",
      type: "STAFF" as const,
      relatedEntityId: staff6.id.toString(),
      filePath: "documents/leave-watanabe-yumi.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      staffId: staff6.id,
    },
    {
      title: "Work Permit - John Smith",
      type: "STAFF" as const,
      relatedEntityId: staff11.id.toString(),
      filePath: "documents/permit-john-smith.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-01-15"),
      endDate: new Date("2028-01-14"),
      staffId: staff11.id,
    },
    {
      title: "Language Proficiency Certificate - Maria Garcia",
      type: "STAFF" as const,
      relatedEntityId: staff12.id.toString(),
      filePath: "documents/language-maria-garcia.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2022-06-01"),
      endDate: new Date("2025-05-31"),
      staffId: staff12.id,
    },
    {
      title: "Spouse Visa Documentation - Jennifer Brown",
      type: "STAFF" as const,
      relatedEntityId: staff13.id.toString(),
      filePath: "documents/spouse-visa-jennifer-brown.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2022-11-15"),
      endDate: new Date("2027-11-14"),
      staffId: staff13.id,
    },
    // Property-related documents (without staff_id)
    {
      title: "Property Lease Agreement - Downtown Office",
      type: "PROPERTY" as const,
      relatedEntityId: property1.id.toString(),
      filePath: "documents/lease-downtown-office.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2025-05-31"),
    },
    {
      title: "Building Maintenance Contract",
      type: "PROPERTY" as const,
      relatedEntityId: property2.id.toString(),
      filePath: "documents/maintenance-contract.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
    // Company-related documents (with companies_id foreign key)
    {
      title: "Business Partnership Agreement - 株式会社東京システム開発",
      type: "COMPANY" as const,
      relatedEntityId: companies[0].id.toString(),
      filePath: "documents/partnership-tokyo-system-dev.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      companiesId: companies[0].id,
    },
    {
      title: "Manufacturing Contract - 大阪製造株式会社",
      type: "COMPANY" as const,
      relatedEntityId: companies[1].id.toString(),
      filePath: "documents/manufacturing-contract-osaka.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-02-15"),
      endDate: new Date("2026-02-14"),
      companiesId: companies[1].id,
    },
    {
      title: "Medical System License - 京都医療システム株式会社",
      type: "COMPANY" as const,
      relatedEntityId: companies[2].id.toString(),
      filePath: "documents/medical-license-kyoto.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-12-01"),
      endDate: new Date("2025-11-30"),
      companiesId: companies[2].id,
    },
    {
      title: "Service Level Agreement - Tokyo Tech Solutions",
      type: "COMPANY" as const,
      relatedEntityId: companies[12].id.toString(),
      filePath: "documents/sla-tokyo-tech-solutions.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-02-28"),
      companiesId: companies[12].id,
    },
    {
      title: "Consulting Agreement - International Business Corp",
      type: "COMPANY" as const,
      relatedEntityId: companies[14].id.toString(),
      filePath: "documents/consulting-intl-business.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-12-31"),
      companiesId: companies[14].id,
    },
    // Expired/terminated documents
    {
      title: "Expired Training Certificate - Legacy Staff",
      type: "STAFF" as const,
      relatedEntityId: "staff-legacy-1",
      filePath: "documents/expired-training-legacy.pdf",
      status: "EXPIRED" as const,
      startDate: new Date("2022-01-01"),
      endDate: new Date("2023-12-31"),
    },
    {
      title: "Terminated Contract - Former Employee",
      type: "STAFF" as const,
      relatedEntityId: "staff-legacy-2",
      filePath: "documents/terminated-contract.pdf",
      status: "TERMINATED" as const,
      startDate: new Date("2021-06-01"),
      endDate: new Date("2023-05-31"),
    },
    // Property-related documents (linked to properties)
    {
      title: "Property Lease Agreement - 東京都心オフィスビル",
      type: "PROPERTY" as const,
      relatedEntityId: property1.id.toString(),
      filePath: "documents/lease-agreement-prop001.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-03-15"),
      endDate: new Date("2028-03-14"),
      propertyId: property1.id,
    },
    {
      title: "Property Insurance Policy - 大阪住宅マンション",
      type: "PROPERTY" as const,
      relatedEntityId: property2.id.toString(),
      filePath: "documents/insurance-policy-prop002.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2022-08-20"),
      endDate: new Date("2025-08-19"),
      propertyId: property2.id,
    },
    {
      title: "Property Maintenance Contract - 京都ショッピングセンター",
      type: "PROPERTY" as const,
      relatedEntityId: property4.id.toString(),
      filePath: "documents/maintenance-contract-prop004.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2024-12-31"),
      propertyId: property4.id,
    },
    {
      title: "Building Permit - 横浜工業倉庫",
      type: "PROPERTY" as const,
      relatedEntityId: property3.id.toString(),
      filePath: "documents/building-permit-prop003.pdf",
      status: "EXPIRED" as const,
      startDate: new Date("2018-03-20"),
      endDate: new Date("2023-03-19"),
      propertyId: property3.id,
    },
    {
      title: "Commercial Lease Agreement - 名古屋ビジネスパーク",
      type: "PROPERTY" as const,
      relatedEntityId: property5.id.toString(),
      filePath: "documents/commercial-lease-prop005.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-07-20"),
      endDate: new Date("2028-07-19"),
      propertyId: property5.id,
    },
    {
      title: "Residential Complex License - 福岡住宅団地",
      type: "PROPERTY" as const,
      relatedEntityId: property6.id.toString(),
      filePath: "documents/residential-license-prop006.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2020-08-10"),
      endDate: new Date("2025-08-09"),
      propertyId: property6.id,
    },
    {
      title: "International Business License - International Business Tower",
      type: "PROPERTY" as const,
      relatedEntityId: property7.id.toString(),
      filePath: "documents/business-license-prop007.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2021-12-01"),
      endDate: new Date("2026-11-30"),
      propertyId: property7.id,
    },
    {
      title: "Residential Complex Agreement - Modern Residential Complex",
      type: "PROPERTY" as const,
      relatedEntityId: property8.id.toString(),
      filePath: "documents/residential-agreement-prop008.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-02-10"),
      endDate: new Date("2029-02-09"),
      propertyId: property8.id,
    },
    {
      title: "Property Tax Assessment - 東京都心オフィスビル",
      type: "PROPERTY" as const,
      relatedEntityId: property1.id.toString(),
      filePath: "documents/tax-assessment-prop001.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      propertyId: property1.id,
    },
    {
      title: "Fire Safety Certificate - 大阪住宅マンション",
      type: "PROPERTY" as const,
      relatedEntityId: property2.id.toString(),
      filePath: "documents/fire-safety-prop002.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2025-05-31"),
      propertyId: property2.id,
    },
    {
      title: "User Manual - System Administration Guide",
      type: "MANUAL" as const,
      relatedEntityId: "MANUAL-001",
      filePath: "manuals/system-admin-guide.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-01"),
      endDate: null,
    },
    {
      title: "User Manual - Staff Management Procedures",
      type: "MANUAL" as const,
      relatedEntityId: "MANUAL-002",
      filePath: "manuals/staff-management-procedures.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-01-15"),
      endDate: null,
    },
    {
      title: "User Manual - Property Management Handbook",
      type: "MANUAL" as const,
      relatedEntityId: "MANUAL-003",
      filePath: "manuals/property-management-handbook.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-02-01"),
      endDate: null,
    },
    {
      title: "User Manual - Company Registration Guide",
      type: "MANUAL" as const,
      relatedEntityId: "MANUAL-004",
      filePath: "manuals/company-registration-guide.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-02-15"),
      endDate: null,
    },
    {
      title: "User Manual - Daily Record Entry Instructions",
      type: "MANUAL" as const,
      relatedEntityId: "MANUAL-005",
      filePath: "manuals/daily-record-instructions.pdf",
      status: "ACTIVE" as const,
      startDate: new Date("2024-03-01"),
      endDate: null,
    },
  ];

  await prisma.document.createMany({
    data: documentData.map((d) => ({
      ...d,
      filePath: d.filePath ? s3url(d.filePath) : null,
    })),
  });

  // Add additional companies for more variety in seeding
  const additionalCompanyData: Prisma.CompanyCreateManyInput[] = [
    {
      companyId: "C00016",
      name: "Fukuoka Transport Solutions",
      address: "19-20-21 Tenjin, Chuo-ku, Fukuoka 810-0001, Japan",
      phone: "+81-92-6802-4579",
      email: "logistics@fukuokatransport.co.jp",
      website: "https://www.fukuokatransport.co.jp",
      industry: "Transportation",
      description:
        "Logistics and transportation company providing freight and delivery services throughout Kyushu.",
      status: "ACTIVE" as const,
      contactPerson: "Ito Masako",
      hiringVacancies: 7,
      preferredNationality: "Any",
      userInChargeId: managerUser.id,
    },
    {
      companyId: "C00017",
      name: "Sendai Education Institute",
      address: "22-23-24 Aoba, Aoba-ku, Sendai 980-0014, Japan",
      phone: "+81-22-7913-5680",
      email: "admissions@sendaiedu.ac.jp",
      website: "https://www.sendaiedu.ac.jp",
      industry: "Education",
      description:
        "Private educational institution offering vocational training and professional development programs.",
      status: "ACTIVE" as const,
      contactPerson: "Kobayashi Emiko",
      hiringVacancies: 4,
      preferredNationality: "Japan",
      userInChargeId: regularUser.id,
    },
    {
      companyId: "C00018",
      name: "Hiroshima Energy Co",
      address: "25-26-27 Hondori, Naka-ku, Hiroshima 730-0035, Japan",
      phone: "+81-82-8024-6791",
      email: "info@hiroshimaenergy.jp",
      website: "https://www.hiroshimaenergy.jp",
      industry: "Technology",
      description:
        "Renewable energy company developing solar and wind power solutions for commercial clients.",
      status: "SUSPENDED" as const,
      contactPerson: "Fujiwara Takeshi",
      hiringVacancies: 0,
      preferredNationality: "Japan",
      userInChargeId: adminUser.id,
    },
    {
      companyId: "C00019",
      name: "Kobe Marine Services",
      address: "28-29-30 Harborland, Chuo-ku, Kobe 650-0044, Japan",
      phone: "+81-78-9135-7802",
      email: "operations@kobemarine.com",
      website: "https://www.kobemarine.com",
      industry: "Transportation",
      description:
        "Marine transportation and port services company handling cargo and passenger operations.",
      status: "INACTIVE" as const,
      contactPerson: "Matsumoto Ryoko",
      hiringVacancies: 0,
      preferredNationality: "Any",
      userInChargeId: managerUser.id,
    },
  ];

  await prisma.company.createMany({
    data: additionalCompanyData.map((c) => ({
      ...c,
      ...(typeof c.photo === "string" ? { photo: s3url(c.photo) } : {}),
    })),
  });

  // Get all companies for complaint references
  const allCompanies = await prisma.company.findMany();

  // 11. Create Complaint Details
  console.log("📝 Creating complaint details...");
  const complaintData = [
    // Japanese complaint details (majority)
    {
      dateOfOccurrence: new Date("2024-01-10T14:30:00"),
      complainerName: "山田太郎",
      complainerContact: "+81-90-2481-6357",
      personInvolved: "警備員 - 佐藤",
      progressStatus: "OPEN" as const,
      urgencyLevel: "High" as const,
      complaintContent:
        "建物入館時の警備スタッフの不適切な行動。顧客が差別を感じ、即座の対応を求めています。",
      responderId: adminUser.id,
      companyId: allCompanies[0].id,
      recorderId: staff1.id,
      resolutionDate: null,
    },
    {
      dateOfOccurrence: new Date("2024-01-08T09:15:00"),
      complainerName: "田中花子",
      complainerContact: "+81-90-1234-5678",
      personInvolved: "メンテナンスチーム",
      progressStatus: "CLOSED" as const,
      urgencyLevel: "Medium" as const,
      complaintContent:
        "朝早すぎる建設工事による騒音苦情。作業スケジュール調整により解決済み。",
      responderId: managerUser.id,
      companyId: allCompanies[1].id,
      recorderId: staff2.id,
      resolutionDate: new Date("2024-01-12T16:00:00"),
    },
    {
      dateOfOccurrence: new Date("2024-01-05T11:45:00"),
      complainerName: "鈴木花子",
      complainerContact: "+81-90-9173-4028",
      personInvolved: "受付スタッフ - 渡辺",
      progressStatus: "ON_HOLD" as const,
      urgencyLevel: "Low" as const,
      complaintContent:
        "ピーク時間帯の受付デスクでの長い待ち時間。スタッフ増員または予約システム導入の提案。",
      responderId: regularUser.id,
      companyId: allCompanies[2].id,
      recorderId: staff3.id,
      resolutionDate: null,
    },
    {
      dateOfOccurrence: new Date("2024-01-15T16:20:00"),
      complainerName: "Johnson Michael",
      complainerContact: "+81-90-5629-7140",
      personInvolved: "Cleaning Staff",
      progressStatus: "OPEN" as const,
      urgencyLevel: "High" as const,
      complaintContent:
        "Cleaning chemicals left unattended in common areas, creating safety hazard for children and pets.",
      responderId: adminUser.id,
      companyId: allCompanies[3].id,
      recorderId: staff1.id,
      resolutionDate: null,
    },
    {
      dateOfOccurrence: new Date("2024-01-03T13:10:00"),
      complainerName: "Lee Min-soo",
      complainerContact: "+82-10-9876-5432",
      personInvolved: "Property Manager - Suzuki",
      progressStatus: "CLOSED" as const,
      urgencyLevel: "Medium" as const,
      complaintContent:
        "Delayed response to maintenance requests for heating system. Issue resolved after escalation to management.",
      responderId: managerUser.id,
      companyId: allCompanies[4].id,
      recorderId: staff2.id,
      resolutionDate: new Date("2024-01-09T14:30:00"),
    },
    {
      dateOfOccurrence: new Date("2023-12-28T10:00:00"),
      complainerName: "Garcia Maria Elena",
      complainerContact: "+81-90-8315-2906",
      personInvolved: "Parking Attendant",
      progressStatus: "ON_HOLD" as const,
      urgencyLevel: "Low" as const,
      complaintContent:
        "Parking space allocation issues and unclear signage causing confusion among residents.",
      responderId: regularUser.id,
      companyId: allCompanies[5].id,
      recorderId: staff4.id,
      resolutionDate: null,
    },
    {
      dateOfOccurrence: new Date("2024-01-12T08:45:00"),
      complainerName: "Wilson Robert",
      complainerContact: "+81-90-4782-1563",
      personInvolved: "IT Support Team",
      progressStatus: "OPEN" as const,
      urgencyLevel: "High" as const,
      complaintContent:
        "Network connectivity issues affecting business operations. Multiple service interruptions reported.",
      responderId: adminUser.id,
      companyId: allCompanies[6].id,
      recorderId: staff1.id,
      resolutionDate: null,
    },
    {
      dateOfOccurrence: new Date("2024-01-07T15:30:00"),
      complainerName: "Nakamura Kenji",
      complainerContact: "+81-90-6934-8207",
      personInvolved: "Elevator Maintenance",
      progressStatus: "CLOSED" as const,
      urgencyLevel: "Medium" as const,
      complaintContent:
        "Frequent elevator breakdowns causing accessibility issues. Maintenance schedule has been improved.",
      responderId: managerUser.id,
      companyId: allCompanies[7].id,
      recorderId: staff3.id,
      resolutionDate: new Date("2024-01-14T12:00:00"),
    },
  ];

  await prisma.complaintDetail.createMany({
    data: complaintData,
  });

  // 12. Create Daily Records
  console.log("📋 Creating daily records...");
  const dailyRecordData = [
    {
      dateOfRecord: new Date("2024-01-15T00:00:00"),
      staffId: staff1.id,
      conditionStatus: "Excellent" as const,
      feedbackContent:
        "Productive day with successful completion of quarterly review meetings. Team morale is high and all project milestones are on track.",
      contactNumber: "+81-90-1234-5678",
    },
    {
      dateOfRecord: new Date("2024-01-15T00:00:00"),
      staffId: staff2.id,
      conditionStatus: "Good" as const,
      feedbackContent:
        "Handled three property inspections today. Minor maintenance issues identified and work orders submitted. Weather conditions were favorable.",
      contactNumber: "+81-80-9876-5432",
    },
    {
      dateOfRecord: new Date("2024-01-15T00:00:00"),
      staffId: staff3.id,
      conditionStatus: "Fair" as const,
      feedbackContent:
        "Marketing campaign launch delayed due to client feedback. Adjusting strategy and timeline. Need additional resources for graphic design work.",
      contactNumber: "+34-600-123-456",
    },
    {
      dateOfRecord: new Date("2024-01-15T00:00:00"),
      staffId: staff4.id,
      conditionStatus: "Excellent" as const,
      feedbackContent:
        "Completed user interface mockups for new client project. Positive feedback received from stakeholders. Ready to proceed to development phase.",
      contactNumber: "+82-10-1234-5678",
    },
    {
      dateOfRecord: new Date("2024-01-14T00:00:00"),
      staffId: staff1.id,
      conditionStatus: "Good" as const,
      feedbackContent:
        "Conducted staff training session on new safety protocols. All team members completed certification. Emergency procedures updated.",
      contactNumber: "+81-90-1234-5678",
    },
    {
      dateOfRecord: new Date("2024-01-14T00:00:00"),
      staffId: staff2.id,
      conditionStatus: "Poor" as const,
      feedbackContent:
        "Equipment malfunction caused delays in property maintenance. Repair technician called but arrival delayed due to weather. Rescheduled appointments.",
      contactNumber: "+81-80-9876-5432",
    },
    {
      dateOfRecord: new Date("2024-01-13T00:00:00"),
      staffId: staff3.id,
      conditionStatus: "Good" as const,
      feedbackContent:
        "Client presentation went well. Secured approval for next phase of marketing initiative. Budget allocation confirmed for Q2 activities.",
      contactNumber: "+34-600-123-456",
    },
    {
      dateOfRecord: new Date("2024-01-13T00:00:00"),
      staffId: staff4.id,
      conditionStatus: "Fair" as const,
      feedbackContent:
        "Design review session identified areas for improvement. Incorporating accessibility features and mobile responsiveness enhancements.",
      contactNumber: "+82-10-1234-5678",
    },
    {
      dateOfRecord: new Date("2024-01-12T00:00:00"),
      staffId: staff1.id,
      conditionStatus: "Excellent" as const,
      feedbackContent:
        "Monthly performance metrics show significant improvement across all departments. Employee satisfaction survey results are positive.",
      contactNumber: "+81-90-1234-5678",
    },
    {
      dateOfRecord: new Date("2024-01-12T00:00:00"),
      staffId: staff2.id,
      conditionStatus: "Good" as const,
      feedbackContent:
        "Routine property inspections completed ahead of schedule. Preventive maintenance tasks identified and prioritized for next week.",
      contactNumber: "+81-80-9876-5432",
    },
    {
      dateOfRecord: new Date("2024-01-15T00:00:00"),
      staffId: staff5.id,
      conditionStatus: "Good" as const,
      feedbackContent:
        "Code review session completed successfully. Implemented new features for the client portal and resolved several bug reports.",
      contactNumber: "+86-138-0013-8000",
    },
    {
      dateOfRecord: new Date("2024-01-14T00:00:00"),
      staffId: staff6.id,
      conditionStatus: "Fair" as const,
      feedbackContent:
        "Preparing for return from leave. Reviewing updated policies and procedures. Meeting scheduled with team lead for transition planning.",
      contactNumber: "+1-555-0199",
    },
  ];

  await prisma.dailyRecord.createMany({
    data: dailyRecordData,
  });

  // 13. Create Inquiries
  console.log("❓ Creating inquiries...");
  const inquiryData = [
    {
      dateOfInquiry: new Date("2024-01-16T10:30:00"),
      inquirerName: "Anderson Sarah",
      inquirerContact: "+81-90-1374-6825",
      companyId: allCompanies[0].id,
      typeOfInquiry: "General",
      inquiryContent:
        "Interested in leasing office space on the 5th floor. Need information about available units, pricing, and lease terms.",
      progressStatus: "OPEN" as const,
      responderId: managerUser.id,
      recorderId: staff1.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-14T14:15:00"),
      inquirerName: "Kobayashi Hiroshi",
      inquirerContact: "+81-90-2468-1357",
      companyId: allCompanies[1].id,
      typeOfInquiry: "Technical",
      inquiryContent:
        "Request for installation of additional security cameras in parking garage. Concerned about recent incidents in the area.",
      progressStatus: "CLOSED" as const,
      responderId: adminUser.id,
      recorderId: staff2.id,
      resolutionDate: new Date("2024-01-16T11:00:00"),
    },
    {
      dateOfInquiry: new Date("2024-01-13T09:45:00"),
      inquirerName: "Thompson David",
      inquirerContact: "+81-90-8259-4137",
      companyId: allCompanies[2].id,
      typeOfInquiry: "Support",
      inquiryContent:
        "Inquiry about IT support services for small business. Need managed network services and 24/7 technical support.",
      progressStatus: "ON_HOLD" as const,
      responderId: regularUser.id,
      recorderId: staff3.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-11T16:20:00"),
      inquirerName: "Watanabe Yuki",
      inquirerContact: "+81-90-4926-5708",
      companyId: allCompanies[3].id,
      typeOfInquiry: "General",
      inquiryContent:
        "Exploring potential partnership for joint marketing initiatives. Interested in co-branding opportunities and shared resources.",
      progressStatus: "OPEN" as const,
      responderId: managerUser.id,
      recorderId: staff4.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-10T11:30:00"),
      inquirerName: "Brown Jennifer",
      inquirerContact: "+81-90-7635-2984",
      companyId: allCompanies[4].id,
      typeOfInquiry: "General",
      inquiryContent:
        "Request for business consultation services regarding expansion into Japanese market. Need expertise in local regulations and customs.",
      progressStatus: "CLOSED" as const,
      responderId: adminUser.id,
      recorderId: staff1.id,
      resolutionDate: new Date("2024-01-15T14:30:00"),
    },
    {
      dateOfInquiry: new Date("2024-01-09T13:00:00"),
      inquirerName: "Suzuki Takeshi",
      inquirerContact: "+81-80-3579-2468",
      companyId: allCompanies[5].id,
      typeOfInquiry: "Billing",
      inquiryContent:
        "Inquiry about bulk purchasing options for office supplies. Need pricing for 500+ employee organization with monthly delivery.",
      progressStatus: "ON_HOLD" as const,
      responderId: regularUser.id,
      recorderId: staff2.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-08T15:45:00"),
      inquirerName: "Miller Patricia",
      inquirerContact: "+81-90-2184-9063",
      companyId: allCompanies[6].id,
      typeOfInquiry: "General",
      inquiryContent:
        "Interested in renting conference facilities for annual nonprofit fundraising event. Need capacity for 200 guests with catering options.",
      progressStatus: "OPEN" as const,
      responderId: managerUser.id,
      recorderId: staff3.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-07T12:15:00"),
      inquirerName: "Yamamoto Akira",
      inquirerContact: "+81-90-6542-3719",
      companyId: allCompanies[7].id,
      typeOfInquiry: "Technical",
      inquiryContent:
        "Technical inquiry regarding software integration with existing systems. Need compatibility assessment and implementation timeline.",
      progressStatus: "CLOSED" as const,
      responderId: adminUser.id,
      recorderId: staff4.id,
      resolutionDate: new Date("2024-01-12T10:00:00"),
    },
    {
      dateOfInquiry: new Date("2024-01-05T08:30:00"),
      inquirerName: "Davis Michael",
      inquirerContact: "+81-90-3785-4206",
      companyId: allCompanies[8].id,
      typeOfInquiry: "General",
      inquiryContent:
        "Startup seeking investment and mentorship opportunities. Developing innovative fintech solutions for small businesses.",
      progressStatus: "OPEN" as const,
      responderId: managerUser.id,
      recorderId: staff1.id,
      resolutionDate: null,
    },
    {
      dateOfInquiry: new Date("2024-01-04T17:00:00"),
      inquirerName: "Ito Sachiko",
      inquirerContact: "+81-90-5893-1674",
      companyId: allCompanies[9].id,
      typeOfInquiry: "Complaint",
      inquiryContent:
        "Inquiry about interior design service for the new office space. Did not meet expected modern, functional design that reflects company culture and values.",
      progressStatus: "ON_HOLD" as const,
      responderId: regularUser.id,
      recorderId: staff2.id,
      resolutionDate: null,
    },
  ];

  await prisma.inquiry.createMany({
    data: inquiryData,
  });

  console.log("✅ Database seeding completed successfully!");
  console.log(`
📊 Seeded data summary:
- User Roles: 3
- Users: 3
- Mobile Users: 3 (with staff_id and user_id associations)
- Companies: 25 (with all new enhanced fields including header and job information fields)
- Staff: 13 (with all new enhanced fields and companies_id foreign key relationships)
- Properties: 8 (with all new enhanced fields including photo, furigana_name, establishment_date, postal_code, country, region, prefecture, city, owner details)
- Property Staff Assignments: 8 (with room numbers, rent_price_high, rent_price_low fields)
- System Configurations: 6
- Attendance Records: 6
- Interaction Records: 13 (with companies_id foreign key relationships)
- Documents: 27 (with staff_id, companies_id, and property_id foreign key relationships)
- Complaint Details: 8
- Daily Records: 12 (linked to staff members)
- Inquiries: 10

✨ Enhanced Property table with new fields:
- Header fields: photo, furigana_name, establishment_date
- Property Information fields: postal_code, country, region, prefecture, city, owner, owner_phone, owner_email, owner_fax
- Sample data includes diverse property types (commercial, residential, industrial, mixed-use)
- Realistic Japanese and English property information with proper formatting

✨ Enhanced Property Staff Assignments:
- Renamed 'role' column to 'room' with descriptive room numbers (A-101, B-202, etc.)
- Added rent_price_high and rent_price_low fields with realistic pricing
- Sample assignments cover different properties and staff members

✨ Enhanced Documents table:
- Added property_id foreign key linking documents to properties
- Sample property-related documents including lease agreements, insurance policies, maintenance contracts, permits, and certificates
- Comprehensive document types covering staff, company, and property relationshipsg

✨ Enhanced Staff table with new fields:
- Header fields: photo, furiganaName, gender
- Basic information: dateOfBirth, postalCode, mobile, fax, periodOfStayDateStart, periodOfStayDateEnd, qualificationsAndLicenses, japaneseProficiency, japaneseProficiencyRemarks
- Ordered array fields: educationName, educationType, workHistoryName, workHistoryDateStart, workHistoryDateEnd, workHistoryCountryLocation, workHistoryCityLocation, workHistoryPosition, workHistoryEmploymentType, workHistoryDescription
- Personal fields: reasonForApplying, motivationToComeJapan, familySpouse, familyChildren, hobbyAndInterests
- Emergency contacts: emergencyContactPrimaryName, emergencyContactPrimaryRelationship, emergencyContactPrimaryNumber, emergencyContactPrimaryEmail, emergencyContactSecondaryName, emergencyContactSecondaryRelationship, emergencyContactSecondaryNumber, emergencyContactSecondaryEmail
- Additional: remarks

✨ Enhanced relationships:
- InteractionRecord.companies_id: Links interaction records to specific companies
- Document.companies_id: Links company-related documents to specific companies
- Documents.staff_id: Links staff-related documents to specific staff members
- All records properly linked with referential integrity maintained
- Diverse sample data covering all field types and validation scenarios
- Realistic company information across all new job information fields

  `);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
