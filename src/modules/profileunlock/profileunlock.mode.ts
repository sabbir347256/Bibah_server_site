import mongoose, { Schema, Model } from "mongoose";
import { IProfileUnlock } from "../user/user.interface";

const profileUnlockSchema = new Schema<IProfileUnlock>(
    {
        unlockedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetProfile: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, versionKey: false }
);

profileUnlockSchema.index({ unlockedBy: 1, targetProfile: 1 }, { unique: true });

export const ProfileUnlock: Model<IProfileUnlock> = mongoose.model<IProfileUnlock>("ProfileUnlock", profileUnlockSchema);