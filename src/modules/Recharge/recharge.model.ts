import { Schema, model } from "mongoose";
import { ITransaction } from "./recharge.interface";

const TransactionSchema = new Schema<ITransaction>(
    {
        userObjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userId: { type: String, required: true },
        transactionId: { type: String, required: true, unique: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        amount: { type: Number, required : true ,default: 0 },
        isDeleted : {type : Boolean, default : false},
        status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    },
    { timestamps: true, versionKey: false }
);

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);