import { Schema, Types } from "mongoose";

export interface INidDocument extends Document {
  userId: Types.ObjectId;
  nidImages: string[];
  status: "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}