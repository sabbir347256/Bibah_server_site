import { Request, Response } from "express";
import { User } from "../user/user.model";
import { Withdraw } from "./withdraw.model";
import QueryBuilder from "../utils/queryBuilder";
import { utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";


const createWithdrawal = async (req: Request, res: Response) => {
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


const getWithdrawals = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user || !user.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let baseQuery: Record<string, any> = {};

        if (user.role === 'AGENT') {
            baseQuery.userId = user.userId;
        }

        const withdrawalQuery = new QueryBuilder(
            Withdraw.find(baseQuery).populate({
                path: 'userId',
                select: 'userID fullName email contactNo isActive'
            }),
            req.query
        )
            .search(['userId', 'email', 'fullName'])
            .filter()
            .sort()
            .paginate()
            .fields();

        const result = await withdrawalQuery.modelQuery;
        const meta = await withdrawalQuery.countTotal();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            meta,
            message: "Withdraw list fetch successfully",
            data: result,
        });

    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const withdrawController = {
    createWithdrawal,
    getWithdrawals
}