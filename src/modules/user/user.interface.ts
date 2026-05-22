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

export type IUser = {
    _id: Types.ObjectId;
    userID: string;
    ownRefarelID: string;
    bonusRefarelID: string;
    fullName: string;
    birth: string;
    gender: string;
    profession: string;
    email: string;
    contactNo: string;
    nidNo: string;
    password: string;
    profileImage?: string;
    isVerified: boolean;
    verificationStage : string,
    verificationCode?: string;      
    verificationExpiry?: Date;      
    isDeleted: boolean;
    isApproved: boolean;
    presentAddress: string;         
    permanentAddress: string;
    role: Role;
    isActive?: IsActive;
    auths: IsAuthProvider[];
}