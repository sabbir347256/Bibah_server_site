import { NextFunction, Request, Response, response } from "express";
import appError from "../../errorsHelper/appError";
import { ProfileUnlock } from "./profileunlock.mode";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { utils } from "../utils/utils";

const unlockProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const viewerId = (req as any).user?.id;
        const { targetUserId } = req.body;

        if (viewerId === targetUserId) {
            throw new appError(StatusCodes.BAD_REQUEST, "You cannot unlock your own profile!");
        }

        const alreadyUnlocked = await ProfileUnlock.findOne({
            unlockedBy: viewerId,
            targetProfile: targetUserId,
        });

        if (alreadyUnlocked) {
            throw new appError(StatusCodes.BAD_REQUEST, "Profile is already unlocked!");
        }

        const viewer = await User.findById(viewerId);
        if (!viewer) {
            throw new appError(StatusCodes.NOT_FOUND, "Viewer not found!");
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
            unlockedBy: viewerId,
            targetProfile: targetUserId,
        });
        await newUnlock.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Profile unlocked successfully.",
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

export const profileUnlockController = {
    unlockProfile,
};