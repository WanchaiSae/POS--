import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categorieController";

const router = Router();

// Create a new category
router.post("/", createCategory);
// Get all categories
router.get("/", getCategories);
// Get category by id
router.get("/:id", getCategoryById);
// Update category by id
router.put("/:id", updateCategory);
// Delete category by id
router.delete("/:id", deleteCategory);

export default router;
