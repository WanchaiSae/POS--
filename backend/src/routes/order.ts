import { Router } from "express";

import {
  checkoutOrder,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController";

const router = Router();

router.post("/checkout", checkoutOrder);
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
