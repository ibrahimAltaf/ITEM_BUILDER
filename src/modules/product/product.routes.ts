import { Router } from "express";
import * as ctrl from "./product.controller";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";
const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Product management
 */

router.get("/category/:categoryId", ctrl.getProductsByCategory);
router.get("/subcategory/:subcategoryId", ctrl.getProductsBySubcategory);

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     summary: List products (public) with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: subcategory
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products list with pagination
 */
router.get("/", ctrl.getProductList);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by id (public)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product found
 */
router.get("/:id", ctrl.getProductById);

router.use(requireAuth);
router.use(requireRole("admin", "staff"));

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     summary: Create product (admin/staff)
 *     description: Send thumbnail, images, documentUrl as base64 in JSON (data:image/...;base64,... or data:application/pdf;base64,...). Backend uploads to Cloudinary and saves URLs. Or send URLs directly.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId, price]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               categoryId: { type: string }
 *               subcategoryId: { type: string }
 *               price: { type: number }
 *               thumbnail: { type: string, description: "Base64 data URL or image URL" }
 *               images: { type: array, items: { type: string }, description: "Base64 data URLs or image URLs" }
 *               documentUrl: { type: string, description: "Base64 PDF data URL or document URL" }
 *               sku: { type: string }
 *               stock: { type: number }
 *               options: { type: array, items: { type: object } }
 *               variants: { type: array, items: { type: object } }
 *               addOns: { type: array, items: { type: object } }
 *               attributes: { type: object }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post("/", ctrl.createProduct);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product (admin/staff)
 *     description: Send thumbnail, images, documentUrl as base64 (data:image/...;base64,...) or URLs in JSON. Backend uploads base64 to Cloudinary.
 *     tags: [Products]
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
 *               thumbnail: { type: string, description: "Base64 data URL or image URL" }
 *               images: { type: array, items: { type: string } }
 *               documentUrl: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put("/:id", ctrl.updateProduct);
router.delete("/:id", ctrl.deleteProduct);

/**
 * @openapi
 * /api/v1/products/{id}/stock:
 *   patch:
 *     summary: Update product stock (admin/staff)
 *     tags: [Products]
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
 *             required: [stock]
 *             properties:
 *               stock: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Stock updated
 */
router.patch("/:id/stock", ctrl.updateStock);

export default router;
