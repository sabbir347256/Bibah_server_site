import mongoose from "mongoose";

export enum RequestStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}

export interface IConnectionRequest {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    status: RequestStatus;
    createdAt: Date;
    updatedAt: Date;
}