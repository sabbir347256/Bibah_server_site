import { Types } from "mongoose";

export type ITransaction = {
    _id: Types.ObjectId;
    userObjectId: Types.ObjectId;
    userId: string;
    transactionId: string;
    phoneNumber: string;
    amount: number;
    isDeleted : boolean;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    updatedAt: Date;
};