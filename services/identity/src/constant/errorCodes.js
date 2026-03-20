module.exports = {
  INTERNAL_SERVER_ERROR: {
    httpStatusCode: 500,
    body: {
      code: "internal_server_error",
      message: "Internal server error",
    },
  },
  USER_ALREADY_EXISTS: {
    httpStatusCode: 409,
    body: {
      code: "conflict",
      message: "User already exists",
    },
  },
  USER_NOT_FOUND: {
    httpStatusCode: 404,
    body: {
      code: "not_found",
      message: "User not found",
    },
  },
  INVALID_CREDENTIALS: {
    httpStatusCode: 401,
    body: {
      code: "unauthorized",
      message: "Invalid credentials",
    },
  },
  TOKEN_GENERATION_FAILED: {
    httpStatusCode: 503,
    body: {
      code: "service_unavailable",
      message: "Token generation failed",
    },
  },
  GRPC_CONNECTION_FAILED: {
    httpStatusCode: 503,
    body: {
      code: "service_unavailable",
      message: "GRPC connection failed",
    },
  },
};
