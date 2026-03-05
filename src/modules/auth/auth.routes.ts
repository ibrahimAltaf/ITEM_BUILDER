import { Router } from "express";
import * as ctrl from "./auth.controller";
import { requireAuth } from "../../middlewares/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterPayload:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - confirmPassword
 *         - phoneNumber
 *       properties:
 *         firstName:
 *           type: string
 *           example: Ibrahim
 *         lastName:
 *           type: string
 *           example: Developer
 *         email:
 *           type: string
 *           example: ibrahim@example.com
 *         password:
 *           type: string
 *           example: password123
 *         confirmPassword:
 *           type: string
 *           example: password123
 *         phoneNumber:
 *           type: string
 *           example: "+923001234567"
 *
 *     VerifyEmailPayload:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           example: ibrahim@example.com
 *         code:
 *           type: string
 *           example: "123456"
 *
 *     LoginPayload:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: ibrahim@example.com
 *         password:
 *           type: string
 *           example: password123
 *
 *     RefreshPayload:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *
 *     ForgotPayload:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           example: ibrahim@example.com
 *
 *     ResetPayload:
 *       type: object
 *       required:
 *         - email
 *         - code
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         email:
 *           type: string
 *           example: ibrahim@example.com
 *         code:
 *           type: string
 *           example: "123456"
 *         newPassword:
 *           type: string
 *           example: newPassword123
 *         confirmPassword:
 *           type: string
 *           example: newPassword123
 *
 *     ChangePasswordPayload:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPayload'
 *     responses:
 *       200:
 *         description: Account created
 */
router.post("/register", ctrl.register);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailPayload'
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post("/verify-email", ctrl.verifyEmail);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginPayload'
 *     responses:
 *       200:
 *         description: Returns accessToken, refreshToken and user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 */
router.post("/login", ctrl.login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshPayload'
 *     responses:
 *       200:
 *         description: New access token
 */
router.post("/refresh", ctrl.refresh);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPayload'
 *     responses:
 *       200:
 *         description: OTP sent to email if account exists
 */
router.post("/forgot-password", ctrl.forgot);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP (from forgot-password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPayload'
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post("/reset-password", ctrl.reset);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password for logged user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordPayload'
 *     responses:
 *       200:
 *         description: Password changed
 */
router.post("/change-password", requireAuth, ctrl.changePassword);

export default router;
