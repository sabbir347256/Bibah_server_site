import { Router } from "express";
import { checkAuth } from "../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { upload } from "../../config/multer";
import { nidController } from "./document.controller";


const router = Router();

router.post("/upload-nid",checkAuth(Role.USER, Role.PREMIUM),upload.array("nidImages", 2),nidController.uploadNid);
router.get("/check-nid/:userId", checkAuth(Role.USER, Role.PREMIUM), nidController.checkNidSubmission);
router.get("/nid-submissions", checkAuth(Role.ADMIN), nidController.getAllNidSubmissions);
router.patch("/nid-status/:id", checkAuth(Role.ADMIN), nidController.updateNidStatus);
router.delete("/nid-delete/:id", checkAuth(Role.ADMIN), nidController.deleteNidSubmission);


export const documentVerification = router;