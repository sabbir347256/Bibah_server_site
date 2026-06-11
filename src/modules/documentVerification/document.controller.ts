import { NextFunction, Request, Response } from "express";
import { User } from "../user/user.model";
import { NidDocument } from "./document.model";
import { utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";


const uploadNid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const files = (req as any).files as any[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload NID images",
            });
        }

        const nidImages = files.map((file) => file.path || file.location || file.filename);

        const existingDoc = await NidDocument.findOne({ userId });

        if (existingDoc && (existingDoc.status === "pending" || existingDoc.status === "verified")) {
            return res.status(400).json({
                success: false,
                message: "NID submission is already pending or verified",
            });
        }

        let savedDoc;
        if (existingDoc) {
            existingDoc.nidImages = nidImages;
            existingDoc.status = "pending";
            savedDoc = await existingDoc.save();
        } else {
            savedDoc = new NidDocument({
                userId,
                nidImages,
                status: "pending",
            });
            await savedDoc.save();
        }

        // await User.findByIdAndUpdate(userId, { nidStatus: "pending" });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Your documents have been submitted successfully. Admin will review your documents shortly.",
            data: savedDoc,
        });

    } catch (error) {
        next(error);
    }
};

const checkNidSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const existingDoc = await NidDocument.findOne({ userId: userId });

        if (existingDoc) {
            return res.status(200).json({
                success: true,
                exists: true,
                status: existingDoc.status,
            });
        }

        return res.status(200).json({
            success: true,
            exists: false,
        });
    } catch (error) {
        next(error);
    }
};


const getAllNidSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const submissions = await NidDocument.find().populate("userId", "fullName email contactNo userID");
        return res.status(200).json({
            success: true,
            data: submissions,
        });
    } catch (error) {
        next(error);
    }
};

const updateNidStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["verified", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const updatedDoc = await NidDocument.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({
                success: false,
                message: "NID document not found",
            });
        }

        if (status === "verified") {
            await User.findByIdAndUpdate(updatedDoc.userId, {
                $set: { isDocumentVerification: true }
            });
        }
        else if (status === "rejected") {
            await User.findByIdAndUpdate(updatedDoc.userId, {
                $set: { isDocumentVerification: false }
            });
        }

        return res.status(200).json({
            success: true,
            message: `NID status updated to ${status}`,
            data: updatedDoc,
        });
    } catch (error) {
        next(error);
    }
};

const deleteNidSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedDoc = await NidDocument.findByIdAndDelete(id);

        if (!deletedDoc) {
            return res.status(404).json({
                success: false,
                message: "NID document not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "NID submission deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const nidController = {
    uploadNid,
    checkNidSubmission,
    getAllNidSubmissions,
    updateNidStatus,
    deleteNidSubmission
};