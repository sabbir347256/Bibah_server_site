import { Router } from "express";
import { fieldTransactionControllers } from "./fieldtransaction.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/transaction-initiate",checkAuth(Role.USER), fieldTransactionControllers.initiatePayment);
router.post("/transactoin-callback", fieldTransactionControllers.callback);
router.get("/transactoin-callback", fieldTransactionControllers.callback);
router.patch("/update-status/:id", fieldTransactionControllers.updateStatus);

export const fieldTransactionRoutes = router;