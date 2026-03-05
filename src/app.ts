import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import modulesRouter from "./modules";
import { setupDocs } from "./docs/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

function getAllowedOrigins(): string[] {
  const fromEnv = [env.APP_URL, ...env.ALLOWED_ORIGINS].filter(
    (u) => u && /^https?:\/\//.test(u)
  );
  const unique = [...new Set(fromEnv)];
  return unique;
}

const allowedOriginList = getAllowedOrigins();
const isProduction = env.NODE_ENV === "production";

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOriginList.includes(origin)) {
      return callback(null, true);
    }
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  optionsSuccessStatus: 200,
};

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.use("/api/v1", modulesRouter);
  setupDocs(app);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      statusCode: 404,
      message: "Route not found",
    });
  });

  app.use(errorHandler);

  return app;
}
