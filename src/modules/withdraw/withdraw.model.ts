import mongoose, { Schema } from 'mongoose';
import { IWithdraw } from './withdraw.interfaces';

const withdrawSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletType: {
    type: String,
    enum: ['totalAmount'],
    required: true
  },
  method: {
    type: String,
    enum: ['Bkash', 'Nagad', 'Rocket'],
    required: true
  },
  number: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED'],
    default: 'PENDING'
  }
}, { timestamps: true });

export const Withdraw = mongoose.model<IWithdraw>('Withdraw', withdrawSchema);