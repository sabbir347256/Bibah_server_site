import { Schema, model } from "mongoose";
import { IPhotoGallery } from "./image.interface";

const photoGallerySchema = new Schema<IPhotoGallery>({
  userObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true }
}, {
  timestamps: true,
  versionKey: false
});

export const PhotoGallery = model<IPhotoGallery>("PhotoGallery", photoGallerySchema);