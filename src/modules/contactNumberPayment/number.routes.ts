import { Router } from "express";
import { phoneUnlockPaymentControllers } from "./number.controller";

const router = Router();

router.post("/initiate-payment", phoneUnlockPaymentControllers.initiatePhoneUnlockPayment);
router.post("/callback", phoneUnlockPaymentControllers.handlePhoneUnlockCallback);
router.get("/callback", phoneUnlockPaymentControllers.handlePhoneUnlockCallback);

export const phoneUnlockPaymentRoutes = router;