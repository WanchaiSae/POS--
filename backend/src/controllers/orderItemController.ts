import { Request, Response } from "express";
import OrderItem from "../model/OrderItem";
import Order from "../model/Order";
import Product from "../model/Product";

// 1. ������¡���Թ���������������� (POST /api/order-items)
export const createOrderItem = async (req: Request, res: Response) => {
  try {
    const { order_id, product_id, quantity, unit_price } = req.body;

    if (
      !order_id ||
      !product_id ||
      quantity === undefined ||
      unit_price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "��سҡ�͡���������ú��ǹ (order_id, product_id, quantity, unit_price)",
      });
    }

    // ��Ǩ�ͺ����� Order ��������ԧ���
    const orderExists = await Order.findByPk(order_id);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: "��辺�Ţ�������� (order_id) ����к���к�",
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

    // �ӹǳ Subtotal �ѵ��ѵ� (�ӹǹ * �Ҥҵ��˹���)
    const subtotal = Number(quantity) * Number(unit_price);

    const newOrderItem = await OrderItem.create({
      order_id,
      product_id,
      quantity,
      unit_price,
      subtotal,
    });

    return res.status(201).json({
      success: true,
      message: "������¡���Թ�����������������",
      data: newOrderItem,
    });
  } catch (error) {
    console.error("Error creating order item:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��������¡���Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧��������¡���Թ��ҷ����� ����������� Order ��� Product (GET /api/order-items)
export const getOrderItems = async (req: Request, res: Response) => {
  try {
    const orderItems = await OrderItem.findAll({
      include: [
        { model: Order, as: "order", attributes: ["id", "order_number"] },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "base_price"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      total: orderItems.length,
      data: orderItems,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������¡���Թ���",
    });
  }
};

// 3. �֧��������¡���Թ��ҵ�� ID (GET /api/order-items/:id)
export const getOrderItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await OrderItem.findByPk(Number(id), {
      include: [
        { model: Order, as: "order", attributes: ["id", "order_number"] },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "base_price"],
        },
      ],
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "��辺��¡���Թ��ҹ����к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: orderItem,
    });
  } catch (error) {
    console.error("Error fetching order item by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������¡���Թ���",
    });
  }
};

// 4. ��䢢�������¡���Թ��ҵ�� ID (PUT /api/order-items/:id)
export const updateOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order_id, product_id, quantity, unit_price } = req.body;

    const orderItem = await OrderItem.findByPk(Number(id));

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "��辺��¡���Թ��ҹ����к�����Ѻ��䢢�����",
      });
    }

    const updatedQuantity =
      quantity !== undefined ? quantity : orderItem.quantity;
    const updatedUnitPrice =
      unit_price !== undefined ? unit_price : orderItem.unit_price;
    const subtotal = Number(updatedQuantity) * Number(updatedUnitPrice); // �ӹǳ Subtotal ��������

    await orderItem.update({
      order_id: order_id !== undefined ? order_id : orderItem.order_id,
      product_id: product_id !== undefined ? product_id : orderItem.product_id,
      quantity: updatedQuantity,
      unit_price: updatedUnitPrice,
      subtotal,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢�������¡���Թ��������",
      data: orderItem,
    });
  } catch (error) {
    console.error("Error updating order item:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢�������¡���Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź��������¡���Թ��ҵ�� ID (DELETE /api/order-items/:id)
export const deleteOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderItem = await OrderItem.findByPk(Number(id));

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "��辺��¡���Թ��ҹ����к�����Ѻź������",
      });
    }

    await orderItem.destroy();

    return res.status(200).json({
      success: true,
      message: `ź��¡���Թ��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting order item:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź��������¡���Թ���",
      error: error instanceof Error ? error.message : error,
    });
  }
};
