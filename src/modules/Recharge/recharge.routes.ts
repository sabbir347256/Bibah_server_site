import { Router } from "express";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { transactionControllers } from "./Recharge.controller";

const router = Router();

router.post("/", checkAuth(Role.USER, Role.ADMIN, Role.AGENT), transactionControllers.createTransaction);
router.get("/",  transactionControllers.getAllTransactions);
router.patch("/status/:id", transactionControllers.updateTransactionStatus);
router.delete("/:id", transactionControllers.deleteTransaction);

export const transactionRoutes = router;