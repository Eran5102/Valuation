import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('🚨 Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    error: true,
    message: error.message || 'Internal Server Error',
    statusCode,
    ...(isProduction
      ? {}
      : {
          stack: error.stack,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        }),
  };

  res.status(statusCode).json(response);
};