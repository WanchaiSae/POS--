import { Request, Response } from "express";
import OrderItemOption from "../model/OrderItemOption";
import OrderItem from "../model/OrderItem";
import ProductOption from "../model/ProductOption";

// 1. ����������͡��������¡���Թ������� (POST /api/order-item-options)
export const createOrderItemOption = async (req: Request, res: Response) => {
  try {
    const { order_item_id, option_id, extra_price } = req.body;

    if (!order_item_id || !option_id) {
      return res.status(400).json({
        success: false,
        message:
          "��س��к�������¡���Թ��� (order_item_id) ������ʵ�����͡ (option_id)",
      });
    }

    // ��Ǩ�ͺ����� OrderItem ��������ԧ���
    const orderItemExists = await OrderItem.findByPk(order_item_id);
    if (!orderItemExists) {
      return res.status(404).json({
        success: false,
        message: "��辺��¡���Թ��� (order_item_id) ����к���к�",
      });
    }

    // ��Ǩ�ͺ����� ProductOption ��������ԧ���
    const optionExists = await ProductOption.findByPk(option_id);
    if (!optionExists) {
      return res.status(404).json({
        success: false,
        message: "��辺������͡�Թ��� (option_id) ����к���к�",
      });
    }

    const newOptionMapping = await OrderItemOption.create({
      order_item_id,
      option_id,
      extra_price:
        extra_price !== undefined ? extra_price : optionExists.extra_price, // ���������� �д֧�Ҥҵ�駵鹨ҡ���ҧ product_options ����
    });

    return res.status(201).json({
      success: true,
      message: "�ѹ�֡������͡������Թ��������",
      data: newOptionMapping,
    });
  } catch (error) {
    console.error("Error creating order item option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�úѹ�֡������͡�����",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�����ŵ�����͡����������� �����������§������ (GET /api/order-item-options)
export const getOrderItemOptions = async (req: Request, res: Response) => {
  try {
    const options = await OrderItemOption.findAll({
      include: [
        {
          model: OrderItem,
          as: "order_item",
          attributes: ["id", "quantity", "unit_price", "subtotal"],
        },
        {
          model: ProductOption,
          as: "product_option",
          attributes: ["id", "group_name", "name", "extra_price"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: options.length,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching order item options:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����ŵ�����͡�����",
    });
  }
};

// 3. �֧�����ŵ�����͡�������� ID (GET /api/order-item-options/:id)
export const getOrderItemOptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const optionMapping = await OrderItemOption.findByPk(Number(id), {
      include: [
        {
          model: OrderItem,
          as: "order_item",
          attributes: ["id", "quantity", "unit_price", "subtotal"],
        },
        {
          model: ProductOption,
          as: "product_option",
          attributes: ["id", "group_name", "name", "extra_price"],
        },
      ],
    });

    if (!optionMapping) {
      return res.status(404).json({
        success: false,
        message: "��辺�����ŵ�����͡����������к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: optionMapping,
    });
  } catch (error) {
    console.error("Error fetching order item option by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����ŵ�����͡�����",
    });
  }
};

// 4. ��䢢����ŵ�����͡�������� ID (PUT /api/order-item-options/:id)
export const updateOrderItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order_item_id, option_id, extra_price } = req.body;

    const optionMapping = await OrderItemOption.findByPk(Number(id));

    if (!optionMapping) {
      return res.status(404).json({
        success: false,
        message: "��辺�����ŵ�����͡����������к�����Ѻ��䢢�����",
      });
    }

    await optionMapping.update({
      order_item_id:
        order_item_id !== undefined
          ? order_item_id
          : optionMapping.order_item_id,
      option_id: option_id !== undefined ? option_id : optionMapping.option_id,
      extra_price:
        extra_price !== undefined ? extra_price : optionMapping.extra_price,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢����ŵ�����͡����������",
      data: optionMapping,
    });
  } catch (error) {
    console.error("Error updating order item option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢����ŵ�����͡�����",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�����ŵ�����͡�������� ID (DELETE /api/order-item-options/:id)
export const deleteOrderItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const optionMapping = await OrderItemOption.findByPk(Number(id));

    if (!optionMapping) {
      return res.status(404).json({
        success: false,
        message: "��辺�����ŵ�����͡����������к�����Ѻź������",
      });
    }

    await optionMapping.destroy();

    return res.status(200).json({
      success: true,
      message: `ź������͡����� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting order item option:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�����ŵ�����͡�����",
      error: error instanceof Error ? error.message : error,
    });
  }
};
