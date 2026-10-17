import { Request, Response } from "express";
import { Op } from "sequelize";
import sequelize from "../config/database";
import Order from "../model/Order";
import Shift from "../model/Shift";
import User from "../model/User";
import Customer from "../model/Customer";
import OrderItem from "../model/OrderItem";
import Product from "../model/Product";
import OrderItemOption from "../model/OrderItemOption";
import ProductOption from "../model/ProductOption";
import RecipeIngredient from "../model/RecipeIngredient";
import Ingredient from "../model/Ingredient";
import PointLog from "../model/PointLog";
import { formatThaiDate } from "../utils/formatThaiDate";
import {
  calcAutoDiscountRate,
  calcPointsEarned,
  calcTier,
} from "../utils/loyalty";

const orderIncludes = [
  { model: Shift, as: "shift" },
  { model: User, as: "user", attributes: ["id", "name", "role"] },
  {
    model: Customer,
    as: "customer",
    attributes: [
      "id",
      "phone_number",
      "first_name",
      "last_name",
      "points",
      "tier",
    ],
  },
  {
    model: OrderItem,
    as: "items",
    include: [
      { model: Product, as: "product" },
      {
        model: OrderItemOption,
        as: "selected_options",
        include: [{ model: ProductOption, as: "product_option" }],
      },
    ],
  },
];

const generateOrderNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `ORD-${y}${m}${d}-`;
  const latest = await Order.findOne({
    where: { order_number: { [Op.like]: `${prefix}%` } },
    order: [["id", "DESC"]],
  });
  const next = latest
    ? Number(String(latest.order_number).split("-").pop()) + 1
    : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
};

const formatOrder = (order: Order) => {
  const orderData = order.toJSON() as any;
  return {
    ...orderData,
    created_at: formatThaiDate(orderData.created_at),
  };
};

