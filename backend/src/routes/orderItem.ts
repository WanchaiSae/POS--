import { Router } from "express";
import {
  createOrderItem,
  getOrderItems,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem,
} from "../controllers/orderItemController";

const router = Router();

router.post("/", createOrderItem);
router.get("/", getOrderItems);
router.get("/:id", getOrderItemById);
router.put("/:id", updateOrderItem);
router.delete("/:id", deleteOrderItem);

export default router;
