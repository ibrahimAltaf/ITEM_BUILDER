import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import modulesRouter from "./modules";
import { stripeWebhookHandler } from "./modules/payments/stripe.webhook";
import { setupDocs } from "./docs/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const corsOptions: cors.CorsOptions = {
  // Allow all origins (useful for development and public APIs).
  // With `credentials: true`, the CORS package will echo back the requesting origin.
  origin: true,
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
  /** Stripe webhooks require raw body for signature verification */
  app.post(
    "/api/v1/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  // Detailed request logs for debugging API traffic.
  // Format includes method, URL, status, content-length, and latency.
  app.use(
    morgan(
      ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
    )
  );

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
