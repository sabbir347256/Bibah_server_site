import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import { sendVerificationEmail, sendVerificationSMS } from "../utils/email.utils";
import appError from "../../errorsHelper/appError";
import { utils } from "../utils/utils";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../utils/queryBuilder";
import jwt from "jsonwebtoken";
import { authenticate } from "passport";
import { deleteOldCloudinaryImage } from "../../config/imagefunciton";
import { IsActive } from "./user.interface";


interface MulterRequest extends Request {
    file?: Express.Multer.File;
}


const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = { ...req.body };
        const file = (req as any).file;

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
        if (!userData.contactNo) {
            throw new appError(StatusCodes.BAD_REQUEST, "Contact number is required!");
        }

        const isExist = await User.findOne({ email: userData.email.toLowerCase().trim() });
        const isExistContact = await User.findOne({ contactNo: userData.contactNo.trim() });
        const isExistNid = userData.nidNo ? await User.findOne({ nidNo: userData.nidNo.toLowerCase().trim() }) : null;

        if (isExist && isExist.isVerified) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email already registered!");
        }

        if (isExistContact) {
            throw new appError(StatusCodes.BAD_REQUEST, "ContactNo already registered!");
        }
        if (isExistNid) {
            throw new appError(StatusCodes.BAD_REQUEST, "Nid already registered!");
        }

        if (!userData.password) {
            throw new appError(StatusCodes.BAD_REQUEST, "Password is required!");
        }

        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        const isAgent = userData.role === "AGENT";

        const otpCode = isAgent ? null : Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = isAgent ? null : new Date(Date.now() + 10 * 60 * 1000);

        let userRecord;

        const dynamicStatus = isAgent
            ? { isVerified: true, isApproved: true, isActive: "ACTIVE" }
            : { isVerified: false, isApproved: false, isActive: "INACTIVE" };

        if (isExist) {
            Object.assign(isExist, userData, {
                password: hashedPassword,
                verificationCode: otpCode,
                verificationExpiry: expiryTime,
                ...dynamicStatus
            });
            userRecord = isExist;
        } else {
            userRecord = new User({
                ...userData,
                password: hashedPassword,
                verificationCode: otpCode,
                verificationExpiry: expiryTime,
                ...dynamicStatus
            });
        }

        if (!isAgent && otpCode) {
            try {
                await sendVerificationEmail(userRecord.email, otpCode);

                await sendVerificationSMS(userRecord.contactNo, otpCode);

            } catch (error) {
                console.error("Verification dispatch failed: ", error);
                throw new appError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to send verification code via Email/SMS. Please check your credentials and try again."
                );
            }
        }

        await userRecord.save();

        const result = userRecord.toObject();
        delete (result as any).password;
        delete (result as any).verificationCode;

        return utils.sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: isAgent
                ? "Agent registered successfully, account is now active and approved."
                : "Registration initial stage successful. Verification code sent to your email and mobile number.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// const registerUser = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const userData = { ...req.body };
//         const file = (req as any).file;

//         if (userData.auths && typeof userData.auths === "string") {
//             try {
//                 userData.auths = JSON.parse(userData.auths);
//             } catch (e) {
//                 console.error("Auths parsing error, keeping original");
//             }
//         }

//         if (file) {
//             userData.profileImage = file.path || file.location || file.filename;
//         }

//         if (!userData.email) {
//             throw new appError(StatusCodes.BAD_REQUEST, "Email is required!");
//         }

//         const isExist = await User.findOne({ email: userData.email.toLowerCase().trim() });

//         if (isExist && isExist.isVerified) {
//             throw new appError(StatusCodes.BAD_REQUEST, "Email already registered and verified!");
//         }

//         if (!userData.password) {
//             throw new appError(StatusCodes.BAD_REQUEST, "Password is required!");
//         }

//         const hashedPassword = await bcryptjs.hash(userData.password, 10);
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//         const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

//         let userRecord;

//         if (isExist) {
//             Object.assign(isExist, userData, {
//                 password: hashedPassword,
//                 verificationCode: otpCode,
//                 verificationExpiry: expiryTime,
//                 isVerified: false,
//             });
//             userRecord = isExist;
//         } else {
//             userRecord = new User({
//                 ...userData,
//                 password: hashedPassword,
//                 verificationCode: otpCode,
//                 verificationExpiry: expiryTime,
//                 isVerified: false,
//             });
//         }

//         try {
//             await sendVerificationEmail(userRecord.email, otpCode);
//         } catch (emailError) {
//             console.error("Email sending failed: ", emailError);
//             throw new appError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send verification email. Please try again.");
//         }

//         await userRecord.save();

//         const result = userRecord.toObject();
//         delete (result as any).password;
//         delete (result as any).verificationCode;

