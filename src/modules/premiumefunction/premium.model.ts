import { model, Schema } from "mongoose";
import { IPremiumTransaction } from "./premium.interface";

const PremiumTransactionSchema = new Schema<IPremiumTransaction>(
    {
        userObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        transactionId: { type: String, required: true, unique: true },
        gatewayTransactionId: { type: String },
        phoneNumber: { type: String, required: true },
        amount: { type: Number, required: true, default: 9999 },
        status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
        originUrl: { type: String, required: true }
    },
    { timestamps: true }
);

export const PremiumTransaction = model<IPremiumTransaction>("PremiumTransaction", PremiumTransactionSchema);