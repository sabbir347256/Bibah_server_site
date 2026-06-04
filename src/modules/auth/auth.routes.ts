import { Router } from "express";
import { authUserController } from "./auth.controller";


const router = Router();

router.post('/login',authUserController.credentialLogin);
router.post("/agent&admin/login", authUserController.agentLogin);


export const AuthRouter = router;