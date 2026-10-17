import { Request, Response } from "express";
import User from "../model/User";
import Shift from "../model/Shift";
import Order from "../model/Order";
import { formatThaiDate } from "../utils/formatThaiDate";
import { createSession, getSessionUser } from "../utils/session";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const loginUser = async (req: Request, res: Response) => {
  try {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let attempt = loginAttempts.get(key);
    if (!attempt || attempt.resetAt <= now) {
      attempt = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
      loginAttempts.set(key, attempt);
    }
    if (attempt.count >= LOGIN_MAX_ATTEMPTS) {
      res.setHeader("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message: "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่" });
    }

    const pinCode = req.body?.pin_code;
    if (typeof pinCode !== "string" || !/^\d{4,6}$/.test(pinCode)) {
      attempt.count += 1;
      return res.status(400).json({
        success: false,
        message: "๏ฟฝ๏ฟฝุณาก๏ฟฝอก PIN Code",
      });
    }

    const user = await User.findOne({ where: { pin_code: pinCode, is_active: true } });
    if (!user) {
      attempt.count += 1;
      return res.status(401).json({
        success: false,
        message: "PIN Code ๏ฟฝ๏ฟฝ๏ฟฝูก๏ฟฝ๏ฟฝอง",
      });
    }

    loginAttempts.delete(key);

    return res.status(200).json({
      success: true,
      message: "๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝะบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        access_token: createSession(user.id),
        created_at: formatThaiDate(user.created_at),
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝะบ๏ฟฝ",
    });
  }
};

// 1. ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝลผ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ (POST /api/users)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, role, pin_code } = req.body;

    if (!/^\d{4,6}$/.test(String(pin_code || ""))) {
      return res.status(400).json({ success: false, message: "PIN เธ•เนเธญเธเน€เธเนเธเธ•เธฑเธงเน€เธฅเธ 4โ€“6 เธซเธฅเธฑเธ" });
    }
    if (!(["staff", "manager", "admin"] as string[]).includes(role || "staff")) {
      return res.status(400).json({ success: false, message: "เธเธ—เธเธฒเธ—เธเธเธฑเธเธเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ" });
    }
    if (await User.findOne({ where: { pin_code: String(pin_code) } })) {
      return res.status(409).json({ success: false, message: "PIN เธเธตเนเธ–เธนเธเนเธเนเธเธฒเธเนเธฅเนเธง เธเธฃเธธเธ“เธฒเนเธเน PIN เธญเธทเนเธ" });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "๏ฟฝ๏ฟฝุณ๏ฟฝ๏ฟฝะบุช๏ฟฝ๏ฟฝอผ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝาน (name)",
      });
    }

    const newUser = await User.create({
      name,
      role: role || "staff",
      pin_code,
    });

    // ๏ฟฝลง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝลก๏ฟฝอน๏ฟฝ๏ฟฝ๏ฟฝอก ๏ฟฝ๏ฟฝะฟ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝแบบ๏ฟฝ๏ฟฝ
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      created_at: formatThaiDate(newUser.created_at), // ๐‘ ๏ฟฝ๏ฟฝัง๏ฟฝ๏ฟฝัน๏ฟฝลง๏ฟฝรง๏ฟฝ๏ฟฝ๏ฟฝ
    };

    return res.status(201).json({
      success: true,
      message: "๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝลผ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. ๏ฟฝึง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝลท๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ (GET /api/users)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["pin_code"] },
      order: [["created_at", "DESC"]],
    });

    const formattedUsers = await Promise.all(users.map(async (user) => {
      const userData = user.toJSON() as any;
      const [shiftCount, orderCount] = await Promise.all([
        Shift.count({ where: { user_id: user.id } }),
        Order.count({ where: { user_id: user.id } }),
      ]);
      return {
        ...userData,
        deactivated_at: formatThaiDate(userData.deactivated_at),
        shift_count: shiftCount,
        order_count: orderCount,
        created_at: formatThaiDate(userData.created_at), // ๐‘ ๏ฟฝลง๏ฟฝ๏ฟฝ๏ฟฝาตอน๏ฟฝึง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ
      };
    }));

    return res.status(200).json({
      success: true,
      total: formattedUsers.length,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝรดึง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
    });
  }
};

// 3. ๏ฟฝึง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝยค๏ฟฝ (GET /api/users/:id)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(Number(id), {
      attributes: { exclude: ["pin_code"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "๏ฟฝ๏ฟฝ่พบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝะบ๏ฟฝ",
      });
    }

    const userData = user.toJSON() as any;
    userData.created_at = formatThaiDate(userData.created_at); // ๐‘ ๏ฟฝลง๏ฟฝ๏ฟฝ๏ฟฝาตอน๏ฟฝึง๏ฟฝ๏ฟฝยค๏ฟฝ

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝรดึง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
    });
  }
};

