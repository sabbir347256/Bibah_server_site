import { Router } from "express";
import { requestController } from "./request.controller";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";


const router = Router();


router.post('/send',checkAuth(Role?.USER,Role.PREMIUM), requestController.sendConnectionRequest);
router.post('/action', checkAuth(Role?.USER,Role.PREMIUM),requestController.handleRequestAction);
router.get('/pending',checkAuth(Role?.USER,Role.PREMIUM), requestController.getPendingRequests);
router.get('/status/:targetUserId',checkAuth(Role?.USER,Role.PREMIUM), requestController.getConnectionStatus);


export const requestRoutes = router;