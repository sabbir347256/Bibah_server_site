import { Types } from "mongoose";

export type TFieldTransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TFieldTransaction {
    userObjectId: Types.ObjectId;
    userId: string;
    transactionId: string;
    gatewayTransactionId?: string;
    phoneNumber: string;
    amount: number;
    status: TFieldTransactionStatus;
    originUrl?: string;
    isDeleted?: boolean;
}