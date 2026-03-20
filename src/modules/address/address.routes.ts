import { Router } from "express";
import * as ctrl from "./address.controller";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * tags:
 *   - name: Addresses
 *     description: Saved shipping addresses (US + APO/FPO/DPO)
 */

/**
 * @openapi
 * /api/v1/addresses:
 *   get:
 *     summary: List my addresses
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", ctrl.listMyAddresses);

/**
 * @openapi
 * /api/v1/addresses:
 *   post:
 *     summary: Create address (supports military APO/FPO/DPO)
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", ctrl.createMyAddress);

/**
 * @openapi
 * /api/v1/addresses/{id}:
 *   patch:
 *     summary: Update address
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 */
router.patch("/:id", ctrl.updateMyAddress);

/**
 * @openapi
 * /api/v1/addresses/{id}:
 *   delete:
 *     summary: Delete address
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 */
router.delete("/:id", ctrl.deleteMyAddress);

export default router;
