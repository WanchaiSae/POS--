import { Request, Response } from "express";
import { Op } from "sequelize";
import Shift from "../model/Shift";
import User from "../model/User";
import Order from "../model/Order";
import { formatThaiDate } from "../utils/formatThaiDate";

const formatShift = (shift: Shift) => {
  const shiftData = shift.toJSON() as any;
  return {
    ...shiftData,
    opened_at: formatThaiDate(shiftData.opened_at),
    closed_at: formatThaiDate(shiftData.closed_at),
  };
};

// 1. �Դ������ / ���������� Shift (POST /api/shifts)
export const createShift = async (req: Request, res: Response) => {
  try {
    const { user_id, start_amount } = req.body;

    if (!user_id || start_amount === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "��س��к����ʾ�ѡ�ҹ (user_id) ����Թ��������Դ�� (start_amount)",
      });
    }

    // ��Ǩ�ͺ����� User ��������ԧ���
    const userExists = await User.findByPk(user_id);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "��辺�����ž�ѡ�ҹ (user_id) �����к�",
      });
    }

    const openShift = await Shift.findOne({
      where: { user_id, closed_at: null as unknown as string },
    });
    if (openShift) {
      return res.status(400).json({
        success: false,
        message: "��ѡ�ҹ������ѧ�����Դ�С�͹˹��",
        data: formatShift(openShift),
      });
    }

    const newShift = await Shift.create({
      user_id,
      start_amount,
    });

    const shiftData = newShift.toJSON() as any;
    shiftData.opened_at = formatThaiDate(shiftData.opened_at);

    return res.status(201).json({
      success: true,
      message: "�Դ�С�÷ӧҹ�����",
      data: shiftData,
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡���Դ��",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�����šз����� ����������ž�ѡ�ҹ (GET /api/shifts)
export const getShifts = async (req: Request, res: Response) => {
  try {
    const { user_id, open } = req.query;
    const whereClause: any = {};
    if (user_id) whereClause.user_id = Number(user_id);
    if (open === "true") whereClause.closed_at = null;

    const shifts = await Shift.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "role"],
        },
      ],
      order: [["id", "DESC"]],
    });

    const formattedShifts = shifts.map((shift) => {
      const shiftData = shift.toJSON() as any;
      return {
        ...shiftData,
        opened_at: formatThaiDate(shiftData.opened_at),
        closed_at: formatThaiDate(shiftData.closed_at),
      };
    });

    return res.status(200).json({
      success: true,
      total: formattedShifts.length,
      data: formattedShifts,
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����šС�÷ӧҹ",
    });
  }
};

// 3. �֧�����šе�� ID (GET /api/shifts/:id)
export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(Number(id), {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "role"],
        },
      ],
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "��辺�����šС�÷ӧҹ�����к�",
      });
    }

    const shiftData = shift.toJSON() as any;
    shiftData.opened_at = formatThaiDate(shiftData.opened_at);
    shiftData.closed_at = formatThaiDate(shiftData.closed_at);

    return res.status(200).json({
      success: true,
      data: shiftData,
    });
  } catch (error) {
    console.error("Error fetching shift by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����šС�÷ӧҹ",
    });
  }
};

// 4. ��䢢����š� / �Դ�� (PUT /api/shifts/:id)
export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_amount, end_amount, actual_amount, closed_at } = req.body;

    const shift = await Shift.findByPk(Number(id));

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "��辺�����šС�÷ӧҹ�����к�����Ѻ��䢢�����",
      });
    }

    await shift.update({
      start_amount:
        start_amount !== undefined ? start_amount : shift.start_amount,
      end_amount: end_amount !== undefined ? end_amount : shift.end_amount,
      actual_amount:
        actual_amount !== undefined ? actual_amount : shift.actual_amount,
      closed_at: closed_at !== undefined ? closed_at : shift.closed_at,
    });

    const shiftData = shift.toJSON() as any;
    shiftData.opened_at = formatThaiDate(shiftData.opened_at);
    shiftData.closed_at = formatThaiDate(shiftData.closed_at);

    return res.status(200).json({
      success: true,
      message: "�ѻവ�����šС�÷ӧҹ�����",
      data: shiftData,
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢����šС�÷ӧҹ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const closeShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actual_amount } = req.body;
    const shift = await Shift.findByPk(Number(id), {
      include: [{ model: User, as: "user", attributes: ["id", "name", "role"] }],
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "��辺�����šС�÷ӧҹ�����к�",
      });
    }

    if (shift.closed_at) {
      return res.status(400).json({
        success: false,
        message: "�й��١�Դ�����",
        data: formatShift(shift),
      });
    }

    const orders = await Order.findAll({ where: { shift_id: shift.id } });
    const cashSales = orders
      .filter((o) => o.payment_method === "CASH" && o.payment_status === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.net_amount), 0);
    const allSales = orders
      .filter((o) => o.payment_status === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.net_amount), 0);

    const endAmount = Number((Number(shift.start_amount) + cashSales).toFixed(2));
    const counted =
      actual_amount !== undefined ? Number(actual_amount) : endAmount;

    await shift.update({
      end_amount: endAmount,
      actual_amount: counted,
      closed_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "�Դ�С�÷ӧҹ�����",
      data: {
        ...formatShift(shift),
        summary: {
          order_count: orders.length,
          total_sales: Number(allSales.toFixed(2)),
          cash_sales: Number(cashSales.toFixed(2)),
          expected_drawer: endAmount,
          actual_amount: counted,
          difference: Number((counted - endAmount).toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Error closing shift:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ûԴ��",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�����šе�� ID (DELETE /api/shifts/:id)
export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findByPk(Number(id));

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "��辺�����šС�÷ӧҹ�����к�����Ѻź������",
      });
    }

    await shift.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�����šС�÷ӧҹ ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�����šС�÷ӧҹ",
      error: error instanceof Error ? error.message : error,
    });
  }
};
