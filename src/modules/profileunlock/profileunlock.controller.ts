import { NextFunction, Request, Response } from "express";
import appError from "../../errorsHelper/appError";
import { ProfileUnlock } from "./profileunlock.mode";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { utils } from "../utils/utils";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const unlockProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const viewerId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;
        const { targetUserId } = req.body;

        if (!targetUserId || typeof targetUserId !== "string") {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid target user ID!");
        }

        if (viewerId === targetUserId) {
            throw new appError(StatusCodes.BAD_REQUEST, "You cannot unlock your own profile!");
        }

        const alreadyUnlocked = await ProfileUnlock.findOne({
            unlockedBy: new mongoose.Types.ObjectId(viewerId),
            targetProfile: new mongoose.Types.ObjectId(targetUserId),
        });

        if (alreadyUnlocked) {
            throw new appError(StatusCodes.BAD_REQUEST, "Profile is already unlocked!");
        }

        const viewer = await User.findById(viewerId);
        if (!viewer) {
            throw new appError(StatusCodes.NOT_FOUND, "Viewer not found!");
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            throw new appError(StatusCodes.NOT_FOUND, "Target user not found!");
        }

        const requiredPoints = 7;

        if (viewer.walletPoints >= requiredPoints) {
            viewer.walletPoints -= requiredPoints;
        } else {
            const remainingNeeded = requiredPoints - viewer.walletPoints;
            if (viewer.mainWalletBalance < remainingNeeded) {
                throw new appError(StatusCodes.BAD_REQUEST, "Insufficient balance to unlock this profile!");
            }
            viewer.walletPoints = 0;
            viewer.mainWalletBalance -= remainingNeeded;
        }

        await viewer.save();

        const newUnlock = new ProfileUnlock({
            unlockedBy: new mongoose.Types.ObjectId(viewerId),
            targetProfile: new mongoose.Types.ObjectId(targetUserId),
        });
        await newUnlock.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Profile unlocked successfully.",
            data: {
                contactNo: targetUser.contactNo,
                email: targetUser.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getProfileDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new appError(StatusCodes.BAD_REQUEST, "Profile ID is required!");
        }

        let viewerId = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            
            if (token && token !== "null" && token !== "undefined") {
                try {
                    const secretKey = process.env.JWT_ACCESS_SECRET || "secret";
                    const decoded = jwt.verify(token, secretKey as string) as any;
                    viewerId = decoded?.userId || decoded?.id || decoded?._id;
                } catch (jwtError) {
                    console.error("JWT Verification Error on Refresh:", jwtError);
                    viewerId = null;
                }
            }
        }

        const targetUser = await User.findById(id).select("-password");
        if (!targetUser) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found!");
        }

        let isUnlocked = false;
        if (viewerId) {
            const unlockRecord = await ProfileUnlock.findOne({
                unlockedBy: new mongoose.Types.ObjectId(viewerId),
                targetProfile: new mongoose.Types.ObjectId(id as string),
            });
            isUnlocked = !!unlockRecord;
        }

        const isOwnProfile = viewerId && viewerId.toString() === id.toString();
        const showContactDetails = isUnlocked || isOwnProfile;

        const responseData = targetUser.toObject();
        if (!showContactDetails) {
            responseData.contactNo = "LOCKED";
            responseData.email = "LOCKED";
        }

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Profile details fetched successfully.",
            data: {
                profile: responseData,
                isProfileLocked: !showContactDetails,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const profileUnlockController = {
    unlockProfile,
    getProfileDetails,
};