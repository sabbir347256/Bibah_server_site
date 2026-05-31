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
        bonusRefarelID: { type: String, default: null, index: true },
        bonusWalletPoints: { type: Number, default: 0 },
        agentReferWalletPoints: { type: Number, default: 0 },
        mainWalletBalance: { type: Number, default: 0 },
        walletPoints: { type: Number, default: 0 },
        fullName: { type: String, required: true, trim: true },
        religion: { type: String, required: true },
        Height: { type: String, default: null },
        maritalStatus: { type: String, default: null },
        education: { type: String, default: null },
        professionOrganization: { type: String, default: null },
        institute: { type: String, default: null },
        fatherOccupation: { type: String, default: null },
        motherOccupation: { type: String, default: null },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        birth: { type: String, required: true },
        age: { type: Number },
        gender: { type: String, required: true },
        profession: { type: String, required: true },
        customProfession: { type: String },
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
        coverImage: { type: String, default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
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

const calculateAge = (birthDateString: string): number => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

UserSchema.pre("save", async function () {
    const user = this as any;

    if (user.birth) {
        user.age = calculateAge(user.birth);
    }

    if (user.bonusRefarelID) {
        if (typeof user.bonusRefarelID === "string") {
            user.bonusRefarelID = user.bonusRefarelID.trim();
        }
        // যদি ফাকা স্ট্রিং হয়, তবে ডেটাবেজে null সেট করবে
        if (user.bonusRefarelID === "") {
            user.bonusRefarelID = null;
        }
    } else {
        user.bonusRefarelID = null;
    }

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
            generatedReferral = Math.floor(1000000 + Math.random() * 9000000).toString();
            const existingUser = await mongoose.model("User").findOne({ ownRefarelID: generatedReferral });
            if (!existingUser) {
                isUnique = true;
            }
        }

        user.ownRefarelID = generatedReferral;
    }
});

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);