export const checkoutOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const {
      shift_id,
      user_id,
      customer_id,
      discount_amount,
      payment_method,
      items,
    } = req.body as {
      shift_id?: number;
      user_id?: number;
      customer_id?: number;
      discount_amount?: number;
      payment_method?: string;
      items?: Array<{
        product_id: number;
        quantity: number;
        option_ids?: number[];
      }>;
    };

    if (!payment_method || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "��س��к� payment_method �����¡���Թ��� (items)",
      });
    }

    const allowedMethods = ["CASH", "QR_CODE", "CREDIT_CARD"];
    if (!allowedMethods.includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "��ͧ�ҧ�����Թ��ͧ�� CASH, QR_CODE ���� CREDIT_CARD",
      });
    }

    let customer: Customer | null = null;
    if (customer_id) {
      customer = await Customer.findByPk(customer_id, { transaction: t });
      if (!customer) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "��辺�������١��ҷ���к�",
        });
      }
    }

    let totalAmount = 0;
    const preparedItems: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
      options: ProductOption[];
    }> = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.product_id || !quantity || quantity <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "��¡���Թ������١��ͧ",
        });
      }

      const product = await Product.findByPk(item.product_id, {
        transaction: t,
      });
      if (!product || !product.is_active) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `��辺�Թ��� ID ${item.product_id} ���ͻԴ��â������`,
        });
      }

      const optionIds = Array.from(new Set(item.option_ids || []));
      const options = optionIds.length
        ? await ProductOption.findAll({
            where: { id: optionIds, is_active: true },
            transaction: t,
          })
        : [];

      if (options.length !== optionIds.length) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "�յ�����͡�Թ������١��ͧ���ͻԴ��ҹ����",
        });
      }

      const extra = options.reduce(
        (sum, opt) => sum + Number(opt.extra_price),
        0,
      );
      const unitPrice = Number(product.base_price) + extra;
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;
      preparedItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        subtotal,
        options,
      });
    }

    const autoRate = customer ? calcAutoDiscountRate(customer.tier) : 0;
    const autoDiscount = Number((totalAmount * autoRate).toFixed(2));
    const discount =
      discount_amount !== undefined
        ? Math.max(0, Number(discount_amount))
        : autoDiscount;
    const netAmount = Number(Math.max(0, totalAmount - discount).toFixed(2));
    const pointsEarned = customer ? calcPointsEarned(netAmount) : 0;
    const orderNumber = await generateOrderNumber();

    const newOrder = await Order.create(
      {
        order_number: orderNumber,
        shift_id: shift_id || undefined,
        user_id: user_id || undefined,
        customer_id: customer_id || undefined,
        total_amount: Number(totalAmount.toFixed(2)),
        discount_amount: Number(discount.toFixed(2)),
        net_amount: netAmount,
        payment_method,
        payment_status: "COMPLETED",
        points_earned: pointsEarned,
      },
      { transaction: t },
    );

    for (const item of preparedItems) {
      const orderItem = await OrderItem.create(
        {
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        },
        { transaction: t },
      );

      for (const option of item.options) {
        await OrderItemOption.create(
          {
            order_item_id: orderItem.id,
            option_id: option.id,
            extra_price: Number(option.extra_price),
          },
          { transaction: t },
        );
      }

      const recipes = await RecipeIngredient.findAll({
        where: { product_id: item.product_id },
        transaction: t,
      });

      for (const recipe of recipes) {
        const ingredient = await Ingredient.findByPk(recipe.ingredient_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!ingredient) continue;
        const used = Number(recipe.quantity_required) * item.quantity;
        const currentStock = Number(ingredient.stock_quantity);
        if (currentStock < used) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: `�ѵ�شԺ ${ingredient.name} ������������§��`,
          });
        }
        const nextStock = currentStock - used;
        await ingredient.update({ stock_quantity: nextStock }, { transaction: t });
      }
    }

    if (customer && pointsEarned > 0) {
      const nextPoints = Number(customer.points) + pointsEarned;
      await customer.update(
        {
          points: nextPoints,
          tier: calcTier(nextPoints),
        },
        { transaction: t },
      );
      await PointLog.create(
        {
          customer_id: customer.id,
          order_id: newOrder.id,
          points_changed: pointsEarned,
          type: "EARN",
        },
        { transaction: t },
      );
    }

    await t.commit();

    const fullOrder = await Order.findByPk(newOrder.id, {
      include: orderIncludes,
    });

    return res.status(201).json({
      success: true,
      message: "�Դ�Թ�͡��������",
      data: fullOrder ? formatOrder(fullOrder) : formatOrder(newOrder),
    });
  } catch (error) {
    await t.rollback();
    console.error("Error checking out order:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�äԴ�Թ�͡���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      order_number,
      shift_id,
      user_id,
      customer_id,
      total_amount,
      discount_amount,
      net_amount,
      payment_method,
      payment_status,
      points_earned,
    } = req.body;

    if (
      !order_number ||
      total_amount === undefined ||
      net_amount === undefined ||
      !payment_method
    ) {
      return res.status(400).json({
        success: false,
        message:
          "��سҡ�͡�����Ũ������ú��ǹ (order_number, total_amount, net_amount, payment_method)",
      });
    }

    const newOrder = await Order.create({
      order_number,
      shift_id,
      user_id,
      customer_id,
      total_amount,
      discount_amount: discount_amount !== undefined ? discount_amount : 0.0,
      net_amount,
      payment_method,
      payment_status: payment_status || "COMPLETED",
      points_earned: points_earned !== undefined ? points_earned : 0,
    });

    return res.status(201).json({
      success: true,
      message: "���ҧ�������������",
      data: formatOrder(newOrder),
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�����ҧ��������",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.query;
    const whereClause: any = {};
    if (shift_id) whereClause.shift_id = Number(shift_id);

    const orders = await Order.findAll({
      where: whereClause,
      include: orderIncludes,
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: orders.length,
      data: orders.map(formatOrder),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������������",
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(Number(id), { include: orderIncludes });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "��辺������������������к�",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatOrder(order),
    });
  } catch (error) {
    console.error("Error fetching order by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧��������������",
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      order_number,
      shift_id,
      user_id,
      customer_id,
      total_amount,
      discount_amount,
      net_amount,
      payment_method,
      payment_status,
      points_earned,
    } = req.body;

    const order = await Order.findByPk(Number(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "��辺������������������к�����Ѻ��䢢�����",
      });
    }

    await order.update({
      order_number:
        order_number !== undefined ? order_number : order.order_number,
      shift_id: shift_id !== undefined ? shift_id : order.shift_id,
      user_id: user_id !== undefined ? user_id : order.user_id,
      customer_id: customer_id !== undefined ? customer_id : order.customer_id,
      total_amount:
        total_amount !== undefined ? total_amount : order.total_amount,
      discount_amount:
        discount_amount !== undefined ? discount_amount : order.discount_amount,
      net_amount: net_amount !== undefined ? net_amount : order.net_amount,
      payment_method:
        payment_method !== undefined ? payment_method : order.payment_method,
      payment_status:
        payment_status !== undefined ? payment_status : order.payment_status,
      points_earned:
        points_earned !== undefined ? points_earned : order.points_earned,
    });

    return res.status(200).json({
      success: true,
      message: "��䢢������������������",
      data: formatOrder(order),
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢�������������",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(Number(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "��辺������������������к�����Ѻź������",
      });
    }

    await order.destroy();
    return res.status(200).json({
      success: true,
      message: `ź�������������� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź��������������",
      error: error instanceof Error ? error.message : error,
    });
  }
};
