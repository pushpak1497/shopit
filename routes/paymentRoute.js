import { Router } from "express";
import { isAuthenticatedUser } from "../middlewares/authMiddleware.js";
import {
  stripeCheckoutSession,
  stripeWebhook,
} from "../controllers/paymentController.js";

const router = Router();

router
  .route("/payment/checkout_session")
  .post(isAuthenticatedUser, stripeCheckoutSession);

router.route("/payment/webhook").post(stripeWebhook);

export default router;
