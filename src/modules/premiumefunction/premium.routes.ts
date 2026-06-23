import { Router } from "express";
import { premiumPaymentControllers } from "./premium.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/initiate-payment", premiumPaymentControllers.initiatePremiumPayment);

router.post("/callback", (req, res, next) => premiumPaymentControllers.handlePremiumCallback(req, res).catch(next));
router.get("/callback", (req, res, next) => premiumPaymentControllers.handlePremiumCallback(req, res).catch(next));
router.get("/get-all-transactions",checkAuth(Role.ADMIN), premiumPaymentControllers.getAllPremiumTransactions);
router.patch("/update-status/:id",checkAuth(Role.ADMIN),  premiumPaymentControllers.updateTransactionStatus);
router.delete("/delete-transaction/:id",checkAuth(Role.ADMIN),  premiumPaymentControllers.deletePremiumTransaction);

export const premiumPaymentRoutes = router;