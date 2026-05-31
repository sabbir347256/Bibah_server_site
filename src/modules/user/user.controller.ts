import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import { sendVerificationEmail } from "../utils/email.utils";
import appError from "../../errorsHelper/appError";
import { utils } from "../utils/utils";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../utils/queryBuilder";
import jwt from "jsonwebtoken";
import { authenticate } from "passport";


interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = { ...req.body };
        console.log("Incoming Registration Data: ", userData);

        const file = (req as any).file; // টাইপ সেফটি সহজ করা হলো

        if (userData.auths && typeof userData.auths === "string") {
            try {
                userData.auths = JSON.parse(userData.auths);
            } catch (e) {
                console.error("Auths parsing error, keeping original");
            }
        }

        if (file) {
            userData.profileImage = file.path || file.location || file.filename;
        }

        if (!userData.email) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email is required!");
        }

        const isExist = await User.findOne({ email: userData.email.toLowerCase().trim() });

        if (isExist && isExist.isVerified) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email already registered and verified!");
        }

        if (!userData.password) {
            throw new appError(StatusCodes.BAD_REQUEST, "Password is required!");
        }

        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

        let userRecord;

        if (isExist) {
            Object.assign(isExist, userData, {
                password: hashedPassword,
                verificationCode: otpCode,
                verificationExpiry: expiryTime,
                isVerified: false,
            });
            userRecord = isExist;
        } else {
            userRecord = new User({
                ...userData,
                password: hashedPassword,
                verificationCode: otpCode,
                verificationExpiry: expiryTime,
                isVerified: false,
            });
        }

        // ইমেইল পাঠানোর ট্রাই-ক্যাচ যাতে ইমেইল ফেইল করলে সার্ভার ক্র্যাশ না করে
        try {
            await sendVerificationEmail(userRecord.email, otpCode);
        } catch (emailError) {
            console.error("Email sending failed: ", emailError);
            throw new appError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send verification email. Please try again.");
        }

        await userRecord.save();

        const result = userRecord.toObject();
        delete (result as any).password;
        delete (result as any).verificationCode;

        return utils.sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Registration initial stage successful. Verification code sent to your email.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email and Code are required!");
        }

        const user = await User.findOne({ email });

        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found with this email!");
        }

        if (user.isVerified === true) {
            throw new appError(StatusCodes.BAD_REQUEST, "User is already verified!");
        }

        if (user.verificationCode !== code) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid verification code!");
        }

        if (!user.verificationExpiry || new Date() > user.verificationExpiry) {
            throw new appError(StatusCodes.BAD_REQUEST, "Verification code has expired!");
        }

        if (user.bonusRefarelID) {
            await User.findOneAndUpdate(
                { ownRefarelID: user.bonusRefarelID },
                { $inc: { walletPoints: 100 } }
            );
        }

        user.isVerified = true;
        user.verificationStage = 'OTP verified';
        user.verificationCode = undefined as any;
        user.verificationExpiry = undefined as any;
        await user.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Email verification successful. Confirm User account created!",
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userPayload = req.user as JwtPayload;

        if (!userPayload || !userPayload.email) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token or user not authenticated",
            });
        }

        const user = await User.findOne({ email: userPayload.email });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found in database",
            });
        }

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "User profile retrieved successfully",
            data: user,
        });

    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const searchableFields = ["fullName", "email", "contactNo", "profession"];

        let queryCondition: any = {
            isDeleted: false,
            email: { $ne: "superadmin@gmail.com" }
        };

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = jwt.verify(token as string, process.env.JWT_ACCESS_SECRET as string) as any;
                const currentUserId = decoded?.userId || decoded?.id;

                if (currentUserId) {
                    queryCondition._id = { $ne: currentUserId };
                }
            } catch (tokenError) {
            }
        }

        const userQuery = new QueryBuilder(User.find(queryCondition), req.query)
            .search(searchableFields)
            .filter()
            .sort()
            .paginate()
            .fields();

        const result = await userQuery.modelQuery;
        const meta = await userQuery.countTotal();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            meta,
            message: "Users fetched successfully",
            data: result,
        });

    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await User.findByIdAndUpdate(
            id,
            { isActive: status },
            { new: true, runValidators: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await User.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateData = { ...req.body };

        delete updateData.password;
        delete updateData.role;
        delete updateData.mainWalletBalance;
        delete updateData.bonusWalletPoints;
        delete updateData.walletPoints;
        delete updateData.agentReferWalletPoints;
        delete updateData.ownRefarelID;
        delete updateData.userID;

        const userIdentifier = (req as any).user?.email || updateData.email;

        if (!userIdentifier) {
            throw new appError(StatusCodes.BAD_REQUEST, "User identity is required to update profile.");
        }

        const user = await User.findOne({ email: userIdentifier });

        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User profile not found.");
        }

        Object.assign(user, updateData);

        await user.save();

        const result = user.toObject();
        delete (result as any).password;

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Profile updated successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const searchProfiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = { ...req.query };
        const cleanedQueryObj: Record<string, any> = {};

        if (query.religion) {
            cleanedQueryObj.religion = { $regex: query.religion, $options: "i" };
        }
        if (query.profession) {
            cleanedQueryObj.profession = { $regex: query.profession, $options: "i" };
        }
        if (query.currentDistrict) {
            cleanedQueryObj.currentDistrict = { $regex: query.currentDistrict, $options: "i" };
        }
        if (query.familyStatus) {
            cleanedQueryObj.maritalStatus = { $regex: query.familyStatus, $options: "i" };
        }
        if (query.education) {
            const eduArray = (query.education as string).split(",");
            cleanedQueryObj.education = { $in: eduArray.map(edu => new RegExp(edu, "i")) };
        }

        const excludeFields = ["searchTerm", "sort", "limit", "page", "fields", "religion", "profession", "currentDistrict", "education", "familyStatus"];
        excludeFields.forEach((el) => delete query[el]);

        const combinedQuery = {
            ...query,
            ...cleanedQueryObj,
            isDeleted: false,
            isApproved: false
        };

        const searchableFields = ["fullName", "userID", "email", "profession"];

        const userQueryBuilder = new QueryBuilder(User.find(combinedQuery), req.query)
            .search(searchableFields)
            .sort()
            .paginate();

        const result = await userQueryBuilder.modelQuery;
        const meta = await userQueryBuilder.countTotal();

        res.status(200).json({
            success: true,
            message: "Profiles retrieved successfully",
            meta,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const userControllers = {
    registerUser,
    verifyEmail,
    getMyProfile,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    updateProfile,
    searchProfiles
};