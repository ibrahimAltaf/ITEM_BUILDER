import { Router } from "express";
import * as ctrl from "./cart.controller";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * tags:
 *   - name: Cart
 *     description: Shopping cart (authenticated)
 */

/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", ctrl.getMyCart);

/**
 * @openapi
 * /api/v1/cart:
 *   put:
 *     summary: Replace entire cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 */
router.put("/", ctrl.replaceCart);

/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 */
router.delete("/", ctrl.clearMyCart);

export default router;
