import { Router } from "express";
import { userControllers } from "./user.controller";
import { upload } from "../../config/multer";
import { Role } from "./user.interface";
import { checkAuth } from "../middleware/auth.middleware";
import { profileUnlockController } from "../profileunlock/profileunlock.controller";

const router = Router();


router.get("/", userControllers.getAllUsers);
router.get("/all-agents",checkAuth(Role.ADMIN), userControllers.getAllAgent);
router.post("/register", upload.single('image'), userControllers.registerUser);
router.post("/verify-email", userControllers.verifyEmail);
router.get('/get-profile',checkAuth(Role.ADMIN,Role.USER,Role.AGENT), userControllers.getMyProfile);
router.post("/profile/unlock", checkAuth(Role.USER), profileUnlockController.unlockProfile);
router.get("/details/:id", profileUnlockController.getProfileDetails);
router.post("/unlock", checkAuth(Role.USER), profileUnlockController.unlockProfile);
router.patch("/status/:id", checkAuth(Role.USER), userControllers.updateUserStatus);
router.delete("/:id",checkAuth(Role.USER), userControllers.deleteUser);
router.put("/update",checkAuth(Role.USER), userControllers.updateProfile);
router.get("/search-profiles", userControllers.searchProfiles);

export const userRoutes = router;   