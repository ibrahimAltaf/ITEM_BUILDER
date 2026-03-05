import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import healthRoutes from "./health/health.routes";
import adminRoutes from "./admin/admin.routes";
import categoryRoutes from "./category/category.routes";
import subcategoryRoutes from "./subcategory/subcategory.routes";
import productRoutes from "./product/product.routes";
import uploadRoutes from "./upload/upload.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);
router.use("/products", productRoutes);
router.use("/upload", uploadRoutes);

export default router;