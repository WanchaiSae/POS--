import { Router } from "express";
import {
  createProductOption,
  getProductOptions,
  getProductOptionById,
  updateProductOption,
  deleteProductOption,
} from "../controllers/productOptionController";

const router = Router();

// Create Product Option (POST)
router.post("/", createProductOption);

// Get All Product Options (GET)
router.get("/", getProductOptions);

// Get Product Option by ID (GET)
router.get("/:id", getProductOptionById);

// Update Product Option by ID (PUT)
router.put("/:id", updateProductOption);

// Delete Product Option by ID (DELETE)
router.delete("/:id", deleteProductOption);

export default router;
