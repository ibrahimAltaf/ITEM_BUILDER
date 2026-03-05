const parseOrigins = (value: string | undefined): string[] => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  APP_URL: process.env.APP_URL ?? "http://localhost:8080",
  ALLOWED_ORIGINS: parseOrigins(process.env.ALLOWED_ORIGINS),

  MONGO_URI: process.env.MONGO_URI ?? "",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "refresh_secret",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? "30d",

  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
} as const;
