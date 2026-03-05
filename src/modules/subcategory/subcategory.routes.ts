import { Router } from "express";
import * as ctrl from "./subcategory.controller";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";
const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Subcategories
 *     description: Subcategory management
 */

router.get("/category/:categoryId", ctrl.getSubcategoriesByCategory);

/**
 * @openapi
 * /api/v1/subcategories:
 *   get:
 *     summary: List subcategories (public)
 *     tags: [Subcategories]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Subcategories list
 */
router.get("/", ctrl.getSubcategoryList);

/**
 * @openapi
 * /api/v1/subcategories/{id}:
 *   get:
 *     summary: Get subcategory by id (public)
 *     tags: [Subcategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategory found
 */
router.get("/:id", ctrl.getSubcategoryById);

router.use(requireAuth);
router.use(requireRole("admin", "staff"));

/**
 * @openapi
 * /api/v1/subcategories:
 *   post:
 *     summary: Create subcategory (admin/staff)
 *     description: Send image as base64 in JSON (data:image/...;base64,...) or URL. Backend uploads base64 to Cloudinary.
 *     tags: [Subcategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId]
 *             properties:
 *               name: { type: string }
 *               categoryId: { type: string }
 *               description: { type: string }
 *               image: { type: string, description: "Base64 data URL or image URL" }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Subcategory created
 */
router.post("/", ctrl.createSubcategory);

/**
 * @openapi
 * /api/v1/subcategories/{id}:
 *   put:
 *     summary: Update subcategory (admin/staff)
 *     description: Send image as base64 (data:image/...;base64,...) or URL in JSON. Backend uploads base64 to Cloudinary.
 *     tags: [Subcategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               categoryId: { type: string }
 *               description: { type: string }
 *               image: { type: string, description: "Base64 data URL or image URL" }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Subcategory updated
 */
router.put("/:id", ctrl.updateSubcategory);
router.delete("/:id", ctrl.deleteSubcategory);

export default router;
