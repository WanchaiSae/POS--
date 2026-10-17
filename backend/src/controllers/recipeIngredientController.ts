import { Request, Response } from "express";
import RecipeIngredient from "../model/RecipeIngredient";
import Product from "../model/Product";
import Ingredient from "../model/Ingredient";

// 1. �����ٵ���ǹ������� (POST /api/recipe-ingredients)
export const createRecipeIngredient = async (req: Request, res: Response) => {
  try {
    const { product_id, ingredient_id, stock_quantity, quantity_required } =
      req.body;

    if (!product_id || !ingredient_id || quantity_required === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "��سҡ�͡���������ú��ǹ (product_id, ingredient_id, quantity_required)",
      });
    }

    // ��Ǩ�ͺ����� Product ��������ԧ���
    const productExists = await Product.findByPk(product_id);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "��辺�Թ��� (product_id) ����к���к�",
      });
    }

    // ��Ǩ�ͺ����� Ingredient ��������ԧ���
    const ingredientExists = await Ingredient.findByPk(ingredient_id);
    if (!ingredientExists) {
      return res.status(404).json({
        success: false,
        message: "��辺�ѵ�شԺ (ingredient_id) ����к���к�",
      });
    }

    const newRecipe = await RecipeIngredient.create({
      product_id,
      ingredient_id,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : 0.0,
      quantity_required,
      last_updated_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "�����ٵ���ǹ��������",
      data: newRecipe,
    });
  } catch (error) {
    console.error("Error creating recipe ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�������ٵ���ǹ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�������ٵ���ǹ��������� ����������� Product ��� Ingredient (GET /api/recipe-ingredients)
export const getRecipeIngredients = async (req: Request, res: Response) => {
  try {
    const recipes = await RecipeIngredient.findAll({
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "base_price"],
        },
        {
          model: Ingredient,
          as: "ingredient",
          attributes: ["id", "name", "unit", "stock_quantity"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: recipes.length,
      data: recipes,
    });
  } catch (error) {
    console.error("Error fetching recipe ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������ٵ���ǹ���",
    });
  }
};

// 3. �֧�������ٵ���ǹ������ ID (GET /api/recipe-ingredients/:id)
export const getRecipeIngredientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await RecipeIngredient.findByPk(Number(id), {
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "base_price"],
        },
        {
          model: Ingredient,
          as: "ingredient",
          attributes: ["id", "name", "unit", "stock_quantity"],
        },
      ],
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "��辺�������ٵ���ǹ��������к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("Error fetching recipe ingredient by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������ٵ���ǹ���",
    });
  }
};

// 4. ��䢢������ٵ���ǹ������ ID (PUT /api/recipe-ingredients/:id)
export const updateRecipeIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { product_id, ingredient_id, stock_quantity, quantity_required } =
      req.body;

    const recipe = await RecipeIngredient.findByPk(Number(id));

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "��辺�������ٵ���ǹ��������к�����Ѻ��䢢�����",
      });
    }

    await recipe.update({
      product_id: product_id !== undefined ? product_id : recipe.product_id,
      ingredient_id:
        ingredient_id !== undefined ? ingredient_id : recipe.ingredient_id,
      stock_quantity:
        stock_quantity !== undefined ? stock_quantity : recipe.stock_quantity,
      quantity_required:
        quantity_required !== undefined
          ? quantity_required
          : recipe.quantity_required,
      last_updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "��䢢������ٵ���ǹ��������",
      data: recipe,
    });
  } catch (error) {
    console.error("Error updating recipe ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢������ٵ���ǹ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�������ٵ���ǹ������ ID (DELETE /api/recipe-ingredients/:id)
export const deleteRecipeIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await RecipeIngredient.findByPk(Number(id));

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "��辺�������ٵ���ǹ��������к�����Ѻź������",
      });
    }

    await recipe.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�ٵ���ǹ��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting recipe ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�������ٵ���ǹ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};
