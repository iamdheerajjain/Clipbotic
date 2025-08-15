// Centralized error handling service
export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details = null
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

// Error handler for API routes
export function handleApiError(error, req) {
  // Log error with context
  const errorContext = {
    timestamp: new Date().toISOString(),
    url: req?.url,
    method: req?.method,
    userAgent: req?.headers?.["user-agent"],
    ip: req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"],
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      code: error.code,
      details: error.details,
    },
  };

  console.error("API Error:", errorContext);

  // Return appropriate response based on error type
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && {
          details: error.details,
        }),
      },
    };
  }

  // Handle unexpected errors
  if (error.name === "ValidationError") {
    return {
      status: 400,
      body: {
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.message,
      },
    };
  }

  // Default error response
  return {
    status: 500,
    body: {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    },
  };
}

// Client-side error handler
export function handleClientError(error, context = "") {
  console.error(`Client Error${context ? ` in ${context}` : ""}:`, error);

  // Don't expose internal errors to users
  if (error.name === "AppError") {
    return {
      userMessage: error.message,
      code: error.code,
      canRetry: error.statusCode >= 500,
    };
  }

  return {
    userMessage: "Something went wrong. Please try again.",
    code: "UNKNOWN_ERROR",
    canRetry: true,
  };
}

// Async error wrapper for components
export function withErrorHandling(asyncFn) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const handled = handleClientError(error);
      throw new Error(handled.userMessage);
    }
  };
}
