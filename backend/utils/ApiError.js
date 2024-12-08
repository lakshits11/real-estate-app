class ApiError extends Error {
  constructor(statusCode, message, errors = [], field = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.field = field;
  }
}

export default ApiError;
