import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    AGENT = "AGENT",
    USER = "USER",
    PREMIUM = "PREMIUM",
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
    Height: string;
    maritalStatus: string;
    professionOrganization: string;
    bonusWalletPoints: number;
    agentReferWalletPoints: number;
    mainWalletBalance: number;
    totalAmount : number;
    walletPoints: number;
    fullName: string;
    religion: string;
    institute: string;
    education: string;
    fatherOccupation: string;
    motherOccupation: string;
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
    isFieldVerification: boolean;
    isNidPaid: boolean;
    isFieldPaid: boolean;
    isDocumentVerification: boolean;
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