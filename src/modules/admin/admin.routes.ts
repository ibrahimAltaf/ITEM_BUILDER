import { Router } from "express";
import * as ctrl from "./admin.controller";
import * as ordCtrl from "./adminOrders.controller";
import * as addrAdmin from "./adminAddresses.controller";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateStaffPayload:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: Ibrahim
 *         lastName:
 *           type: string
 *           example: Developer
 *         email:
 *           type: string
 *           example: staff@example.com
 *         password:
 *           type: string
 *           example: password123
 *
 *     CreateAdminPayload:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: Ibrahim
 *         lastName:
 *           type: string
 *           example: Developer
 *         email:
 *           type: string
 *           example: admin@example.com
 *         password:
 *           type: string
 *           example: password123
 *
 *     UpdateStaffPayload:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 6
 */

/**
 * @openapi
 * /api/v1/admin/staff:
 *   get:
 *     summary: List all staff (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff
 *       403:
 *         description: Forbidden
 */
router.get("/staff", requireRole("admin"), ctrl.getStaffList);

/**
 * @openapi
 * /api/v1/admin/staff:
 *   post:
 *     summary: Create staff (admin or staff only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffPayload'
 *     responses:
 *       201:
 *         description: Staff created
 *       403:
 *         description: Forbidden - staff cannot create admin
 */
router.post("/staff", requireRole("admin", "staff"), ctrl.createStaff);

/**
 * @openapi
 * /api/v1/admin/staff/{id}:
 *   patch:
 *     summary: Edit staff (admin only)
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/UpdateStaffPayload'
 *     responses:
 *       200:
 *         description: Staff updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 */
router.patch("/staff/:id", requireRole("admin"), ctrl.updateStaff);

/**
 * @openapi
 * /api/v1/admin/staff/{id}:
 *   delete:
 *     summary: Remove staff (admin only)
 *     tags: [Admin]
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
 *         description: Staff removed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 */
router.delete("/staff/:id", requireRole("admin"), ctrl.deleteStaff);

/**
 * @openapi
 * /api/v1/admin/admins:
 *   post:
 *     summary: Create admin (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminPayload'
 *     responses:
 *       201:
 *         description: Admin created
 *       403:
 *         description: Forbidden - only admin can create admin
 */
router.post("/admins", requireRole("admin"), ctrl.createAdmin);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/addresses:
 *   get:
 *     summary: List addresses for a customer (admin/staff)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  "/users/:userId/addresses",
  requireRole("admin", "staff"),
  addrAdmin.listUserAddresses
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/addresses:
 *   post:
 *     summary: Create address for a customer
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  "/users/:userId/addresses",
  requireRole("admin", "staff"),
  addrAdmin.createUserAddress
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/addresses/{addressId}:
 *   patch:
 *     summary: Update customer address
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  "/users/:userId/addresses/:addressId",
  requireRole("admin", "staff"),
  addrAdmin.updateUserAddress
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/addresses/{addressId}:
 *   delete:
 *     summary: Delete customer address
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  "/users/:userId/addresses/:addressId",
  requireRole("admin", "staff"),
  addrAdmin.deleteUserAddress
);

/**
 * @openapi
 * /api/v1/admin/orders:
 *   get:
 *     summary: List orders (admin/staff)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/orders", requireRole("admin", "staff"), ordCtrl.listOrders);

/**
 * @openapi
 * /api/v1/admin/orders:
 *   post:
 *     summary: Create order for a customer (COD or Stripe; manual shippingCents if no Shippo)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/orders", requireRole("admin", "staff"), ordCtrl.createAdminOrder);

/**
 * @openapi
 * /api/v1/admin/orders/stats/summary:
 *   get:
 *     summary: Order counts by status + paid revenue (admin/staff)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  "/orders/stats/summary",
  requireRole("admin", "staff"),
  ordCtrl.orderStats
);

/**
 * @openapi
 * /api/v1/admin/orders/stats/revenue/summary:
 *   get:
 *     summary: Paid revenue totals (subtotal + shipping + tax + total)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  "/orders/stats/revenue/summary",
  requireRole("admin", "staff"),
  ordCtrl.revenueSummary
);

/**
 * @openapi
 * /api/v1/admin/orders/stats/revenue/by-payment-method:
 *   get:
 *     summary: Paid revenue split by paymentMethod (cod vs stripe)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  "/orders/stats/revenue/by-payment-method",
  requireRole("admin", "staff"),
  ordCtrl.revenueByPaymentMethod
);

/**
 * @openapi
 * /api/v1/admin/orders/stats/revenue/daily:
 *   get:
 *     summary: Paid daily revenue for last N days
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get(
  "/orders/stats/revenue/daily",
  requireRole("admin", "staff"),
  ordCtrl.revenueDaily
);

/**
 * @openapi
 * /api/v1/admin/orders/{id}:
 *   get:
 *     summary: Get order by id
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/orders/:id", requireRole("admin", "staff"), ordCtrl.getOrder);

/**
 * @openapi
 * /api/v1/admin/orders/{id}:
 *   patch:
 *     summary: Update order status / tracking
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.patch("/orders/:id", requireRole("admin", "staff"), ordCtrl.updateOrder);

export default router;
