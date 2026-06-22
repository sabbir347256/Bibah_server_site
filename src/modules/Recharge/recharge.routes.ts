import { Router } from "express";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { transactionControllers } from "./Recharge.controller";

const router = Router();


router.post("/initiate-paystation", checkAuth(Role.USER,Role.PREMIUM, Role.ADMIN, Role.AGENT), transactionControllers.initiatePayStationPayment);
router.get("/paystation-callback", transactionControllers.paystationCallback);

router.post("/", checkAuth(Role.USER,Role.PREMIUM, Role.ADMIN, Role.AGENT), transactionControllers.createTransaction);
router.get("/", checkAuth(Role.ADMIN), transactionControllers.getAllTransactions);
router.patch("/status/:id", checkAuth(Role.ADMIN), transactionControllers.updateTransactionStatus);
router.delete("/:id", checkAuth(Role.ADMIN), transactionControllers.deleteTransaction);

export const transactionRoutes = router;