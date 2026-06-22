import { Router } from "express";
import { premiumPaymentControllers } from "./premium.controller";

const router = Router();

router.post("/initiate-payment", premiumPaymentControllers.initiatePremiumPayment);

router.post("/callback", (req, res, next) => premiumPaymentControllers.handlePremiumCallback(req, res).catch(next));
router.get("/callback", (req, res, next) => premiumPaymentControllers.handlePremiumCallback(req, res).catch(next));

export const premiumPaymentRoutes = router;