import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import { sendVerificationEmail } from "../utils/email.utils";
import appError from "../../errorsHelper/appError";
import { utils } from "../utils/utils";

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = { ...req.body };
        const file = (req as MulterRequest).file;

        if (userData.auths && typeof userData.auths === "string") {
            try {
                userData.auths = JSON.parse(userData.auths);
            } catch (e) {
                console.error("Auths parsing error, keeping original");
            }
        }

        if (file) {
            userData.profileImage = file.path || (file as any).location || file.filename;
        }


        const isExist = await User.findOne({ email: userData.email });



        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

        if (!userData.password) {
            throw new appError(StatusCodes.BAD_REQUEST, "Password is required!");
        }
        const hashedPassword = await bcryptjs.hash(userData.password, 10);

        let userRecord;

        if (isExist) {
            if (isExist.isVerified) {
                throw new appError(StatusCodes.BAD_REQUEST, "Email already registered and verified!");
            }

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

        await sendVerificationEmail(userRecord.email, otpCode);
        await userRecord.save();

        const result = userRecord.toObject();
        console.log('result', result);
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

        console.log('kahdfa', req.body)

        if (!email || !code) {
            throw new appError(StatusCodes.BAD_REQUEST, "Email and Code are required!");
        }

        const user = await User.findOne({ email });

        if (!user) {
            throw new appError(StatusCodes.NOT_FOUND, "User not found with this email!");
        }

        if (user.isVerified) {
            throw new appError(StatusCodes.BAD_REQUEST, "User is already verified!");
        }

        if (user.verificationCode !== code) {
            throw new appError(StatusCodes.BAD_REQUEST, "Invalid verification code!");
        }

        if (user.verificationExpiry && new Date() > user.verificationExpiry) {
            throw new appError(StatusCodes.BAD_REQUEST, "Verification code has expired!");
        }

        user.isVerified = true;
        user.isActive = "ACTIVE" as any;
        user.verificationStage = 'OTP verified';
        user.verificationCode = null as any;
        user.verificationExpiry = null as any;
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

export const userControllers = {
    registerUser,
    verifyEmail,
};