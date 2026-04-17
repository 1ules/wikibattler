import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  const message = err instanceof Error ? err.message.split('\n')[0] : 'An unexpected error occurred.';
  console.error('[Unhandled error]', err);
  res.status(500).json({
    error: 'InternalServerError',
    message,
    statusCode: 500,
  });
}
