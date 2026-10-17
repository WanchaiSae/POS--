import { Request, Response } from "express";
import { Op } from "sequelize";
import Customer from "../model/Customer";
import { formatThaiDate } from "../utils/formatThaiDate";

// 1. �����١������� / ��Ѥ���Ҫԡ (POST /api/customers)
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { phone_number, first_name, last_name, points, tier } = req.body;
    const normalizedPhone = typeof phone_number === "string" ? phone_number.replace(/\D/g, "") : "";

    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: "��س��к��������Ѿ�� (phone_number) �ͧ�١���",
      });
    }

    // ��Ǩ�ͺ����������Ѿ������Ѥ���Ҫԡ����������ѧ
    const existingCustomer = await Customer.findOne({
      where: { phone_number: normalizedPhone },
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "�������Ѿ��������Ҫԡ��к���������",
      });
    }

    const newCustomer = await Customer.create({
      phone_number: normalizedPhone,
      first_name: typeof first_name === "string" ? first_name.trim() || undefined : undefined,
      last_name: typeof last_name === "string" ? last_name.trim() || undefined : undefined,
      points: 0,
      tier: "Bronze",
    });

    const customerResponse = {
      ...newCustomer.toJSON(),
      created_at: formatThaiDate(newCustomer.created_at),
    };

    return res.status(201).json({
      success: true,
      message: "��Ѥ���Ҫԡ�١��������",
      data: customerResponse,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����Ѥ���Ҫԡ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. �֧�������١��ҷ����� (GET /api/customers)
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    const whereClause: any = {};
    if (phone) {
      whereClause.phone_number = { [Op.like]: `%${String(phone)}%` };
    }

    const customers = await Customer.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    const formattedCustomers = customers.map((customer) => {
      const custData = customer.toJSON() as any;
      return {
        ...custData,
        created_at: formatThaiDate(custData.created_at),
      };
    });

    return res.status(200).json({
      success: true,
      total: formattedCustomers.length,
      data: formattedCustomers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������١���",
    });
  }
};

// 3. �֧�������١��ҵ�� ID (GET /api/customers/:id)
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(Number(id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "��辺�������١��ҹ����к�",
      });
    }

    const custData = customer.toJSON() as any;
    custData.created_at = formatThaiDate(custData.created_at);

    return res.status(200).json({
      success: true,
      data: custData,
    });
  } catch (error) {
    console.error("Error fetching customer by id:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡�ô֧�������١���",
    });
  }
};

// 4. ��䢢������١��ҵ�� ID (PUT /api/customers/:id)
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone_number, first_name, last_name, points, tier } = req.body;

    const customer = await Customer.findByPk(Number(id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "��辺�������١��ҹ����к�����Ѻ��䢢�����",
      });
    }

    await customer.update({
      phone_number:
        phone_number !== undefined ? phone_number : customer.phone_number,
      first_name: first_name !== undefined ? first_name : customer.first_name,
      last_name: last_name !== undefined ? last_name : customer.last_name,
      points: points !== undefined ? points : customer.points,
      tier: tier !== undefined ? tier : customer.tier,
    });

    const custData = customer.toJSON() as any;
    custData.created_at = formatThaiDate(custData.created_at);

    return res.status(200).json({
      success: true,
      message: "��䢢������١��������",
      data: custData,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡����䢢������١���",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ź�������١��ҵ�� ID (DELETE /api/customers/:id)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(Number(id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "��辺�������١��ҹ����к�����Ѻź������",
      });
    }

    await customer.destroy();

    return res.status(200).json({
      success: true,
      message: `ź�������١��� ID: ${id} �����`,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({
      success: false,
      message: "�Դ��ͼԴ��Ҵ㹡��ź�������١���",
      error: error instanceof Error ? error.message : error,
    });
  }
};
