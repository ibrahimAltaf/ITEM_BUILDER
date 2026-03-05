import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../utils/AppError";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    cb(new AppError(400, "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.") as unknown as Error);
    return;
  }
  cb(null, true);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("image");

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 10 },
}).array("images", 10);

const DOCUMENT_MIMES = ["application/pdf"];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const documentFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!DOCUMENT_MIMES.includes(file.mimetype)) {
    cb(new AppError(400, "Invalid file type. Allowed: PDF.") as unknown as Error);
    return;
  }
  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
}).single("document");

const productFileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.fieldname === "document") {
    return documentFilter(req, file, cb);
  }
  return fileFilter(req, file, cb);
};

export const uploadProductFiles = multer({
  storage,
  fileFilter: productFileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 12 },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "document", maxCount: 1 },
]);

export function optionalMultipart(
  uploadMiddleware: (req: Request, res: Response, next: NextFunction) => void
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.is("multipart/form-data")) return uploadMiddleware(req, res, next);
    next();
  };
}
