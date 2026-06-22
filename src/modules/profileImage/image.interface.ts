import { Types } from "mongoose";

export interface IPhotoGallery {
  userObjectId: Types.ObjectId;
  imageUrl: string;
  publicId: string;
  createdAt?: Date;
}