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

  /** Shippo (https://goshippo.com/) — live rates from CA to US + military */
  SHIPPO_API_TOKEN: process.env.SHIPPO_API_TOKEN ?? "",
  SHIP_FROM_NAME: process.env.SHIP_FROM_NAME ?? "Warehouse",
  SHIP_FROM_STREET1: process.env.SHIP_FROM_STREET1 ?? "",
  SHIP_FROM_STREET2: process.env.SHIP_FROM_STREET2 ?? "",
  SHIP_FROM_CITY: process.env.SHIP_FROM_CITY ?? "",
  SHIP_FROM_STATE: process.env.SHIP_FROM_STATE ?? "CA",
  SHIP_FROM_ZIP: process.env.SHIP_FROM_ZIP ?? "",
  SHIP_FROM_COUNTRY: process.env.SHIP_FROM_COUNTRY ?? "US",
  SHIP_FROM_PHONE: process.env.SHIP_FROM_PHONE ?? "",
  /** Default parcel when product has no weight (oz) */
  DEFAULT_PARCEL_WEIGHT_OZ: Number(process.env.DEFAULT_PARCEL_WEIGHT_OZ ?? 16),
  DEFAULT_PARCEL_LENGTH_IN: Number(process.env.DEFAULT_PARCEL_LENGTH_IN ?? 10),
  DEFAULT_PARCEL_WIDTH_IN: Number(process.env.DEFAULT_PARCEL_WIDTH_IN ?? 8),
  DEFAULT_PARCEL_HEIGHT_IN: Number(process.env.DEFAULT_PARCEL_HEIGHT_IN ?? 4),

  /** Stripe — cards, ACH, Apple Pay (Link/wallet); PayPal/Venmo often via separate processor */
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  /** TaxJar — accurate US sales tax (recommended for CA seller + all states) */
  TAXJAR_API_KEY: process.env.TAXJAR_API_KEY ?? "",
  /** Fallback % when TaxJar not configured and ship-to is CA (e.g. 0.0875 = 8.75%) */
  CA_FALLBACK_TAX_RATE: Number(process.env.CA_FALLBACK_TAX_RATE ?? 0),

  /** QuickBooks Online — future accounting sync (OAuth in Phase 2) */
  QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID ?? "",
  QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET ?? "",
  QUICKBOOKS_REDIRECT_URI: process.env.QUICKBOOKS_REDIRECT_URI ?? "",
  QUICKBOOKS_ENVIRONMENT: process.env.QUICKBOOKS_ENVIRONMENT ?? "sandbox",
} as const;
