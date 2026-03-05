import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { uploadImageFromBuffer, uploadDocument } from "../../utils/cloudinary";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(req: AuthRequest, res: Response): Promise<Response> {
  const file = req.file;
  if (!file) {
    throw new AppError(400, "No file uploaded. Use form field 'image' with a file.");
  }
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    throw new AppError(400, "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.");
  }
  if (file.size > MAX_SIZE) {
    throw new AppError(400, "File too large. Max size 5MB.");
  }

  const result = await uploadImageFromBuffer(file.buffer, file.mimetype);
  return success(res, 200, "Image uploaded.", {
    url: result.url,
    publicId: result.publicId,
  });
}

export async function uploadImages(req: AuthRequest, res: Response): Promise<Response> {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError(400, "No files uploaded. Use form field 'images' with one or more files.");
  }
  if (files.length > 10) {
    throw new AppError(400, "Maximum 10 images per request.");
  }

  const results: { url: string; publicId: string }[] = [];
  for (const file of files) {
    if (!ALLOWED_MIMES.includes(file.mimetype)) continue;
    if (file.size > MAX_SIZE) continue;
    const result = await uploadImageFromBuffer(file.buffer, file.mimetype);
    results.push(result);
  }

  if (results.length === 0) {
    throw new AppError(400, "No valid images. Allowed: JPEG, PNG, WebP, GIF. Max 5MB each.");
  }

  return success(res, 200, "Images uploaded.", {
    images: results,
  });
}

const ALLOWED_DOCUMENT_MIMES = ["application/pdf"];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadDocumentFile(req: AuthRequest, res: Response): Promise<Response> {
  const file = req.file;
  if (!file) {
    throw new AppError(400, "No file uploaded. Use form field 'document' with a PDF file.");
  }
  if (!ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
    throw new AppError(400, "Invalid file type. Allowed: PDF.");
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new AppError(400, "File too large. Max size 10MB.");
  }

  const result = await uploadDocument(file.buffer, file.mimetype);
  return success(res, 200, "Document uploaded.", {
    url: result.url,
    publicId: result.publicId,
  });
}
