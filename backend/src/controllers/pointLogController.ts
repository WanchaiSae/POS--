import { Request, Response } from "express";
import PointLog from "../model/PointLog";
import Customer from "../model/Customer";
import Order from "../model/Order";

// 🛠? �ѧ��ѹ��ҧ����Ѻ�ŧ Date ���ٻẺ�� (�� 15/10/2569 - 15:26)
const formatThaiDate = (dateInput: Date | string | undefined) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

// 1. �ѹ�֡����ѵ�������� (POST /api/point-logs)
export const createPointLog = async (req: Request, res: Response) => {
  try {
    const { customer_id, order_id, points_changed, type } = req.body;

    if (points_changed === undefined || !type) {
      return res.status(400).json({
        success: false,
        message:
          "��سҡ�͡�����ŷ��������ú��ǹ (points_changed, type)",
      });
    }

    // ��Ǩ�ͺ����� Customer ��������ԧ��� (�ҡ�ա���к� customer_id)
    if (customer_id) {
      const customerExists = await Customer.findByPk(customer_id);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: "��辺�������١��� (customer_id) ����к���к�",
        });
      }
    }

    // ��Ǩ�ͺ����� Order ��������ԧ��� (�ҡ�ա���к� order_id)
    if (order_id) {
      const orderExists = await Order.findByPk(order_id);
      if (!orderExists) {
        return res.status(404).json({
          success: false,
          message: "��辺�������������� (order_id) ����к���к�",
        });
      }
    }

    const newPointLog = await PointLog.create({
      customer_id: customer_id || null,
      order_id: order_id || null,
      points_changed: Number(points_changed),
      type,
    });

    const logData = newPointLog.toJSON() as any;
    logData.created_at = formatThaiDate(logData.created_at);

    return res.status(201).json({
      success: true,
      message: "�ѹ�֡����ѵ���������",
      data: logData,
    });
  } catch (error) {
    console.error("Error creating point log:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�úѹ�֡����ѵ����",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�����Ż���ѵ���������� ����� Filter ��Т����� Customer / Order (GET /api/point-logs)
export const getPointLogs = async (req: Request, res: Response) => {
  try {
    const { customer_id, order_id, type } = req.query;

    const whereClause: any = {};
    if (customer_id) whereClause.customer_id = Number(customer_id);
    if (order_id) whereClause.order_id = Number(order_id);
    if (type) whereClause.type = String(type);

    const pointLogs = await PointLog.findAll({
      where: whereClause,
      include: [
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
          model: Order,
          as: "order",
          attributes: ["id", "order_number", "net_amount", "payment_status"],
        },
      ],
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    const formattedPointLogs = pointLogs.map((log) => {
      const logData = log.toJSON() as any;
      return {
        ...logData,
        created_at: formatThaiDate(logData.created_at),
      };
    });

    return res.status(200).json({
      success: true,
      total: formattedPointLogs.length,
      data: formattedPointLogs,
    });
  } catch (error) {
    console.error("Error fetching point logs:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����Ż���ѵ����",
    });
  }
};

// 3. �֧�����Ż���ѵ������� ID (GET /api/point-logs/:id)
export const getPointLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pointLog = await PointLog.findByPk(Number(id), {
      include: [
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
          model: Order,
          as: "order",
          attributes: ["id", "order_number", "net_amount", "payment_status"],
        },
      ],
    });

    if (!pointLog) {
      return res.status(404).json({
        success: false,
        message: "��辺�����Ż���ѵ���������к�",
      });
    }

    const logData = pointLog.toJSON() as any;
    logData.created_at = formatThaiDate(logData.created_at);

    return res.status(200).json({
      success: true,
      data: logData,
    });
  } catch (error) {
    console.error("Error fetching point log by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�����Ż���ѵ����",
    });
  }
};

// 4. ��䢢����Ż���ѵ������� ID (PUT /api/point-logs/:id)
export const updatePointLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customer_id, order_id, points_changed, type } = req.body;

    const pointLog = await PointLog.findByPk(Number(id));

    if (!pointLog) {
      return res.status(404).json({
        success: false,
        message: "��辺�����Ż���ѵ���������к�����Ѻ��䢢�����",
      });
    }

    // ��Ǩ�ͺ customer_id �ҡ�ա������¹
    if (customer_id !== undefined && customer_id !== null) {
      const customerExists = await Customer.findByPk(customer_id);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: "��辺�������١��� (customer_id) ����к���к�",
        });
      }
    }

    // ��Ǩ�ͺ order_id �ҡ�ա������¹
    if (order_id !== undefined && order_id !== null) {
      const orderExists = await Order.findByPk(order_id);
      if (!orderExists) {
        return res.status(404).json({
          success: false,
          message: "��辺�������������� (order_id) ����к���к�",
        });
      }
    }

    await pointLog.update({
      customer_id:
        customer_id !== undefined ? customer_id : pointLog.customer_id,
      order_id: order_id !== undefined ? order_id : pointLog.order_id,
      points_changed:
        points_changed !== undefined
          ? Number(points_changed)
          : pointLog.points_changed,
      type: type !== undefined ? type : pointLog.type,
    });

    const logData = pointLog.toJSON() as any;
    logData.created_at = formatThaiDate(logData.created_at);

    return res.status(200).json({
      success: true,
      message: "��䢢����Ż���ѵ���������",
      data: logData,
    });
  } catch (error) {
    console.error("Error updating point log:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢����Ż���ѵ����",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�����Ż���ѵ������� ID (DELETE /api/point-logs/:id)
export const deletePointLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pointLog = await PointLog.findByPk(Number(id));

    if (!pointLog) {
      return res.status(404).json({
        success: false,
        message: "��辺�����Ż���ѵ���������к�����Ѻź������",
      });
    }

    await pointLog.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�����Ż���ѵ���� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting point log:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�����Ż���ѵ����",
      error: error instanceof Error ? error.message : error,
    });
  }
};