// 4. ๏ฟฝ๏ฟฝไขข๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ User ๏ฟฝ๏ฟฝ๏ฟฝ ID (PUT /api/users/:id) ๐•
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, pin_code, is_active } = req.body;

    const user = await User.findByPk(Number(id));

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ success: false, message: "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธเธเธฑเธเธเธฒเธ" });
    }
    if (role !== undefined && !(["staff", "manager", "admin"] as string[]).includes(role)) {
      return res.status(400).json({ success: false, message: "เธเธ—เธเธฒเธ—เธเธเธฑเธเธเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ" });
    }
    if (pin_code !== undefined && pin_code !== "") {
      if (!/^\d{4,6}$/.test(String(pin_code))) {
        return res.status(400).json({ success: false, message: "PIN เธ•เนเธญเธเน€เธเนเธเธ•เธฑเธงเน€เธฅเธ 4โ€“6 เธซเธฅเธฑเธ" });
      }
      const duplicatePin = await User.findOne({ where: { pin_code: String(pin_code) } });
      if (duplicatePin && duplicatePin.id !== Number(id)) {
        return res.status(409).json({ success: false, message: "PIN เธเธตเนเธ–เธนเธเนเธเนเธเธฒเธเนเธฅเนเธง เธเธฃเธธเธ“เธฒเนเธเน PIN เธญเธทเนเธ" });
      }
    }

    if (is_active !== undefined && typeof is_active !== "boolean") {
      return res.status(400).json({ success: false, message: "สถานะบัญชีไม่ถูกต้อง" });
    }
    if (user?.role === "admin" && ((role !== undefined && role !== "admin") || is_active === false)) {
      const adminCount = await User.count({ where: { role: "admin", is_active: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "เธ•เนเธญเธเธกเธตเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเธฑเธเธเธต" });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "๏ฟฝ๏ฟฝ่พบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝะบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝับ๏ฟฝ๏ฟฝไขข๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      });
    }

    // ๏ฟฝัปเดตเฉพ๏ฟฝะฟ๏ฟฝลด๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝีก๏ฟฝ๏ฟฝ๏ฟฝ่งค๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ
    await user.update({
      name: name !== undefined ? name : user.name,
      role: role !== undefined ? role : user.role,
      pin_code: pin_code !== undefined && pin_code !== "" ? pin_code : user.pin_code,
      is_active: is_active !== undefined ? is_active : user.is_active,
      deactivated_at: is_active === true ? null : is_active === false ? new Date() : user.deactivated_at,
    });

    const userData = user.toJSON() as any;
    userData.created_at = formatThaiDate(userData.created_at);
    delete userData.pin_code; // ๏ฟฝ๏ฟฝอน PIN Code

    return res.status(200).json({
      success: true,
      message: "๏ฟฝ๏ฟฝไขข๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝลผ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      data: userData,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝไขข๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. ลบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ User ๏ฟฝ๏ฟฝ๏ฟฝ ID (DELETE /api/users/:id) ๐•
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(Number(id));

    const requester = await getSessionUser(req);
    if (requester?.id === Number(id)) {
      return res.status(400).json({ success: false, message: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธฑเธเธเธตเธ—เธตเนเธเธณเธฅเธฑเธเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธ”เน" });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "๏ฟฝ๏ฟฝ่พบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝะบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝับลบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      });
    }

    if (user.role === "admin") {
      const adminCount = await User.count({ where: { role: "admin", is_active: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "เธ•เนเธญเธเธกเธตเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเธฑเธเธเธต" });
      }
    }

    const [shiftCount, orderCount] = await Promise.all([
      Shift.count({ where: { user_id: user.id } }),
      Order.count({ where: { user_id: user.id } }),
    ]);

    if (user.is_active || user.deactivated_at || shiftCount > 0 || orderCount > 0) {
      await user.update({ is_active: false, deactivated_at: new Date() });
      return res.status(200).json({
        success: true,
        message: "ปิดใช้งานบัญชีแล้ว โดยเก็บประวัติกะและรายการขายไว้",
        data: { deactivated: true, shift_count: shiftCount, order_count: orderCount },
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: `ลบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝาน ID: ${id} ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "๏ฟฝิด๏ฟฝ๏ฟฝอผิด๏ฟฝ๏ฟฝาดในก๏ฟฝ๏ฟฝลบ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ",
      error: error instanceof Error ? error.message : error,
    });
  }
};
