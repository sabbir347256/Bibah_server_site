import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import appError from "../../errorsHelper/appError";
import { User } from "../user/user.model";
import { ConnectionRequest } from "./request.model";
import { RequestStatus } from "./request.interfaces";
import { utils } from "../utils/utils";
import mongoose from "mongoose";

const sendConnectionRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const senderId = (req as any).user?.userId;
        const { receiverId } = req.body;

        if (!receiverId || senderId === receiverId) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid receiver ID!");
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found!");
        }

        if (sender.isActive === 'INACTIVE') {
            throw new appError(StatusCodes.BAD_REQUEST, "Please activate your profile first.");
        }

        if (sender.gender === receiver.gender) {
            throw new appError(StatusCodes.BAD_REQUEST, "You can only send requests to the opposite gender!");
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { senderId: sender._id, receiverId: receiver._id },
                { senderId: receiver._id, receiverId: sender._id }
            ]
        });

        if (existingRequest) {
            throw new appError(StatusCodes.BAD_REQUEST, "A request or connection already exists between you two.");
        }

        const requiredPoints = 7;
        if (sender.walletPoints >= requiredPoints) {
            sender.walletPoints -= requiredPoints;
        } else {
            const remainingNeeded = requiredPoints - sender.walletPoints;
            if (sender.mainWalletBalance < remainingNeeded) {
                throw new appError(StatusCodes.BAD_REQUEST, "Insufficient balance to send request!");
            }
            sender.walletPoints = 0;
            sender.mainWalletBalance -= remainingNeeded;
        }

        await sender.save();

        const newRequest = await ConnectionRequest.create({
            senderId: sender._id,
            receiverId: receiver._id,
            status: RequestStatus.PENDING
        });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Connection request sent successfully.",
            data: newRequest
        });
    } catch (error) {
        next(error);
    }
};

const handleRequestAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId;
        const { requestId, action } = req.body;

        if (![RequestStatus.ACCEPTED, RequestStatus.REJECTED].includes(action)) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid action.");
        }

        const request = await ConnectionRequest.findOne({
            _id: requestId,
            receiverId: userId,
            status: RequestStatus.PENDING
        });

        if (!request) {
            throw new appError(StatusCodes.NOT_FOUND, "Pending request not found.");
        }

        request.status = action;
        await request.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: `Request ${action.toLowerCase()} successfully.`,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

const getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId;
        const requests = await ConnectionRequest.find({
            receiverId: userId,
            status: RequestStatus.PENDING
        }).populate('senderId', 'fullName profileImage gender birth');

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Fetched pending requests.",
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

const getConnectionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = (req as any).user?.userId;
        const { targetUserId } = req.params as { targetUserId: string };

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid target user ID format.");
        }

        const request = await ConnectionRequest.findOne({
            $or: [
                { senderId: new mongoose.Types.ObjectId(currentUserId), receiverId: new mongoose.Types.ObjectId(targetUserId) },
                { senderId: new mongoose.Types.ObjectId(targetUserId), receiverId: new mongoose.Types.ObjectId(currentUserId) }
            ]
        }).lean();

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            throw new appError(StatusCodes.NOT_FOUND, "Target user not found.");
        }

        const hasUnlockedPhone = await mongoose.model('PhoneUnlockTransaction').findOne({
            buyerUserObjectId: new mongoose.Types.ObjectId(currentUserId),
            targetUserObjectId: new mongoose.Types.ObjectId(targetUserId),
            status: "APPROVED"
        }).lean();

        if (hasUnlockedPhone) {
            return utils.sendResponse(res, {
                statusCode: StatusCodes.OK,
                success: true,
                message: "Full access granted.",
                data: {
                    status: "FULL_ACCESS",
                    isSender: false,
                    requestId: null,
                    contactNo: targetUser.contactNo,
                    email: targetUser.email,
                    currentThana: targetUser.currentThana,
                    currentDistrict: targetUser.currentDistrict,
                    currentDivision: targetUser.currentDivision,
                    currentCountry: targetUser.currentCountry,
                    permanentThana: targetUser.permanentThana,
                    permanentDistrict: targetUser.permanentDistrict,
                    permanentDivision: targetUser.permanentDivision,
                    permanentCountry: targetUser.permanentCountry
                }
            });
        }

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Status fetched successfully.",
            data: {
                status: request ? request.status : "NONE",
                isSender: request ? String(request.senderId) === String(currentUserId) : false,
                requestId: request ? String(request._id) : null,
                contactNo: "",
                email: "",
                currentThana: "",
                currentDistrict: "",
                currentDivision: "",
                currentCountry: "",
                permanentThana: "",
                permanentDistrict: "",
                permanentDivision: "",
                permanentCountry: ""
            }
        });
    } catch (error) {
        next(error);
    }
};

export const requestController = {
    sendConnectionRequest,
    handleRequestAction,
    getPendingRequests,
    getConnectionStatus
};