import { Router } from "express";
import {
  closeShift,
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
} from "../controllers/shiftController";

const router = Router();

// Routes ����Ѻ�Ѵ��á� (Shifts)
router.post("/", createShift);
router.get("/", getShifts);
router.post("/:id/close", closeShift);
router.get("/:id", getShiftById);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export default router;
