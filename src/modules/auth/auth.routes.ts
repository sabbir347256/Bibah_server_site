import { Router } from "express";
import { authUserController } from "./auth.controller";
import passport from "passport";


const router = Router();

router.post('/login', authUserController.credentialLogin);
router.post("/agent&admin/login", authUserController.agentLogin);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", authUserController.googleCallback);


export const AuthRouter = router;