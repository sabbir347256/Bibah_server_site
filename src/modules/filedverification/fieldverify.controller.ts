import { Request, Response } from "express";
import { FieldVerify } from "./fieldverify.model";
import { utils } from "../utils/utils";
import { User } from "../user/user.model";
import { StatusCodes } from "http-status-codes";


const createFieldVerify = async (req: Request, res: Response) => {
    try {
        const { userId, agentId, amount } = req.body;

        console.log(req.body)

        const agent = await User.findOne({ userID: agentId });

        if (!agent) {
            return utils.sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: "Agent not found",
                data: null,
            });
        }

        if (agent.role !== 'AGENT') {
            return utils.sendResponse(res, {
                statusCode: StatusCodes.BAD_REQUEST,
                success: false,
                message: "Provided ID does not belong to an Agent",
                data: null,
            });
        }

        const newRecord = new FieldVerify({ userId, agentId, amount });
        await newRecord.save();

        agent.mainWalletBalance = (agent.mainWalletBalance || 0) + Number(amount);
        await agent.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transactions fetched successfully",
            data: newRecord,
        });

    } catch (error) {
        return utils.sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Server Error",
            data: null,
        });
    }
};

// const getFieldVerifies = async (req: Request, res: Response) => {
//     try {
//         const records = await FieldVerify.find().sort({ createdAt: -1 });
//         res.status(200).json(records);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

const getFieldVerifies = async (req: Request, res: Response) => {
    try {
        const records = await FieldVerify.find().sort({ createdAt: -1 });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transactions fetched successfully",
            data: records,
        });
    } catch (error) {
        return utils.sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Server Error",
            data: null,
        });
    }
};

const deleteFieldVerify = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await FieldVerify.findByIdAndDelete(id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const fieldVerifyController = {
    createFieldVerify,
    getFieldVerifies,
    deleteFieldVerify
};