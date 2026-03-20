import { Router } from "express";
import * as ctrl from "./order.controller";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Checkout, tax (TaxJar / CA fallback), Stripe payment
 */

/**
 * @openapi
 * /api/v1/orders/preview:
 *   post:
 *     summary: Preview totals (subtotal + verified Shippo rate + tax)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/preview", ctrl.preview);

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     summary: Create order and Stripe PaymentIntent
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", ctrl.createOrder);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     summary: My recent orders
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", ctrl.listMine);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get my order by id
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", ctrl.getMine);

export default router;
