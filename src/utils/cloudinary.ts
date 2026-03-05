import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { AppError } from "./AppError";

const FOLDER = "item-builder";

export function initCloudinary(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = FOLDER
): Promise<UploadResult> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, "Cloudinary is not configured. Set CLOUDINARY_* in .env");
  }
  initCloudinary();

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });

  if (!result.secure_url) {
    throw new AppError(502, "Cloudinary upload failed");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function uploadImageFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  return uploadImage(buffer, mimeType);
}

const BASE64_DATA_URL = /^data:([^/]+\/[^;]+);base64,(.+)$/;

export function parseBase64DataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } | null {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const match = dataUrl.match(BASE64_DATA_URL);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  return buffer.length ? { buffer, mimeType } : null;
}

export function isImageBase64(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = parseBase64DataUrl(value);
  return parsed !== null && parsed.mimeType.startsWith("image/");
}

export function isPdfBase64(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = parseBase64DataUrl(value);
  return parsed !== null && parsed.mimeType === "application/pdf";
}

export async function uploadImageFromBase64(dataUrl: string): Promise<UploadResult> {
  const parsed = parseBase64DataUrl(dataUrl);
  if (!parsed || !parsed.mimeType.startsWith("image/")) {
    throw new AppError(400, "Invalid base64 image. Use data:image/...;base64,...");
  }
  return uploadImageFromBuffer(parsed.buffer, parsed.mimeType);
}

export async function uploadDocumentFromBase64(dataUrl: string): Promise<UploadResult> {
  const parsed = parseBase64DataUrl(dataUrl);
  if (!parsed || parsed.mimeType !== "application/pdf") {
    throw new AppError(400, "Invalid base64 document. Use data:application/pdf;base64,...");
  }
  return uploadDocument(parsed.buffer, parsed.mimeType);
}

export async function uploadDocument(
  buffer: Buffer,
  mimeType: string,
  folder: string = FOLDER
): Promise<UploadResult> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, "Cloudinary is not configured. Set CLOUDINARY_* in .env");
  }
  initCloudinary();

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `${folder}/documents`,
    resource_type: "raw",
  });

  if (!result.secure_url) {
    throw new AppError(502, "Cloudinary upload failed");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
