import { Request, Response } from "express";
import { User } from "../user/user.model";
import { Withdraw } from "./withdraw.model";


const createWithdrawal = async (req: Request, res: Response): Promise<any> => {
    try {
        const { method, number, amount } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 500) {
            return res.status(400).json({ success: false, message: 'Minimum withdraw amount is 500' });
        }

        if (parsedAmount % 500 !== 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a multiple of 500' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const serviceCharge = parsedAmount * 0.03;
        const totalDeduction = parsedAmount + serviceCharge;

        const currentTotal = Number((user as any).totalAmount) || 0;

        if (currentTotal - totalDeduction < 500) {
            return res.status(400).json({ success: false, message: 'Insufficient balance. Must keep 500 Tk maintained balance.' });
        }

        const admin = await User.findOne({ email: 'superadmin@gmail.com', role: 'ADMIN' as any });
        if (!admin) {
            return res.status(500).json({ success: false, message: 'System Admin account not found' });
        }

        await User.updateOne(
            { _id: userId },
            { $inc: { totalAmount: -totalDeduction } }
        );

        await User.updateOne(
            { _id: (admin as any)._id },
            { $inc: { bonusWalletPoints: serviceCharge } }
        );

        const withdrawal = new Withdraw({
            userId,
            walletType: 'totalAmount',
            method,
            number,
            amount: parsedAmount,
            status: 'pending'
        });
        await withdrawal.save();

        const updatedUser = await User.findById(userId);

        return res.status(201).json({ 
            success: true, 
            message: 'Withdrawal request submitted successfully', 
            data: withdrawal,
            newTotalAmount: (updatedUser as any).totalAmount
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getWithdrawals = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const withdrawals = await Withdraw.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: withdrawals });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const withdrawController = {
    createWithdrawal,
    getWithdrawals
}