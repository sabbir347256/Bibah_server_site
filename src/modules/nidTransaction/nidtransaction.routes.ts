import { Router } from "express";
import { nidTransactionControllers } from "./nidtransaction.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/initiate", checkAuth(Role.USER,Role.PREMIUM), nidTransactionControllers.initiatePayment);
router.post("/callback", nidTransactionControllers.callback);
router.get("/callback", nidTransactionControllers.callback);
router.patch("/update-status/:id", checkAuth(Role.AGENT), nidTransactionControllers.updateStatus);
router.get("/get-all",checkAuth(Role.ADMIN), nidTransactionControllers.getAllNidTransactions);
router.delete("/delete/:id",checkAuth(Role.ADMIN), nidTransactionControllers.deleteNidTransaction);

export const nidTransactionRoutes = router; 