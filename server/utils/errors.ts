import { ErrorResponse } from '../types';

export const createErrorResponse = (message: string, code: string = "INTERNAL_SERVER_ERROR"): ErrorResponse => ({
  error: message,
  code,
  timestamp: new Date().toISOString()
});
