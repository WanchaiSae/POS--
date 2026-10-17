import express, { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  loginUser,
  updateUser,
} from "../controllers/userController";
import { getSessionUser } from "../utils/session";

const router = Router();

router.post("/login", loginUser);
router.use(async (req, res, next) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบใหม่" });
    if (user.role !== "admin") return res.status(403).json({ success: false, message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    return next();
  } catch (error) {
    console.error("Error authorizing user management:", error);
    return res.status(500).json({ success: false, message: "ตรวจสอบสิทธิ์ไม่สำเร็จ" });
  }
});
router.get("/", getUsers); // GET /api/users (�֧������)
router.get("/:id", getUserById); // GET /api/users/:id (�֧��¤�)
router.post("/", createUser); // POST /api/users (����������)
router.put("/:id", updateUser); // PUT /api/users/:id (��䢢�����) 🆕
router.delete("/:id", deleteUser); // DELETE /api/users/:id (ź������) 🆕

export default router;
