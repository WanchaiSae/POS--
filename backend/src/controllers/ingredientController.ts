import { Request, Response } from "express";
import Ingredient from "../model/Ingredient";

// 1. �����ѵ�شԺ���� (POST /api/ingredients)
export const createIngredient = async (req: Request, res: Response) => {
  try {
    const { name, unit, stock_quantity, min_threshold } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: "��س��кت����ѵ�شԺ (name) ���˹��¹Ѻ (unit)",
      });
    }

    const newIngredient = await Ingredient.create({
      name,
      unit,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : 0.0,
      min_threshold: min_threshold !== undefined ? min_threshold : 100.0,
      last_updated_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "�����ѵ�شԺ�����",
      data: newIngredient,
    });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�������ѵ�شԺ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�������ѵ�شԺ������ (GET /api/ingredients)
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const ingredients = await Ingredient.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: ingredients.length,
      data: ingredients,
    });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������ѵ�شԺ",
    });
  }
};

// 3. �֧�������ѵ�شԺ��� ID (GET /api/ingredients/:id)
export const getIngredientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findByPk(Number(id));

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "��辺�ѵ�شԺ�����к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    console.error("Error fetching ingredient by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������ѵ�شԺ",
    });
  }
};

// 4. ��䢢������ѵ�شԺ��� ID (PUT /api/ingredients/:id)
export const updateIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, unit, stock_quantity, min_threshold } = req.body;

    const ingredient = await Ingredient.findByPk(Number(id));

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "��辺�ѵ�شԺ�����к�����Ѻ��䢢�����",
      });
    }

    await ingredient.update({
      name: name !== undefined ? name : ingredient.name,
      unit: unit !== undefined ? unit : ingredient.unit,
      stock_quantity:
        stock_quantity !== undefined
          ? stock_quantity
          : ingredient.stock_quantity,
      min_threshold:
        min_threshold !== undefined ? min_threshold : ingredient.min_threshold,
      last_updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "��䢢������ѵ�شԺ�����",
      data: ingredient,
    });
  } catch (error) {
    console.error("Error updating ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢������ѵ�شԺ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�������ѵ�شԺ��� ID (DELETE /api/ingredients/:id)
export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ingredient = await Ingredient.findByPk(Number(id));

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "��辺�ѵ�شԺ�����к�����Ѻź������",
      });
    }

    await ingredient.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�ѵ�شԺ ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�������ѵ�شԺ",
      error: error instanceof Error ? error.message : error,
    });
  }
};
