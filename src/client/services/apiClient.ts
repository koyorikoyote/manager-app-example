// Enhanced API client with comprehensive error handling

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  field?: string;
  count?: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
    offset?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  field?: string;
  originalError?: any;
}

export class ApiClientError extends Error {
  public statusCode: number;
  public code?: string;
  public field?: string;
  public originalError?: any;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    field?: string,
    originalError?: any
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.originalError = originalError;
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = "/api", timeout: number = 30000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout?: number
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const requestTimeout = timeout || this.defaultTimeout;

    // Get auth token from localStorage
    const token = localStorage.getItem("authToken");

    // For write operations (POST, PUT, PATCH, DELETE), ensure we have a token
    const isWriteOperation = ["POST", "PUT", "PATCH", "DELETE"].includes(
      options.method || "GET"
    );
    if (isWriteOperation && !token) {
      throw new ApiClientError(
        "Authentication required for this operation",
        401,
        "AUTH_REQUIRED"
      );
    }

    // Handle AbortSignal - combine external signal with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    // If external signal is provided, listen for its abort event
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new Error("Request was cancelled");
      }

      options.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle different response types
      let responseData: ApiResponse<T>;

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        responseData = {
          success: response.ok,
          message: response.ok ? "Success" : "Request failed",
          error: response.ok ? undefined : text || "Unknown error",
        };
      }

      // Handle HTTP error status codes
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear the token and redirect to login
          localStorage.removeItem("authToken");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        throw new ApiClientError(
          responseData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          responseData.code,
          responseData.field,
          responseData
        );
      }

      // Handle API-level errors (success: false)
      // Only check for success field if it exists, otherwise assume success for 2xx responses
      if (
        Object.prototype.hasOwnProperty.call(responseData, "success") &&
        !responseData.success
      ) {
        throw new ApiClientError(
          responseData.message || "API request failed",
          response.status,
          responseData.code,
          responseData.field,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Request timeout after ${requestTimeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new NetworkError(
          "Network connection failed. Please check your internet connection. ネットワーク接続に失敗しました。インターネット接続を確認してください。"
        );
      }

      // Re-throw API client errors
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle other errors
      throw new ApiClientError(
        error instanceof Error ? error.message : "Unknown error occurred",
        500,
        "UNKNOWN_ERROR",
        undefined,
        error
      );
    }
  }

  // Enhanced methods with optional AbortSignal support
  async get<T>(
    endpoint: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "GET",
        signal: options?.signal,
      },
      options?.timeout
    );
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
        signal: options?.signal,
      },
      options?.timeout
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
        signal: options?.signal,
      },
      options?.timeout
    );
  }

  async delete<T>(
    endpoint: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "DELETE",
        signal: options?.signal,
      },
      options?.timeout
    );
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
        signal: options?.signal,
      },
      options?.timeout
    );
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Utility functions for error handling
export const isNetworkError = (error: any): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isTimeoutError = (error: any): error is TimeoutError => {
  return error instanceof TimeoutError;
};

export const isApiClientError = (error: any): error is ApiClientError => {
  return error instanceof ApiClientError;
};

export const getErrorMessage = (error: any): string => {
  if (isApiClientError(error)) {
    return error.message;
  }
  if (isNetworkError(error)) {
    return "Network connection failed. Please check your internet connection and try again. ネットワーク接続に失敗しました。インターネット接続を確認して、もう一度お試しください。";
  }
  if (isTimeoutError(error)) {
    return "Request timed out. Please try again. リクエストがタイムアウトしました。もう一度お試しください。";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again. 予期しないエラーが発生しました。もう一度お試しください。";
};

export const getErrorCode = (error: any): string | undefined => {
  if (isApiClientError(error)) {
    return error.code;
  }
  return undefined;
};

export const shouldRetry = (error: any): boolean => {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }
  if (isApiClientError(error)) {
    // Retry on server errors (5xx) but not client errors (4xx)
    return error.statusCode >= 500;
  }
  return false;
};

// Retry utility function
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};
