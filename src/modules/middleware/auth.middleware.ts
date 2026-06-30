import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { IsActive } from '../user/user.interface';
import appError from '../../errorsHelper/appError';
import envVars from '../../config/envars';

export const checkAuth =
  (...restRole: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization as string;
        const accessToken = authHeader.split(" ")[1];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new appError(httpStatus.UNAUTHORIZED, "Token not provided!");
        }

        if (!accessToken) {
          throw new appError(401, "Unauthorized! token must required.");
        }

        const verifyUser = verifyToken(
          accessToken as string,
          envVars.JWT_ACCESS_SECRET,
        ) as JwtPayload;

        if (!verifyUser) {
          throw new appError(httpStatus.UNAUTHORIZED, "Invalid token!");
        }

        const isUser = await User.findById(verifyUser?.userId);
        if (!isUser) {
          throw new appError(httpStatus.UNAUTHORIZED, "No user found!");
        }

        // if (
        //   isUser.isActive === IsActive.INACTIVE || isUser.isActive === IsActive.BLOCKED
        // ) {
        //   throw new appError(
        //     httpStatus.FORBIDDEN,
        //     "User is Blocked or Inactive!",
        //   );
        // }

        //   if (isUser?.isDeleted) {
        //     throw new appError(httpStatus.FORBIDDEN, "The user was deleted!");
        //   }

        if (restRole.length && !restRole.includes(verifyUser.role)) {
          throw new appError(
            httpStatus.FORBIDDEN,
            "You are not permitted to access this route!",
          );
        }

        req.user = verifyUser;
        next();
      } catch (error) {
        next(error);
      }
    };
