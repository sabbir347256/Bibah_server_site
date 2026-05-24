import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    AGENT = "AGENT",
    USER = "USER",
}

export type IsAuthProvider = {
    provider: "google" | "credentials";
    providerID: string;
};

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED",
}

export type IProfileUnlock = {
    unlockedBy: Types.ObjectId;
    targetProfile: Types.ObjectId; 
    createdAt: Date;
}

export type IUser = {
    _id: Types.ObjectId;
    userID: string;
    ownRefarelID: string;
    bonusRefarelID: string;
    bonusWalletPoints: number;
    agentReferWalletPoints: number;
    mainWalletBalance: number;
    walletPoints: number;
    fullName: string;
    birth: string;
    age: number;
    gender: string;
    profession: string;
    customProfession: string;
    email: string;
    contactNo: string;
    nidNo: string;
    password: string;
    profileImage?: string;
    coverImage?: string;
    isVerified: boolean;
    verificationStage: string;
    verificationCode?: string;
    verificationExpiry?: Date;
    isDeleted: boolean;
    isApproved: boolean;
    currentCountry: string;
    currentDivision: string;
    currentDistrict: string;
    currentThana: string;
    permanentCountry: string;
    permanentDivision: string;
    permanentDistrict: string;
    permanentThana: string;
    role: Role;
    isActive?: IsActive;
    auths: IsAuthProvider[];
}