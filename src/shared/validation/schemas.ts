/**
 * Comprehensive validation schemas for dialog forms
 * Defines validation rules, field types, and error messages
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | null;
}

export interface FieldValidationConfig {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "select" | "number";
  rules: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
  type: "required" | "format" | "length" | "range" | "custom";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Complaint Detail Validation Schema
export const COMPLAINT_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  {
    key: "dateOfOccurrence",
    label: "Date of Occurrence",
    type: "date",
    rules: {
      required: true,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "発生日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "complainerName",
    label: "Complainer Name",
    type: "text",
    rules: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
    },
  },
  {
    key: "complainerContact",
    label: "Contact Information",
    type: "text",
    rules: {
      required: true,
      minLength: 5,
      maxLength: 200,
    },
  },
  {
    key: "personInvolved",
    label: "Person Involved",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/,
    },
  },
  {
    key: "urgencyLevel",
    label: "Urgency Level",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        const validValues = ["High", "Medium", "Low"];
        if (value && !validValues.includes(value as string)) {
          return "有効な緊急度を選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "progressStatus",
    label: "Progress Status",
    type: "select",
    rules: {
      required: false,
      custom: (value) => {
        const validValues = ["OPEN", "CLOSED", "ON_HOLD"];
        if (value && !validValues.includes(value as string)) {
          return "有効なステータスを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "complaintContent",
    label: "Complaint Content",
    type: "textarea",
    rules: {
      required: true,
      minLength: 10,
      maxLength: 2000,
    },
  },
  {
    key: "recorderId",
    label: "Recorder",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return "有効な記録者を選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "resolutionDate",
    label: "Resolution Date",
    type: "date",
    rules: {
      required: false,
    },
  },
];

// Daily Record Validation Schema
export const DAILY_RECORD_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  {
    key: "dateOfRecord",
    label: "Date of Record",
    type: "date",
    rules: {
      required: true,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "記録日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "staffId",
    label: "Staff Member",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return "有効なスタッフを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "conditionStatus",
    label: "Condition Status",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        const validValues = ["Excellent", "Good", "Fair", "Poor"];
        if (value && !validValues.includes(value as string)) {
          return "有効な状態を選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "feedbackContent",
    label: "Feedback Content",
    type: "textarea",
    rules: {
      required: true,
      minLength: 10,
      maxLength: 1000,
    },
  },
  {
    key: "contactNumber",
    label: "Contact Number",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "photo",
    label: "Photo",
    type: "text",
    rules: {
      required: false,
      maxLength: 500,
      custom: (value) => {
        if (!value || typeof value !== "string") return null;

        if (value.length > 500) {
          return "写真パスは500文字以内で入力してください";
        }

        const validPathRegex = /^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%/]+$/;
        if (!validPathRegex.test(value)) {
          return "写真パスに無効な文字が含まれています";
        }

        return null;
      },
    },
  },
];

// Inquiry Validation Schema
export const INQUIRY_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  {
    key: "dateOfInquiry",
    label: "Date of Inquiry",
    type: "date",
    rules: {
      required: true,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "問い合わせ日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "inquirerName",
    label: "Inquirer Name",
    type: "text",
    rules: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
    },
  },
  {
    key: "inquirerContact",
    label: "Contact Information",
    type: "text",
    rules: {
      required: true,
      minLength: 5,
      maxLength: 200,
    },
  },
  {
    key: "typeOfInquiry",
    label: "Type of Inquiry",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        const validValues = [
          "General",
          "Technical",
          "Billing",
          "Support",
          "Complaint",
        ];
        if (value && !validValues.includes(value as string)) {
          return "有効な問い合わせタイプを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "inquiryContent",
    label: "Inquiry Content",
    type: "textarea",
    rules: {
      required: true,
      minLength: 10,
      maxLength: 2000,
    },
  },
  {
    key: "progressStatus",
    label: "Progress Status",
    type: "select",
    rules: {
      required: false,
      custom: (value) => {
        const validValues = ["OPEN", "CLOSED", "ON_HOLD"];
        if (value && !validValues.includes(value as string)) {
          return "有効なステータスを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "recorderId",
    label: "Recorder",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return "有効な記録者を選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "resolutionDate",
    label: "Resolution Date",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "解決日は未来の日付にできません";
        }
        return null;
      },
    },
  },
];

// Interaction Record Validation Schema
export const INTERACTION_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        const validValues = [
          "DISCUSSION",
          "INTERVIEW",
          "CONSULTATION",
          "OTHER",
        ];
        if (value && !validValues.includes(value as string)) {
          return "有効な対話タイプを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "date",
    label: "Date",
    type: "date",
    rules: {
      required: true,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "対話日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    rules: {
      required: true,
      minLength: 10,
      maxLength: 2000,
    },
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    rules: {
      required: true,
      custom: (value) => {
        const validValues = ["OPEN", "IN_PROGRESS", "RESOLVED"];
        if (value && !validValues.includes(value as string)) {
          return "有効なステータスを選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/,
    },
  },
  {
    key: "title",
    label: "Title",
    type: "text",
    rules: {
      required: false,
      maxLength: 200,
    },
  },
  {
    key: "personConcerned",
    label: "Person Concerned",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/,
    },
  },
  {
    key: "location",
    label: "Location",
    type: "text",
    rules: {
      required: false,
      maxLength: 200,
    },
  },
  {
    key: "means",
    label: "Communication Method",
    type: "select",
    rules: {
      required: false,
      custom: (value) => {
        const validValues = ["FACE_TO_FACE", "ONLINE", "PHONE", "EMAIL"];
        if (value && !validValues.includes(value as string)) {
          return "有効なコミュニケーション方法を選択してください";
        }
        return null;
      },
    },
  },
  {
    key: "responseDetails",
    label: "Response Details",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 1000,
    },
  },
];

// Staff Detail Enhancement Validation Schema
export const STAFF_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  // Header fields
  {
    key: "furiganaName",
    label: "Furigana Name",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
      pattern: /^[\u3040-\u309F\u30A0-\u30FF\s]*$/,
    },
  },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    rules: {
      required: false,
      custom: (value) => {
        const validValues = ["M", "F"];
        if (value && !validValues.includes(value as string)) {
          return "有効な性別を選択してください";
        }
        return null;
      },
    },
  },
  // Basic information fields
  {
    key: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;

        const date =
          typeof value === "string" ? new Date(value) : (value as Date);

        if (isNaN(date.getTime())) {
          return "有効な日付を入力してください";
        }

        const today = new Date();
        const minDate = new Date(1900, 0, 1);

        if (date > today) {
          return "生年月日は未来の日付にできません";
        }

        if (date < minDate) {
          return "生年月日が古すぎます";
        }

        const age = Math.floor(
          (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        if (age > 150) {
          return "年齢が現実的ではありません";
        }

        if (age < 0) {
          return "年齢が無効です";
        }

        return null;
      },
    },
  },
  {
    key: "postalCode",
    label: "Postal Code",
    type: "text",
    rules: {
      required: false,
      pattern: /^[0-9-]{7,10}$/,
      custom: (value) => {
        if (!value) return null;
        if (!/^[0-9-]{7,10}$/.test(value as string)) {
          return "郵便番号は123-4567の形式で入力してください";
        }
        return null;
      },
    },
  },
  {
    key: "mobile",
    label: "Mobile Phone",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "fax",
    label: "Fax Number",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "periodOfStayDateStart",
    label: "Period of Stay Start Date",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "開始日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "periodOfStayDateEnd",
    label: "Period of Stay End Date",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          return "有効な日付を入力してください";
        }
        return null;
      },
    },
  },
  {
    key: "qualificationsAndLicenses",
    label: "Qualifications and Licenses",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 2000,
    },
  },
  {
    key: "japaneseProficiency",
    label: "Japanese Proficiency",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 1000,
    },
  },
  {
    key: "japaneseProficiencyRemarks",
    label: "Japanese Proficiency Remarks",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 1000,
    },
  },
  // Personal fields
  {
    key: "reasonForApplying",
    label: "Reason for Applying",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 2000,
    },
  },
  {
    key: "motivationToComeJapan",
    label: "Motivation to Come to Japan",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 2000,
    },
  },
  {
    key: "familyChildren",
    label: "Number of Children",
    type: "number",
    rules: {
      required: false,
      min: 0,
      max: 20,
    },
  },
  {
    key: "hobbyAndInterests",
    label: "Hobbies and Interests",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 1000,
    },
  },
  // Emergency contacts
  {
    key: "emergencyContactPrimaryName",
    label: "Primary Emergency Contact Name",
    type: "text",
    rules: {
      required: false,
      minLength: 2,
      maxLength: 255,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/,
    },
  },
  {
    key: "emergencyContactPrimaryRelationship",
    label: "Primary Emergency Contact Relationship",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "emergencyContactPrimaryNumber",
    label: "Primary Emergency Contact Number",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "emergencyContactPrimaryEmail",
    label: "Primary Emergency Contact Email",
    type: "email",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "emergencyContactSecondaryName",
    label: "Secondary Emergency Contact Name",
    type: "text",
    rules: {
      required: false,
      minLength: 2,
      maxLength: 255,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/,
    },
  },
  {
    key: "emergencyContactSecondaryRelationship",
    label: "Secondary Emergency Contact Relationship",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "emergencyContactSecondaryNumber",
    label: "Secondary Emergency Contact Number",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "emergencyContactSecondaryEmail",
    label: "Secondary Emergency Contact Email",
    type: "email",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "remarks",
    label: "Remarks",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 2000,
    },
  },
  // Existing staff fields
  {
    key: "employeeId",
    label: "Employee ID",
    type: "text",
    rules: {
      required: false,
      maxLength: 50,
    },
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    rules: {
      required: true,
      minLength: 2,
      maxLength: 255,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
    },
  },
  {
    key: "position",
    label: "Position",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "department",
    label: "Department",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "address",
    label: "Address",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 500,
    },
  },
  {
    key: "hireDate",
    label: "Hire Date",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "雇用日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "salary",
    label: "Salary",
    type: "number",
    rules: {
      required: false,
      min: 0,
      max: 100000000,
    },
  },
  {
    key: "age",
    label: "Age",
    type: "number",
    rules: {
      required: false,
      min: 16,
      max: 150,
    },
  },
];

// Company Detail Enhancement Validation Schema
export const COMPANY_VALIDATION_SCHEMA: FieldValidationConfig[] = [
  // Header fields
  {
    key: "corporateNumber",
    label: "Corporate Number",
    type: "text",
    rules: {
      required: false,
      maxLength: 20,
      pattern: /^[0-9-]*$/,
    },
  },
  {
    key: "furiganaName",
    label: "Furigana Name",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
      pattern: /^[\u3040-\u309F\u30A0-\u30FF\s]*$/,
    },
  },
  {
    key: "establishmentDate",
    label: "Establishment Date",
    type: "date",
    rules: {
      required: false,
      custom: (value) => {
        if (!value) return null;
        const date = new Date(value as string);
        const today = new Date();
        if (date > today) {
          return "設立日は未来の日付にできません";
        }
        return null;
      },
    },
  },
  {
    key: "country",
    label: "Country",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "region",
    label: "Region",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "prefecture",
    label: "Prefecture",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "city",
    label: "City",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  // Job Information fields
  {
    key: "preferredStatusOfResidence",
    label: "Preferred Status of Residence",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "preferredAge",
    label: "Preferred Age",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "preferredExperience",
    label: "Preferred Experience",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "preferredQualifications",
    label: "Preferred Qualifications",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "preferredPersonality",
    label: "Preferred Personality",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "preferredEducation",
    label: "Preferred Education",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "preferredJapaneseProficiency",
    label: "Preferred Japanese Proficiency",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "destinationWorkEnvironment",
    label: "Destination Work Environment",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "destinationAverageAge",
    label: "Destination Average Age",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "destinationWorkPlace",
    label: "Destination Work Place",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "destinationTransfer",
    label: "Destination Transfer",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobSelectionProcess",
    label: "Job Selection Process",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobPastRecruitmentHistory",
    label: "Job Past Recruitment History",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobSalary",
    label: "Job Salary",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "jobOvertimeRate",
    label: "Job Overtime Rate",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "jobSalaryIncreaseRate",
    label: "Job Salary Increase Rate",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobSalaryBonus",
    label: "Job Salary Bonus",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobAllowances",
    label: "Job Allowances",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobEmployeeBenefits",
    label: "Job Employee Benefits",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobRetirementBenefits",
    label: "Job Retirement Benefits",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobTermsAndConditions",
    label: "Job Terms and Conditions",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobDisputePreventionMeasures",
    label: "Job Dispute Prevention Measures",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobProvisionalHiringConditions",
    label: "Job Provisional Hiring Conditions",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobContractRenewalConditions",
    label: "Job Contract Renewal Conditions",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "jobRetirementConditions",
    label: "Job Retirement Conditions",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  // Existing company fields
  {
    key: "name",
    label: "Company Name",
    type: "text",
    rules: {
      required: true,
      minLength: 2,
      maxLength: 255,
    },
  },
  {
    key: "address",
    label: "Address",
    type: "textarea",
    rules: {
      required: true,
      minLength: 5,
      maxLength: 500,
    },
  },
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    rules: {
      required: false,
      pattern: /^[\d\s\-+()]+$/,
      minLength: 10,
      maxLength: 20,
    },
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "website",
    label: "Website",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    },
  },
  {
    key: "industry",
    label: "Industry",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    rules: {
      required: false,
      maxLength: 2000,
    },
  },
  {
    key: "contactPerson",
    label: "Contact Person",
    type: "text",
    rules: {
      required: false,
      maxLength: 255,
    },
  },
  {
    key: "hiringVacancies",
    label: "Hiring Vacancies",
    type: "number",
    rules: {
      required: false,
      min: 0,
      max: 10000,
    },
  },
  {
    key: "preferredNationality",
    label: "Preferred Nationality",
    type: "text",
    rules: {
      required: false,
      maxLength: 100,
    },
  },
];

// Error message mapping for user-friendly feedback
export const ERROR_MESSAGES = {
  required: (fieldLabel: string) => `${fieldLabel}は必須です`,
  minLength: (fieldLabel: string, min: number) =>
    `${fieldLabel}は${min}文字以上で入力してください`,
  maxLength: (fieldLabel: string, max: number) =>
    `${fieldLabel}は${max}文字以内で入力してください`,
  pattern: (fieldLabel: string) => `${fieldLabel}に無効な文字が含まれています`,
  min: (fieldLabel: string, min: number) =>
    `${fieldLabel}は${min}以上で入力してください`,
  max: (fieldLabel: string, max: number) =>
    `${fieldLabel}は${max}以下で入力してください`,
  email: (fieldLabel: string) =>
    `${fieldLabel}は有効なメールアドレスを入力してください`,
  tel: (fieldLabel: string) =>
    `${fieldLabel}は有効な電話番号を入力してください`,
  date: (fieldLabel: string) => `${fieldLabel}は有効な日付を入力してください`,
  select: (fieldLabel: string) => `有効な${fieldLabel}を選択してください`,
  custom: (message: string) => message,
};

// Validation schemas for system configuration form used by client components
export const systemConfigValidationSchemas = {
  create: [
    {
      key: "key",
      label: "Configuration Key",
      type: "text",
      rules: {
        required: true,
        minLength: 1,
        maxLength: 255,
      },
    },
    {
      key: "value",
      label: "Configuration Value",
      type: "textarea",
      rules: {
        required: true,
      },
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      rules: {
        required: true,
      },
    },
    {
      key: "dataType",
      label: "Data Type",
      type: "select",
      rules: {
        required: true,
      },
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rules: {
        required: false,
        maxLength: 2000,
      },
    },
  ],
  update: [
    // Update uses the same validation rules as create for now
    {
      key: "key",
      label: "Configuration Key",
      type: "text",
      rules: {
        required: true,
        minLength: 1,
        maxLength: 255,
      },
    },
    {
      key: "value",
      label: "Configuration Value",
      type: "textarea",
      rules: {
        required: true,
      },
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      rules: {
        required: true,
      },
    },
    {
      key: "dataType",
      label: "Data Type",
      type: "select",
      rules: {
        required: true,
      },
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rules: {
        required: false,
        maxLength: 2000,
      },
    },
  ],
};
