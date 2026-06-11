import { Schema, model } from "mongoose";
import { TNidTransaction } from "./nidtransaction.interface";

const nidTransactionSchema = new Schema<TNidTransaction>(
    {
        userObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userId: { type: String, required: true },
        transactionId: { type: String, required: true, unique: true },
        gatewayTransactionId: { type: String },
        phoneNumber: { type: String, required: true },
        amount: { type: Number, required: true, default: 390 },
        status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
        originUrl: { type: String },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export const NidTransaction = model<TNidTransaction>("NidTransaction", nidTransactionSchema);