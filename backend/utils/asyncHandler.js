import ApiResponse from "./ApiResponse.js";
import ApiError from "./ApiError.js";
import { error } from "console";
import { env } from "process";

/**
 * Helper to send JSON responses
 */
const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
  errors = null,
  field = null
) => {
  res.status(statusCode).json({
    success,
    message,
    ...(data && { data }),
    ...(errors && { errors }),
    ...(field && { field }),
  });
};

/**
 * Wraps an async request handler to handle errors uniformly
 * @param {Function} requestHandler - The async request handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      const response = await requestHandler(req, res, next);

      if (res.headersSent) return; // Skip if response already sent

      // Handle ApiResponse instance
      if (response instanceof ApiResponse) {
        return sendResponse(
          res,
          response.statusCode,
          response.success,
          response.message,
          response.data
        );
      }

      // Default success response
      if (response) {
        return sendResponse(res, 200, true, "Operation successful", response);
      }
    } catch (err) {
      if (res.headersSent) return next(err); // Skip if response already sent

      // Log error in non-production
      if (process.env.NODE_ENV !== "production") {
        console.error("Error:", {
          name: err.name,
          message: err.message,
          code: err.code,
          meta: err.meta,
          stack: err.stack,
        });
      }

      // Error Mappings
      if (err instanceof ApiError) {
        return sendResponse(
          res,
          err.statusCode,
          false,
          err.message,
          null,
          err.errors,
          err.field
        );
      }

      if (err.code?.startsWith("P2")) {
        let statusCode = 400;
        let message = "An error occurred while processing your request.";
        let field = err.meta?.target?.[0] || null;

        switch (err.code) {
          case "P2002": // Unique constraint failed
            // Extract field name from target (e.g., "User_email_key" => "email")
            const rawField = err.meta?.target?.split("_")[1]; // Extracts 'email' or 'username'
            const fieldMapping = {
              email: "Email address",
              username: "Username",
            };

            // Map raw field to a friendly field name
            const friendlyField = fieldMapping[rawField] || "A unique field";

            // Construct user-friendly message
            message =
              rawField === "email"
                ? "Email address already associated with an account. Use a different email."
                : rawField === "username"
                ? "Username already in use. Select a different username."
                : `The value for ${friendlyField} is already in use. Check your input.`;
            break;

          case "P2025": // Record not found
            message =
              "The requested item could not be found. It may have been deleted or moved. Please refresh and try again.";
            statusCode = 404; // Not Found
            break;

          case "P2003": // Foreign key violation
            message =
              "You are trying to link to an item that does not exist. Please ensure all referenced fields are valid and try again.";
            statusCode = 400; // Bad Request
            break;

          default: // General Prisma error fallback
            message =
              "An error occurred while interacting with the database. Please try again later.";
        }

        return sendResponse(res, statusCode, false, message, null, null, field);
      }

      const jwtErrorMessages = {
        JsonWebTokenError: "Invalid token",
        TokenExpiredError: "Token has expired",
      };

      if (jwtErrorMessages[err.name]) {
        return sendResponse(res, 401, false, jwtErrorMessages[err.name]);
      }

      if (err.name === "ValidationError") {
        return sendResponse(
          res,
          400,
          false,
          "Validation failed",
          null,
          err.errors
        );
      }

      // Unexpected error
      const message =
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message;
      return sendResponse(res, 500, false, message);
    }
  };
};

export default asyncHandler;
