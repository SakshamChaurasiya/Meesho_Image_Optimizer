import { NextResponse } from "next/server";
import { logger } from "./logger";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown, context = "API Route") {
  logger.error({ err: error, context }, `Error caught in ${context}`);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Fallback for generic errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 500 }
  );
}
