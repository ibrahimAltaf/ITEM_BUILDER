import { Router } from "express";
import * as ctrl from "./upload.controller";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";
import { uploadSingle, uploadMultiple, uploadDocument } from "./upload.multer";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "staff"));

/**
 * @openapi
 * tags:
 *   - name: Upload
 *     description: Optional. Use only when you need a URL without creating/updating resource. For Product/Category/Subcategory create or update, send images in the same request (multipart) instead.
 */

/**
 * @openapi
 * /api/v1/upload:
 *   post:
 *     summary: Upload single image (optional - admin/staff)
 *     description: Use when you only need a URL. For category/subcategory/product create or update, send the image in that request (multipart) instead.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF. Max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     publicId: { type: string }
 *       400:
 *         description: No file or invalid file
 */
router.post("/", uploadSingle, ctrl.uploadImage);

/**
 * @openapi
 * /api/v1/upload/multiple:
 *   post:
 *     summary: Upload multiple images (optional - admin/staff)
 *     description: Use when you only need URLs. For product create/update, send thumbnail and images in that request (multipart) instead.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url: { type: string }
 *                           publicId: { type: string }
 */
router.post("/multiple", uploadMultiple, ctrl.uploadImages);

/**
 * @openapi
 * /api/v1/upload/document:
 *   post:
 *     summary: Upload document PDF (optional - admin/staff)
 *     description: Use when you only need a URL. For product create/update, send the document file in that request (multipart) instead.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: PDF file (max 10MB)
 *     responses:
 *       200:
 *         description: Document uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     publicId: { type: string }
 *       400:
 *         description: No file or invalid file
 */
router.post("/document", uploadDocument, ctrl.uploadDocumentFile);

export default router;
