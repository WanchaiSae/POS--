import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = Router();

// Product changes are reserved for managers and admins. Staff can still read
// the catalog for sales, but cannot mutate products through the API.
router.use((req, res, next) => {
  if (req.method === "GET") return next();
  const role = res.locals.user?.role;
  if (role !== "admin" && role !== "manager") {
    return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์จัดการสินค้า" });
  }
  return next();
});

// Create a new product
router.post("/", createProduct);
// Get all products
router.get("/", getProducts);
// Get product by id
router.get("/:id", getProductById);
// Update product by id
router.put("/:id", updateProduct);
// Delete product by id
router.delete("/:id", deleteProduct);

export default router;
