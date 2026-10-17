import { Request, Response } from "express";
import ProductOption from "../model/ProductOption";

// 1. ����������͡�Թ������� (POST /api/product-options)
export const createProductOption = async (req: Request, res: Response) => {
  try {
    const { group_name, name, extra_price, is_active } = req.body;

    if (!group_name || !name) {
      return res.status(400).json({
        success: false,
        message: "��س��кء����������͡ (group_name) ��Ъ��͵�����͡ (name)",
      });
    }

    const newOption = await ProductOption.create({
      group_name,
      name,
      extra_price: extra_price !== undefined ? extra_price : 0.0,
      is_active: is_active !== undefined ? is_active : true,
    });

    return res.status(201).json({
      success: true,
      message: "����������͡�Թ��������",
      data: newOption,
    });
  } catch (error) {
    console.error("Error creating product option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡������������͡�Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�����ŵ�����͡�Թ��ҷ����� (GET /api/product-options)
export const getProductOptions = async (req: Request, res: Response) => {
  try {
    const options = await ProductOption.findAll({
      order: [
        ["group_name", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      total: options.length,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching product options:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����ŵ�����͡�Թ���",
    });
  }
};

// 3. �֧�����ŵ�����͡�Թ��ҵ�� ID (GET /api/product-options/:id)
export const getProductOptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const option = await ProductOption.findByPk(Number(id));

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "��辺������͡�Թ��ҹ����к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: option,
    });
  } catch (error) {
    console.error("Error fetching product option by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����ŵ�����͡�Թ���",
    });
  }
};

// 4. ��䢢����ŵ�����͡�Թ��ҵ�� ID (PUT /api/product-options/:id)
export const updateProductOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { group_name, name, extra_price, is_active } = req.body;

    const option = await ProductOption.findByPk(Number(id));

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "��辺������͡�Թ��ҹ����к�����Ѻ��䢢�����",
      });
    }

    await option.update({
      group_name: group_name !== undefined ? group_name : option.group_name,
      name: name !== undefined ? name : option.name,
      extra_price: extra_price !== undefined ? extra_price : option.extra_price,
      is_active: is_active !== undefined ? is_active : option.is_active,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢����ŵ�����͡�Թ��������",
      data: option,
    });
  } catch (error) {
    console.error("Error updating product option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢����ŵ�����͡�Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�����ŵ�����͡�Թ��ҵ�� ID (DELETE /api/product-options/:id)
export const deleteProductOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const option = await ProductOption.findByPk(Number(id));

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "��辺������͡�Թ��ҹ����к�����Ѻź������",
      });
    }

    await option.destroy();

    return res.status(200).json({
      success: true,
      message: `ź������͡�Թ��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting product option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�����ŵ�����͡�Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};
