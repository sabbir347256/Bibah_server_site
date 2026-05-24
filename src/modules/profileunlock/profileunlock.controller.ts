import { NextFunction, Request, Response, response } from "express";
import appError from "../../errorsHelper/appError";
import { ProfileUnlock } from "./profileunlock.mode";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { utils } from "../utils/utils";
import mongoose from "mongoose";

const unlockProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const viewerId = (req as any).user?.id;
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
        const viewerId = (req as any).user?.id;
        const { id } = req.params;

        if (!id) {
            throw new appError(StatusCodes.BAD_REQUEST, "Profile ID is required!");
        }

        const targetUser = await User.findById(id).select("-password");
        if (!targetUser) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found!");
        }

        const isUnlocked = await ProfileUnlock.findOne({
            unlockedBy: new mongoose.Types.ObjectId(viewerId),
            targetProfile: new mongoose.Types.ObjectId(id as string),
        });

        const isOwnProfile = viewerId === id;
        const showContactDetails = !!isUnlocked || isOwnProfile;

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