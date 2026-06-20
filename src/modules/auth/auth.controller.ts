import { NextFunction, Request, Response } from "express";
import appError from "../../errorsHelper/appError";
import { createUserToken } from "../utils/createUserToken";
import { setAuthCookies } from "../utils/setCookies";
import { sendResponse } from "../utils/utils";
import httpStatus from "http-status-codes";
import passport from "passport";
import { catchAsync } from "../utils/catchAsyn";
import envVars from "../../config/envars";


const credentialLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("user-local", async (err: any, user: any, info: any) => {
      try {
        if (err) {
          return next(new appError(401, err));
        }

        if (!user) {
          return next(new appError(401, info?.message || "Login failed"));
        }

        const userTokens = await createUserToken(user);
        const { password: pass, ...rest } = user.toObject();

        setAuthCookies(res, userTokens);

        return sendResponse(res, {
          statusCode: httpStatus.OK,
          message: "User Login Successfully",
          success: true,
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user: rest,
          },
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  }
);

const agentLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("agent-local", async (err: any, user: any, info: any) => {
      try {
        if (err) {
          return next(new appError(401, err));
        }

        if (!user) {
          return next(new appError(401, info?.message || "Login failed"));
        }

        // if (user.isApproved === false) {
        //   return next(
        //     new appError(
        //       401,
        //       "You will be able to log in after the admin approves your account."
        //     )
        //   );
        // }

        const userTokens = await createUserToken(user);
        const { password: pass, ...rest } = user.toObject();

        setAuthCookies(res, userTokens);

        return sendResponse(res, {
          statusCode: httpStatus.OK,
          message: "User Login Successfully",
          success: true,
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user: rest,
          },
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  }
);

const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { session: false }, async (err: any, user: any) => {
    try {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
      }
      const userTokens = await createUserToken(user);
      setAuthCookies(res, userTokens);

      return res.redirect(
        `${process.env.FRONTEND_URL}/login-success?token=${userTokens.accessToken}`
      );
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};


export const authUserController = {
  credentialLogin,
  agentLogin,
  googleCallback
};
