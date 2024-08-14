const errorCodes = {
  INCORRECT_EMAIL_OR_PASS: {
    statusCode: 401,
    message: 'Incorrect email or password.',
  },
  NOT_LOGGED_IN: {
    statusCode: 401,
    message: 'You are not logged in! Please login first.',
  },
  LOG_IN_AGAIN: {
    statusCode: 401,
    message: 'You should log in again.',
  },
  USER_NOT_FOUND: {
    statusCode: 404,
    message: 'User account not found. Please log in again.',
  },
  PASSWORD_CHANGED: {
    statusCode: 401,
    message: 'Password recently has been changed. Please log in again.',
  },
  VALIDATION_ERROR: {
    statusCode: 400,
    message: 'Validation error.',
  },
  DUPLICATE_KEY: {
    statusCode: 400,
    message: 'One or more unique values are already existed.',
  },
  CAR_NOT_FOUND: { statusCode: 404, message: 'Car not found.' },
  SELLER_NOT_FOUND: { statusCode: 404, message: 'Seller not found.' },
  INVALID_PATH_PARAM: {
    statusCode: 400,
    message: 'Invalid parameter passed as a path parameter.',
  },
  INVALID_QUERY_PARAM: {
    statusCode: 400,
    message: 'Invalid parameter passed as a query parameter.',
  },
  ACCESS_DENIED: { statusCode: 401, message: 'You can not access this path.' },
  INVALID_ROLE: { statusCode: 400, message: 'The entered role is invalid.' },
};

module.exports = class OperationalError extends Error {
  constructor(errorCode, customErrorMessage) {
    const errorObj = errorCodes[errorCode];
    const errorMessage = customErrorMessage || errorObj.message;

    super(errorMessage);
    this.statusCode = errorObj.statusCode;
    this.errorCode = errorCode;
    this.status = 'fail';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
};
