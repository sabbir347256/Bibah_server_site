import { Router } from "express";
import { userControllers } from "./user.controller";
import { upload } from "../../config/multer";
import { Role } from "./user.interface";
import { checkAuth } from "../middleware/auth.middleware";
import { profileUnlockController } from "../profileunlock/profileunlock.controller";

const router = Router();


router.get("/", userControllers.getAllUsers);
router.get("/all-agents", checkAuth(Role.ADMIN), userControllers.getAllAgent);
router.post("/register", upload.single('image'), userControllers.registerUser);
router.post("/verify-email", userControllers.verifyEmail);
router.get('/get-profile', checkAuth(Role.ADMIN, Role.USER, Role.PREMIUM, Role.AGENT), userControllers.getMyProfile);
router.post("/profile/unlock", checkAuth(Role.USER, Role.PREMIUM), profileUnlockController.unlockProfile);
router.get("/details/:id", profileUnlockController.getProfileDetails);
router.post("/unlock", checkAuth(Role.USER, Role.PREMIUM), profileUnlockController.unlockProfile);
router.patch("/status/:id", checkAuth(Role.ADMIN), userControllers.updateUserStatus);
router.delete("/:id", checkAuth(Role.ADMIN, Role.USER, Role.PREMIUM), userControllers.deleteUser);
router.put("/update", checkAuth(Role.USER, Role.PREMIUM, Role.AGENT, Role.ADMIN), userControllers.updateProfile);
router.get("/search-profiles", userControllers.searchProfiles);
router.put("/update-image/:type", checkAuth(Role.USER, Role.PREMIUM, Role.AGENT, Role.ADMIN), upload.single("image"), userControllers.updateProfileImage);
router.put("/update-image/cover", checkAuth(Role.USER, Role.PREMIUM), upload.single("image"), (req, res, next) => { req.params.type = "cover"; next(); }, userControllers.updateProfileImage);
router.post("/forgot-password", userControllers.forgotPassword);
router.post("/reset-password", userControllers.resetPassword);
router.get("/dashboard-stats",checkAuth(Role.ADMIN), userControllers?.getDashboardStats);

export const userRoutes = router;   