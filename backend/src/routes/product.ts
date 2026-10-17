import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = Router();

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
