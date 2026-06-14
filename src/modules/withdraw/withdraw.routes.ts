import { Router } from "express";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { withdrawController } from "./withdraw.controller";

const router = Router();


router.post('/amountWithdraw', checkAuth(Role.AGENT), withdrawController.createWithdrawal);
router.get('/get-withdrawals', checkAuth(Role.AGENT, Role.ADMIN), withdrawController.getWithdrawals);
router.patch("/status/:id", checkAuth(Role.ADMIN), withdrawController.updateWithdrawStatus);


export const withdrawRoutes = router;   