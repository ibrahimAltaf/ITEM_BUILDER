import { Router } from "express";
import * as ctrl from "./admin.controller";
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

export default router;
