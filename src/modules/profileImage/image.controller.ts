import { Request, Response } from "express";
import { PhotoGallery } from "./image.model";
import cloudinary from "../../config/cloudinary";

const uploadSinglePhoto = async (req: Request, res: Response) => {
  try {
    const userObjectId = (req as any).user?._id || req.body.userObjectId;

    if (!userObjectId) {
      return res.status(400).json({ success: false, message: "User identity missing" });
    }

    const existingPhotosCount = await PhotoGallery.countDocuments({ userObjectId });
    if (existingPhotosCount >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Upload limit reached. You can upload a maximum of 5 photos." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newPhoto = await PhotoGallery.create({
      userObjectId,
      imageUrl: req.file.path,
      publicId: req.file.filename
    });

    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      data: newPhoto
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserPhotos = async (req: Request, res: Response) => {
  try {
    const userObjectId = req.params.userId;
    const photos = await PhotoGallery.find({ userObjectId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: photos });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const photo = await PhotoGallery.findById(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    await cloudinary.uploader.destroy(photo.publicId);
    await PhotoGallery.findByIdAndDelete(photoId);

    return res.status(200).json({ success: true, message: "Photo deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const photoGalleryControllers = {
  uploadSinglePhoto,
  getUserPhotos,
  deletePhoto
};