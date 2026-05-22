import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import appError from "./appError";
import envVars from "../config/envars";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: any[] = [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";

    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  else if (err instanceof appError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  else {
    message = err?.message || message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors, 
    stack: envVars.NODE_ENV === "Development" ? err.stack : undefined,
  });
};