import { Schema, model, Document } from 'mongoose';
import { IFieldVerify } from './fieldverify.interface';


const fieldVerifySchema = new Schema<IFieldVerify>(
    {
        userId: { type: String, required: true },
        agentId: { type: String, required: true },
        amount: { type: Number, required: true },
    },
    { timestamps: true }
);

export const FieldVerify = model<IFieldVerify>('FieldVerify', fieldVerifySchema);