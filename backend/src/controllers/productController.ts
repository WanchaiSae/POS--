import { Request, Response } from "express";
import Product from "../model/Product";
import Category from "../model/Categorie";
import OrderItem from "../model/OrderItem";
import RecipeIngredient from "../model/RecipeIngredient";

// 1. �����Թ������� (POST /api/products)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { category_id, name, base_price, image_url, is_active } = req.body;

    // ��Ǩ�ͺ�����źѧ�Ѻ��鹰ҹ
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const numericPrice = Number(base_price);
    if (!category_id || !normalizedName || base_price === undefined || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "��سҡ�͡���������ú��ǹ (category_id, name, base_price)",
      });
    }

    // ��Ǩ�ͺ����� Category ��������ԧ���
    const categoryExists = await Category.findByPk(Number(category_id));
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "��辺��Ǵ�����Թ��� (category_id) ����к���к�",
      });
    }

    const newProduct = await Product.create({
      category_id: Number(category_id),
      name: normalizedName,
      base_price: numericPrice,
      image_url,
      is_active: is_active !== undefined ? is_active : true,
    });

    return res.status(201).json({
      success: true,
      message: "�����Թ��������",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�������Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�������Թ��ҷ����� �������������Ǵ���� (GET /api/products)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "is_active"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������Թ���",
    });
  }
};

// 3. �֧�������Թ��ҵ�� ID (GET /api/products/:id)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(Number(id), {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "is_active"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "��辺�Թ��ҹ����к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������Թ���",
    });
  }
};

// 4. ��䢢������Թ��ҵ�� ID (PUT /api/products/:id)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category_id, name, base_price, image_url, is_active } = req.body;

    const product = await Product.findByPk(Number(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "��辺�Թ��ҹ����к�����Ѻ��䢢�����",
      });
    }

    // ����ա������¹ category_id ���������������ԧ���
    if (category_id && category_id !== product.category_id) {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "��辺��Ǵ�����Թ��ҷ���ͧ�������¹����",
        });
      }
    }

    await product.update({
      category_id:
        category_id !== undefined ? category_id : product.category_id,
      name: name !== undefined ? name : product.name,
      base_price: base_price !== undefined ? base_price : product.base_price,
      image_url: image_url !== undefined ? image_url : product.image_url,
      is_active: is_active !== undefined ? is_active : product.is_active,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢������Թ��������",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢������Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�������Թ��ҵ�� ID (DELETE /api/products/:id)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(Number(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "��辺�Թ��ҹ����к�����Ѻź������",
      });
    }

    const hasSalesHistory = (await OrderItem.count({ where: { product_id: product.id } })) > 0;
    if (hasSalesHistory) {
      await product.update({ is_active: false });
      return res.status(200).json({
        success: true,
        message: "สินค้านี้มีประวัติการขาย จึงปิดการขายและเก็บข้อมูลบิลเดิมไว้",
        data: product,
      });
    }

    await RecipeIngredient.destroy({ where: { product_id: product.id } });
    await product.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�Թ��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�������Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};
