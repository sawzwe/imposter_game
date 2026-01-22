/**
 * Error handling utilities with retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (
        error instanceof Error &&
        "status" in error &&
        typeof (error as any).status === "number" &&
        (error as any).status >= 400 &&
        (error as any).status < 500
      ) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = opts.exponentialBackoff
        ? opts.retryDelay * Math.pow(2, attempt)
        : opts.retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error");
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    // API errors
    if (error.message.includes("403")) {
      return "Access denied. Please check your permissions.";
    }

    if (error.message.includes("404")) {
      return "Resource not found. The room may have been deleted.";
    }

    if (error.message.includes("500")) {
      return "Server error. Please try again in a moment.";
    }

    // Return the error message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't retry client errors (4xx) except 408 (timeout) and 429 (rate limit)
    if ("status" in error) {
      const status = (error as any).status;
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
    }

    // Retry network errors, timeouts, and server errors
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    );
  }

  return false;
}


