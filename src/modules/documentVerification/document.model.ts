import { model, Schema } from "mongoose";
import { INidDocument } from "./document.interface";

const NidDocumentSchema = new Schema<INidDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    nidImages: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const NidDocument = model<INidDocument>("NidDocument", NidDocumentSchema);