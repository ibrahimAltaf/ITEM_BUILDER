import { Response } from "express";

export function success(
  res: Response,
  statusCode: number,
  message: string,
  data?: object
) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    ...(data !== undefined && { data }),
  });
}
