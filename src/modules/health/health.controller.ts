import { Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../../config/env";

export function getHealth(_req: Request, res: Response) {
  const readyState = mongoose.connection.readyState;
  const dbConnected = readyState === 1;
  const dbStatus =
    readyState === 1
      ? "connected"
      : readyState === 2
        ? "connecting"
        : readyState === 3
          ? "disconnecting"
          : "disconnected";

  res.json({
    ok: true,
    time: new Date().toISOString(),
    database: {
      connected: dbConnected,
      status: dbStatus,
    },
    server: {
      port: env.PORT,
      host: "localhost",
      url: env.APP_URL,
    },
    apis: {
      health: "GET /api/v1/health",
      auth: "/api/v1/auth",
      docs: "GET /docs",
      openapi: "GET /docs.json",
    },
  });
}
