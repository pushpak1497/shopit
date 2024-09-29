import { Router } from "express";
import {
  isAuthenticatedUser,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import {
  deleteOrder,
  getAllOrders,
  getCurrentUserOrders,
  getOrderDetails,
  getSalesData,
  newOrder,
  updateOrder,
} from "../controllers/orderController.js";

const router = Router();

router.route("/orders/new").post(isAuthenticatedUser, newOrder);
router.route("/orders/:id").get(isAuthenticatedUser, getOrderDetails);
router.route("/me/orders").get(isAuthenticatedUser, getCurrentUserOrders);
router
  .route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);
router
  .route("/admin/orders/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder);
router
  .route("/admin/orders/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);
router
  .route("/admin/get_sales")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSalesData);

export default router;
