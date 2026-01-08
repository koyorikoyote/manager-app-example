/**
 * Company-specific validation utilities
 * Provides enhanced validation for company fields with user-friendly messages
 */

export interface CompanyValidationError {
  field: string;
  message: string;
  type: "required" | "format" | "length" | "range" | "custom";
}

/**
 * Validates corporate number format
 */
export const validateCorporateNumber = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 20) {
    return {
      field: "corporateNumber",
      message: "法人番号は20文字以内で入力してください",
      type: "length",
    };
  }

  if (!/^[0-9-]*$/.test(value)) {
    return {
      field: "corporateNumber",
      message: "法人番号は数字とハイフンのみ使用できます",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates furigana name format (Japanese characters only)
 */
export const validateFuriganaName = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 255) {
    return {
      field: "furiganaName",
      message: "ふりがなは255文字以内で入力してください",
      type: "length",
    };
  }

  if (!/^[\u3040-\u309F\u30A0-\u30FF\s]*$/.test(value)) {
    return {
      field: "furiganaName",
      message: "ふりがなはひらがな、カタカナ、スペースのみ使用できます",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates establishment date
 */
export const validateEstablishmentDate = (
  value: Date
): CompanyValidationError | null => {
  if (!value) return null;

  const today = new Date();
  const minDate = new Date(1800, 0, 1);

  if (value > today) {
    return {
      field: "establishmentDate",
      message: "設立日は未来の日付にできません",
      type: "range",
    };
  }

  if (value < minDate) {
    return {
      field: "establishmentDate",
      message: "設立日が古すぎます。日付を確認してください",
      type: "range",
    };
  }

  return null;
};

/**
 * Validates postal code
 */
export const validatePostalCode = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (!/^[0-9-]{7,10}$/.test(value)) {
    return {
      field: "postalCode",
      message: "郵便番号は123-4567の形式で入力してください",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates address components (country, region, prefecture, city)
 */
export const validateAddressComponent = (
  field: string,
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 100) {
    return {
      field,
      message: `100文字以内で入力してください`,
      type: "length",
    };
  }

  if (
    !/^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF0-9.,'-]*$/.test(value)
  ) {
    return {
      field,
      message: `無効な文字が含まれています`,
      type: "format",
    };
  }

  return null;
};

/**
 * Validates website URL format
 */
export const validateWebsiteUrl = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 255) {
    return {
      field: "website",
      message: "ウェブサイトURLは255文字以内で入力してください",
      type: "length",
    };
  }

  const urlPattern =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
  if (!urlPattern.test(value)) {
    return {
      field: "website",
      message:
        "有効なウェブサイトURLを入力してください（例：https://example.com）",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates email format with enhanced checking
 */
export const validateEmailAddress = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 255) {
    return {
      field: "email",
      message: "メールアドレスは255文字以内で入力してください",
      type: "length",
    };
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(value)) {
    return {
      field: "email",
      message:
        "有効なメールアドレスを入力してください（例：contact@company.com）",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates phone number format
 */
export const validatePhoneNumber = (
  value: string
): CompanyValidationError | null => {
  if (!value) return null;

  if (value.length > 20) {
    return {
      field: "phone",
      message: "電話番号は20文字以内で入力してください",
      type: "length",
    };
  }

  if (value.length < 10) {
    return {
      field: "phone",
      message: "電話番号は10文字以上で入力してください",
      type: "length",
    };
  }

  if (!/^[\d\s\-+()]+$/.test(value)) {
    return {
      field: "phone",
      message:
        "電話番号は数字、スペース、ハイフン、プラス記号、括弧のみ使用できます",
      type: "format",
    };
  }

  return null;
};

/**
 * Validates hiring vacancies number
 */
export const validateHiringVacancies = (
  value: number
): CompanyValidationError | null => {
  if (value === null || value === undefined) return null;

  if (value < 0) {
    return {
      field: "hiringVacancies",
      message: "募集人数は負の数にできません",
      type: "range",
    };
  }

  if (value > 10000) {
    return {
      field: "hiringVacancies",
      message: "募集人数が多すぎます。確認してください",
      type: "range",
    };
  }

  if (!Number.isInteger(value)) {
    return {
      field: "hiringVacancies",
      message: "募集人数は整数で入力してください",
      type: "format",
    };
  }

  return null;
};

/**
 * Photo upload error messages
 */
export const PHOTO_UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: "ファイルサイズは5MB以下にしてください",
  INVALID_FORMAT: "JPEG、PNG、またはWebP形式の画像をアップロードしてください",
  UPLOAD_FAILED: "写真のアップロードに失敗しました。もう一度お試しください",
  NETWORK_ERROR:
    "ネットワークエラーが発生しました。接続を確認してもう一度お試しください",
  INVALID_FILENAME:
    "ファイル名に無効な文字が含まれています。ファイル名を変更してください",
  CORRUPTED_FILE:
    "選択したファイルが破損しているようです。別の画像をお試しください",
  SERVER_ERROR:
    "アップロード中にサーバーエラーが発生しました。後でもう一度お試しください",
};