//         return utils.sendResponse(res, {
//             statusCode: StatusCodes.CREATED,
//             success: true,
//             message: "Registration initial stage successful. Verification code sent to your email.",
//             data: result,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

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
            email: { $ne: "superadmin@gmail.com" },
            role: { $nin: ["AGENT", "ADMIN"] }
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

        const userQuery = new QueryBuilder(User.find(queryCondition).select("-password"), req.query)
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

const getAllAgent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const searchableFields = ["fullName", "email", "contactNo", "profession"];

        let queryCondition: any = {
            isDeleted: false,
            role: "AGENT"
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

        const userQuery = new QueryBuilder(User.find(queryCondition).select("-password"), req.query)
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
// const updateUserStatus = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         const result = await User.findByIdAndUpdate(
//             id,
//             { isActive: status },
//             { new: true, runValidators: true }
//         );

//         if (!result) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         res.status(200).json({
//             success: true,
//             message: "User status updated successfully",
//             data: result,
//         });
//     } catch (error: any) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const currentFields = await User.findById(id);
        if (!currentFields) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (currentFields.bonusRefarelID) {
            const referrer = await User.findOne({ ownRefarelID: currentFields.bonusRefarelID }) as any;

            if (referrer) {
                if (currentFields.isActive !== "ACTIVE" && status === "ACTIVE") {
                    if (referrer.role === "AGENT") {
                        referrer.totalAmount = (referrer.totalAmount || 0) + 70;
                    } else if (referrer.role === "USER") {
                        referrer.bonusWalletPoints = (referrer.bonusWalletPoints || 0) + 100;
                    }
                    await referrer.save();
                }
                else if (currentFields.isActive === "ACTIVE" && status !== "ACTIVE") {
                    if (referrer.role === "AGENT") {
                        referrer.totalAmount = Math.max(0, (referrer.totalAmount || 0) - 70);
                    } else if (referrer.role === "USER") {
                        referrer.bonusWalletPoints = Math.max(0, (referrer.bonusWalletPoints || 0) - 100);
                    }
                    await referrer.save();
                }
            }
        }

        const result = await User.findByIdAndUpdate(
            id,
            { isActive: status },
            { new: true, runValidators: true }
        );

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
        console.log('adflj');
        const { id } = req.params;
        console.log(id);

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

const updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.params;
        const userIdentifier = (req as any).user?.email;

        if (!userIdentifier) {
            throw new appError(StatusCodes.UNAUTHORIZED, "Authentication token missing or invalid.");
        }

        if (type !== "avatar" && type !== "cover") {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid image update type scope.");
        }

        if (!req.file) {
            throw new appError(StatusCodes.BAD_REQUEST, "No image file provided for upload.");
        }

        const user = await User.findOne({ email: userIdentifier });
        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User profile record not found.");
        }

        const newImageUrl = req.file.path;



        if (type === "avatar") {
            if ((user as any).profileImage) {
                await deleteOldCloudinaryImage((user as any).profileImage);
            }
            (user as any).profileImage = newImageUrl;
        } else if (type === "cover") {
            if ((user as any).coverImage) {
                await deleteOldCloudinaryImage((user as any).coverImage);
            }
            (user as any).coverImage = newImageUrl;
        }

        await user.save();

        const result = user.toObject();
        delete (result as any).password;

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: `${type === "cover" ? "Cover" : "Avatar"} photo updated successfully.`,
            data: result,
        });
    } catch (error) {
        next(error);
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
        delete updateData.avatarPhoto;
        delete updateData.coverPhoto;

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

        const combinedQuery: Record<string, any> = {
            ...query,
            ...cleanedQueryObj,
            role: { $nin: ["AGENT", "ADMIN"] },
            // isDeleted: false,
            // isApproved: false
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


const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email is required!");
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found with this email!");
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = otpCode;
        user.verificationExpiry = expiryTime;
        await user.save();

        try {
            await sendVerificationEmail(user.email, otpCode);
        } catch (emailError) {
            throw new appError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send OTP email.");
        }

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "A 6-digit OTP has been sent to your email.",
            data: ''
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otpCode, newPassword } = req.body;

        if (!email || !otpCode || !newPassword) {
            throw new appError(StatusCodes.BAD_REQUEST, "All fields are required!");
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found!");
        }

        if (!user.verificationCode || user.verificationCode !== otpCode) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid OTP code!");
        }

        if (!user.verificationExpiry || new Date() > user.verificationExpiry) {
            throw new appError(StatusCodes.BAD_REQUEST, "OTP has expired!");
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        user.password = hashedPassword;
        (user as any).verificationCode = null;
        (user as any).verificationExpiry = null;
        await user.save();

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Password reset successful!",
            data: ''
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
    searchProfiles,
    getAllAgent,
    updateProfileImage,
    forgotPassword,
    resetPassword
};