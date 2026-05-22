import mongoose, { Model, Schema } from "mongoose";
import { IsActive, IsAuthProvider, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IsAuthProvider>(
    {
        provider: { type: String, required: true },
        providerID: { type: String, required: true },
    },
    { versionKey: false, _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
    {
        userID: { type: String, unique: true },
        ownRefarelID: { type: String, unique: true },
        bonusRefarelID: { type: String, unique: true},
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        birth: { type: String, required: true },
        gender: { type: String, required: true },
        profession: { type: String, required: true },
        customProfession: { type: String},
        contactNo: { type: String, required: true, unique: true, trim: true },
        nidNo: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        permanentCountry: { type: String },
        permanentDivision: { type: String },
        permanentDistrict: { type: String },
        permanentThana: { type: String },
        currentCountry: { type: String },
        currentDivision: { type: String },
        currentDistrict: { type: String },
        currentThana: { type: String },
        profileImage: { type: String, default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
        isVerified: { type: Boolean, default: false },
        verificationStage: { type: String, default: null },
        verificationCode: { type: String, default: null },
        verificationExpiry: { type: Date, default: null },
        isDeleted: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        role: { type: String, enum: Object.values(Role), default: Role.USER, required: true },
        isActive: { type: String, enum: Object.values(IsActive), default: IsActive.INACTIVE },
        auths: [authProviderSchema],
    },
    { timestamps: true, versionKey: false }
);

UserSchema.pre("save", async function () {
    const user = this as any;

    if (!user.userID) {
        const lastUser = await mongoose.model("User").findOne({}, {}, { sort: { createdAt: -1 } });

        let currentSequence = 0;

        if (lastUser && lastUser.userID) {
            const parts = lastUser.userID.split("-");
            if (parts.length === 2) {
                currentSequence = parseInt(parts[1], 10);
            }
        }

        const nextSequence = currentSequence + 1;
        const paddedSequence = String(nextSequence).padStart(5, "0");

        user.userID = `77-${paddedSequence}`;
    }

    if (!user.ownRefarelID) {
        let isUnique = false;
        let generatedReferral = "";

        while (!isUnique) {
            generatedReferral = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existingUser = await mongoose.model("User").findOne({ ownRefarelID: generatedReferral });
            if (!existingUser) {
                isUnique = true;
            }
        }

        user.ownRefarelID = generatedReferral;
    }
});

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);