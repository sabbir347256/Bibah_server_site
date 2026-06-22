import { Schema } from "mongoose";

export interface IPremiumTransaction extends Document {
    userObjectId: Schema.Types.ObjectId;
    transactionId: string;
    gatewayTransactionId?: string;
    phoneNumber: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    originUrl: string;
    createdAt: Date;
    updatedAt: Date;
}