import { Request, Response, Router } from "express";
import AppSetting from "../model/AppSetting";
import { getSessionUser } from "../utils/session";

const router = Router();
const PROMPTPAY_KEY = "promptpay_phone";

const getRequester = async (req: Request) => {
  return getSessionUser(req);
};

const createPromptPayPayload = (phone: string, amount: number) => {
  const tlv = (tag: string, value: string) => tag + String(value.length).padStart(2, "0") + value;
  const mobile = phone.replace(/\D/g, "");
  if (!/^0[0-9]{9}$/.test(mobile)) return null;
  const account = tlv("00", "A000000677010111") + tlv("01", `0066${mobile.slice(1)}`);
  const payload = "000201010212" + tlv("29", account) + "5303764" + tlv("54", Math.max(0, amount).toFixed(2)) + "5802TH6304";
  let crc = 0xffff;
  for (const char of payload) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
};

router.get("/promptpay/qr", async (req: Request, res: Response) => {
  try {
    const user = await getRequester(req);
    if (!user) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
    const amount = Number(req.query.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: "ยอดชำระไม่ถูกต้อง" });
    const setting = await AppSetting.findByPk(PROMPTPAY_KEY);
    const payload = setting?.value ? createPromptPayPayload(setting.value, amount) : null;
    return res.json({ success: true, data: { payload } });
  } catch (error) {
    console.error("Error generating PromptPay QR:", error);
    return res.status(500).json({ success: false, message: "สร้าง QR พร้อมเพย์ไม่สำเร็จ" });
  }
});

router.get("/promptpay", async (req: Request, res: Response) => {
  try {
    const user = await getRequester(req);
    if (!user) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
    if (user.role !== "admin") return res.status(403).json({ success: false, message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    const setting = await AppSetting.findByPk(PROMPTPAY_KEY);
    return res.json({ success: true, data: { phone: setting?.value || "" } });
  } catch (error) {
    console.error("Error reading PromptPay setting:", error);
    return res.status(500).json({ success: false, message: "อ่านค่าพร้อมเพย์ไม่สำเร็จ" });
  }
});

router.put("/promptpay", async (req: Request, res: Response) => {
  try {
    const user = await getRequester(req);
    if (!user) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
    if (user.role !== "admin") return res.status(403).json({ success: false, message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    const phone = String(req.body?.phone || "").replace(/[\\s()-]/g, "");
    if (phone && !/^0[0-9]{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "กรุณากรอกเบอร์มือถือไทย 10 หลัก เช่น 0812345678" });
    }
    await AppSetting.upsert({ key: PROMPTPAY_KEY, value: phone });
    return res.json({ success: true, data: { phone } });
  } catch (error) {
    console.error("Error saving PromptPay setting:", error);
    return res.status(500).json({ success: false, message: "บันทึกค่าพร้อมเพย์ไม่สำเร็จ" });
  }
});

export default router;
