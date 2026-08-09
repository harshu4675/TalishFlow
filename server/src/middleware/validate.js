import { createError } from "./errorHandler.js";

/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema.
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(createError("Validation failed", 422, errors));
    }

    // Replace with validated & transformed data
    req[source] = result.data;

    next();
  };
}
