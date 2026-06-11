import { Types } from "mongoose";

export type TNidTransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TNidTransaction {
    userObjectId: Types.ObjectId;
    userId: string;
    transactionId: string;
    gatewayTransactionId?: string;
    phoneNumber: string;
    amount: number;
    status: TNidTransactionStatus;
    originUrl?: string;
    isDeleted?: boolean;
}