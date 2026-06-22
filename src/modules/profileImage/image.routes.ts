import { Router } from "express";
import { photoGalleryControllers } from "./image.controller";
import { upload } from "../../config/multer";

const router = Router();

router.post("/upload", upload.single("galleryImage"), photoGalleryControllers.uploadSinglePhoto);
router.get("/user/:userId", photoGalleryControllers.getUserPhotos);
router.delete("/delete/:photoId", photoGalleryControllers.deletePhoto);

export const photoGalleryRoutes = router;