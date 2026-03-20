import { Router, Request, Response } from "express";
import { env } from "../../config/env";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";
import { success } from "../../utils/response";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Integrations
 *     description: Third-party accounting / payments (QuickBooks, etc.)
 */

/**
 * @openapi
 * /api/v1/integrations/quickbooks/status:
 *   get:
 *     summary: QuickBooks Online connection status (OAuth Phase 2)
 *     tags: [Integrations]
 */
router.get("/quickbooks/status", (_req: Request, res: Response) => {
  const configured = Boolean(
    env.QUICKBOOKS_CLIENT_ID && env.QUICKBOOKS_CLIENT_SECRET
  );
  return success(res, 200, "QuickBooks integration status.", {
    configured,
    environment: env.QUICKBOOKS_ENVIRONMENT,
    note: configured
      ? "OAuth + SalesReceipt sync can be wired here; checkout still uses Stripe for card/ACH/Apple Pay."
      : "Set QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET / QUICKBOOKS_REDIRECT_URI to enable Intuit OAuth.",
  });
});

/**
 * @openapi
 * /api/v1/integrations/quickbooks/connect-placeholder:
 *   post:
 *     summary: Placeholder — start QuickBooks OAuth (implement redirect to Intuit)
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  "/quickbooks/connect-placeholder",
  requireAuth,
  requireRole("admin"),
  (_req: Request, res: Response) => {
    return success(res, 501, "QuickBooks OAuth not implemented yet. Use Stripe for payments; export to QBO manually or add intuit-oauth + SalesReceipt API.", {
      docs: "https://developer.intuit.com/app/developer/qbo/docs/develop",
    });
  }
);

export default router;
