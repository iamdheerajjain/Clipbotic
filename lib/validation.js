// Input validation utilities
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export const validators = {
  // String validation
  string: (value, fieldName, options = {}) => {
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }

    const trimmed = value.trim();

    if (options.required && trimmed.length === 0) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    if (options.minLength && trimmed.length < options.minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${options.minLength} characters`,
        fieldName
      );
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      throw new ValidationError(
        `${fieldName} must be no more than ${options.maxLength} characters`,
        fieldName
      );
    }

    if (options.pattern && !options.pattern.test(trimmed)) {
      throw new ValidationError(`${fieldName} format is invalid`, fieldName);
    }

    return trimmed;
  },

  // Email validation
  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return validators.string(value, fieldName, {
      required: true,
      pattern: emailRegex,
      maxLength: 254,
    });
  },

  // ID validation (for Supabase UUIDs)
  id: (value, fieldName) => {
    if (typeof value !== "string" || value.length < 20) {
      throw new ValidationError(`${fieldName} must be a valid ID`, fieldName);
    }
    return value;
  },

  // Object validation
  object: (value, fieldName, schema) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`, fieldName);
    }

    const validated = {};
    for (const [key, validator] of Object.entries(schema)) {
      if (value[key] !== undefined) {
        validated[key] = validator(value[key], key);
      }
    }

    return validated;
  },

  // Array validation
  array: (value, fieldName, itemValidator, options = {}) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }

    if (options.minLength && value.length < options.minLength) {
      throw new ValidationError(
        `${fieldName} must have at least ${options.minLength} items`,
        fieldName
      );
    }

    if (options.maxLength && value.length > options.maxLength) {
      throw new ValidationError(
        `${fieldName} must have no more than ${options.maxLength} items`,
        fieldName
      );
    }

    return value.map((item, index) =>
      itemValidator(item, `${fieldName}[${index}]`)
    );
  },

  // Optional validation
  optional: (validator) => {
    return (value, fieldName) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      return validator(value, fieldName);
    };
  },
};

// Sanitization utilities
export const sanitizers = {
  // Remove HTML tags and dangerous characters
  html: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/[<>]/g, "");
  },

  // Remove script tags and dangerous content
  script: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  },

  // Normalize whitespace
  whitespace: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/\s+/g, " ").trim();
  },
};

// Schema validation helper
export function validateSchema(data, schema) {
  const validated = {};
  const errors = [];

  for (const [fieldName, validator] of Object.entries(schema)) {
    try {
      if (data[fieldName] !== undefined) {
        validated[fieldName] = validator(data[fieldName], fieldName);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        errors.push(
          new ValidationError(`Validation failed for ${fieldName}`, fieldName)
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Validation failed: ${errors.map((e) => e.message).join(", ")}`
    );
  }

  return validated;
}
