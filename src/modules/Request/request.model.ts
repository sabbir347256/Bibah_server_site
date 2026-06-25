import { Schema } from "mongoose";
import { IConnectionRequest, RequestStatus } from "./request.interfaces";
import mongoose from "mongoose";

const ConnectionRequestSchema: Schema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(RequestStatus), default: RequestStatus.PENDING },
}, { timestamps: true });

ConnectionRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);