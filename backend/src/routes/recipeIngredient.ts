import { Router } from "express";
import {
  createRecipeIngredient,
  getRecipeIngredients,
  getRecipeIngredientById,
  updateRecipeIngredient,
  deleteRecipeIngredient,
} from "../controllers/recipeIngredientController";

const router = Router();

router.post("/", createRecipeIngredient);
router.get("/", getRecipeIngredients);
router.get("/:id", getRecipeIngredientById);
router.put("/:id", updateRecipeIngredient);
router.delete("/:id", deleteRecipeIngredient);

export default router;
