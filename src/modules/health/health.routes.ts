import { Router } from "express";
import { getHealth } from "./health.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: APIs status, database connection, aur server info
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API healthy with DB and server details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                 server:
 *                   type: object
 *                   properties:
 *                     port:
 *                       type: number
 *                     url:
 *                       type: string
 *                     host:
 *                       type: string
 *                 apis:
 *                   type: object
 *                   description: Available API groups
 */
router.get("/", getHealth);

export default router;
