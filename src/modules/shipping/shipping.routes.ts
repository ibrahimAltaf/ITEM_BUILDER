import { Router } from "express";
import * as ctrl from "./shipping.controller";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * tags:
 *   - name: Shipping
 *     description: Shippo live rates (CA → US + military)
 */

/**
 * @openapi
 * /api/v1/shipping/rates:
 *   get:
 *     summary: Get Shippo rates for current cart and saved address
 *     tags: [Shipping]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 */
router.get("/rates", ctrl.getRates);

export default router;
