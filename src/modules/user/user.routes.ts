import { Router } from "express";
import { userControllers } from "./user.controller";



const router = Router();

router.post("/register", userControllers.registerUser);
router.post("/verify-email", userControllers.verifyEmail);

export const userRoutes = router;