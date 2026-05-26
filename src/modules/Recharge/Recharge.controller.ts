import { Request, Response } from "express";
import { Transaction } from "./recharge.model";
import { utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const createTransaction = async (req: Request, res: Response) => {
    try {
        const { userObjectId, userId, transactionId, phoneNumber, amount } = req.body;
        console.log('alkdhf', req.body)

        const isExist = await Transaction.findOne({ transactionId });
        if (isExist) {
            return res.status(400).json({ success: false, message: "Transaction ID already exists" });
        }

        const result = await Transaction.create({
            userObjectId,
            userId,
            transactionId,
            phoneNumber,
            amount
        });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transaction submitted successfully",
            data: result,
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const result = await Transaction.find().populate("userObjectId");
        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transactions fetched successfully",
            data: result,
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTransactionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        if (transaction.status === "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "This transaction is already approved. Amount cannot be added again."
            });
        }

        if (status === "APPROVED") {
            const amountToAdd = transaction.amount || 0;

            const updatedUser = await User.findByIdAndUpdate(
                transaction.userObjectId,
                {
                    $set: { isActive: IsActive.ACTIVE },
                    $inc: { mainWalletBalance: amountToAdd }
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "Associated user not found" });
            }
        }

        transaction.status = status;
        const result = await transaction.save();

        res.status(200).json({
            success: true,
            message: `Transaction status updated to ${status} successfully`,
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await Transaction.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const transactionControllers = {
    createTransaction,
    getAllTransactions,
    deleteTransaction,
    updateTransactionStatus
};