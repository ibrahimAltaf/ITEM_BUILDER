import { Router } from "express";
import * as ctrl from "./category.controller";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";
const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Category management
 */

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: List categories (public)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Categories list
 */
router.get("/", ctrl.getCategoryList);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by id (public)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 */
router.get("/:id", ctrl.getCategoryById);

router.use(requireAuth);
router.use(requireRole("admin", "staff"));

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Create category (admin/staff)
 *     description: Send image as base64 in JSON (e.g. "data:image/png;base64,...") or as URL string. Backend uploads base64 to Cloudinary and saves URL.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: string, description: "Base64 data URL (data:image/...;base64,...) or image URL" }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/", ctrl.createCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update category (admin/staff)
 *     description: Send image as base64 (data:image/...;base64,...) or URL in JSON. Backend uploads base64 to Cloudinary.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: string, description: "Base64 data URL or image URL" }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put("/:id", ctrl.updateCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category (admin/staff)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete("/:id", ctrl.deleteCategory);

export default router;
