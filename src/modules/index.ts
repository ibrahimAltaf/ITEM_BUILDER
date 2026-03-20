import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import healthRoutes from "./health/health.routes";
import adminRoutes from "./admin/admin.routes";
import categoryRoutes from "./category/category.routes";
import subcategoryRoutes from "./subcategory/subcategory.routes";
import productRoutes from "./product/product.routes";
import uploadRoutes from "./upload/upload.routes";
import cartRoutes from "./cart/cart.routes";
import addressRoutes from "./address/address.routes";
import shippingRoutes from "./shipping/shipping.routes";
import orderRoutes from "./order/order.routes";
import integrationsRoutes from "./integrations/quickbooks.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);
router.use("/products", productRoutes);
router.use("/upload", uploadRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/shipping", shippingRoutes);
router.use("/orders", orderRoutes);
router.use("/integrations", integrationsRoutes);

export default router;