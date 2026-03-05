import "./config/loadEnv";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB, disconnectDB } from "./db/connect";

async function bootstrap() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running: http://localhost:${env.PORT}`);
    console.log(`📚 Swagger UI:     http://localhost:${env.PORT}/docs`);
    console.log(`🧾 OpenAPI JSON:   http://localhost:${env.PORT}/docs.json`);
  });

  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("❌ Startup error:", err);
  process.exit(1);
});
