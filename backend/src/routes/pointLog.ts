import { Router } from "express";
import {
  createPointLog,
  getPointLogs,
  getPointLogById,
  updatePointLog,
  deletePointLog,
} from "../controllers/pointLogController";

const router = Router();

router.post("/", createPointLog);
router.get("/", getPointLogs);
router.get("/:id", getPointLogById);
router.put("/:id", updatePointLog);
router.delete("/:id", deletePointLog);

export default router;
