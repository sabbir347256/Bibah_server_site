import { Schema } from "mongoose";

export interface IPhoneUnlockTransaction extends Document {
    buyerUserObjectId: Schema.Types.ObjectId;
    targetUserObjectId: Schema.Types.ObjectId;
    transactionId: string;
    gatewayTransactionId?: string;
    phoneNumber: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    originUrl: string;
    createdAt: Date;
    updatedAt: Date;
}