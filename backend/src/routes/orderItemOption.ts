import { Router } from "express";

import {
  createOrderItemOption,
  getOrderItemOptions,
  getOrderItemOptionById,
  updateOrderItemOption,
  deleteOrderItemOption,
} from "../controllers/orderItemOptionController";

const router = Router();

router.post("/", createOrderItemOption);
router.get("/", getOrderItemOptions);
router.get("/:id", getOrderItemOptionById);
router.put("/:id", updateOrderItemOption);
router.delete("/:id", deleteOrderItemOption);

export default router;
