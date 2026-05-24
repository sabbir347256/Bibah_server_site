import { Router } from "express";
import { authUserController } from "./auth.controller";


const router = Router();

router.post('/login',authUserController.credentialLogin);


export const AuthRouter = router;