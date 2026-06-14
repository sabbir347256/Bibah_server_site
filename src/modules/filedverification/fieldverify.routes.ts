import { Router } from "express";
import { fieldVerifyController } from "./fieldverify.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";


const router = Router();

router.post('/create-field-verify', checkAuth(Role.ADMIN), fieldVerifyController.createFieldVerify);
router.get('/get-field-verify', checkAuth(Role.ADMIN), fieldVerifyController.getFieldVerifies);
router.get('/get-fieldVerify-specifiqList', checkAuth(Role.AGENT), fieldVerifyController.getSpecifiqFieldVerify);
router.delete('/field-verify/:id', checkAuth(Role.ADMIN), fieldVerifyController.deleteFieldVerify);


export const fieldVerifyRoute = router;