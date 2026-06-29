import { Types } from "mongoose";

export interface IMeetup {
  userId: string;
  targetUserId: string;
  mobileNumber: string;
  user?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}