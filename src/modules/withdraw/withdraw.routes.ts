import { Router } from "express";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { withdrawController } from "./withdraw.controller";

const router = Router();


router.post('/amountWithdraw', checkAuth(Role.AGENT), withdrawController.createWithdrawal);
router.get('/withdrawals', checkAuth(Role.ADMIN), withdrawController.getWithdrawals);

export const withdrawRoutes = router;   