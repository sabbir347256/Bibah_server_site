import { model, Schema } from "mongoose";
import { IPhoneUnlockTransaction } from "./number.interface";

const PhoneUnlockTransactionSchema = new Schema<IPhoneUnlockTransaction>(
    {
        buyerUserObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetUserObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        transactionId: { type: String, required: true, unique: true },
        gatewayTransactionId: { type: String },
        phoneNumber: { type: String, required: true },
        amount: { type: Number, required: true, default: 77 },
        status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
        originUrl: { type: String, required: true }
    },
    { timestamps: true }
);

export const PhoneUnlockTransaction = model<IPhoneUnlockTransaction>("PhoneUnlockTransaction", PhoneUnlockTransactionSchema);