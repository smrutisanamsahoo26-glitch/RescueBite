export const sendSuccess = (res, {
  data = null,
  message = 'Operation successful',
  statusCode = 200,
  pagination = null
}) => {
  const response = {
    success: true,
    message,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, {
  message = 'An unexpected error occurred',
  statusCode = 500,
  errors = null
}) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
