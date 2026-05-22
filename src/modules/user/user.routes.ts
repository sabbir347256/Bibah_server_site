import { Request, Response, Router } from "express";
import { userControllers } from "./user.controller";
import { upload } from "../../config/multer";



const router = Router();

router.post("/register", upload.single('image'), userControllers.registerUser);
router.post("/verify-email", userControllers.verifyEmail);

export const userRoutes = router;