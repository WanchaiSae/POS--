import { Request, Response } from "express";
import Category from "../model/Categorie";

// 1. ������Ǵ�����Թ������� (POST /api/categories)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "��س��кت�����Ǵ�����Թ��� (name)",
      });
    }

    const newCategory = await Category.create({
      name,
      is_active: is_active !== undefined ? is_active : true,
    });

    return res.status(201).json({
      success: true,
      message: "������Ǵ�����Թ��������",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��������Ǵ�����Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧��������Ǵ��������� (GET /api/categories)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������Ǵ����",
    });
  }
};

// 3. �֧��������Ǵ������¤�/����ʹ� (GET /api/categories/:id)
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "��辺��Ǵ�����Թ��ҹ����к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������Ǵ����",
    });
  }
};

// 4. ��䢢�������Ǵ������ ID (PUT /api/categories/:id)
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const category = await Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "��辺��Ǵ�����Թ��ҹ����к�����Ѻ��䢢�����",
      });
    }

    await category.update({
      name: name !== undefined ? name : category.name,
      is_active: is_active !== undefined ? is_active : category.is_active,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢�������Ǵ�����Թ��������",
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢�����",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź��������Ǵ������ ID (DELETE /api/categories/:id)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "��辺��Ǵ�����Թ��ҹ����к�����Ѻź������",
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: `ź��Ǵ�����Թ��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź������",
      error: error instanceof Error ? error.message : error,
    });
  }
};
