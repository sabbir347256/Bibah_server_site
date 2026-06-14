import mongoose, { Document } from "mongoose";

export interface IWithdraw extends Document {
  userId: mongoose.Types.ObjectId;
  walletType: 'totalAmount';
  method: 'Bkash' | 'Nagad' | 'Rocket';
  number: string;
  amount: number;
  status: "PENDING" | "APPROVED";
  createdAt: Date;
  updatedAt: Date;
}