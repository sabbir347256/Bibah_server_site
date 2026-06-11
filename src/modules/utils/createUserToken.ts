import envVars from "../../config/envars";
import { IUser } from "../user/user.interface";
import { generateToken } from "./jwt";

export const createUserToken = async(user : Partial<IUser>) => {
    const jwtPayload = {
        email: user?.email,
        userId: user?._id,
        userProfileId: user?.userID,
        role: user?.role,
        profileImage : user?.profileImage,
        name : user?.fullName,
        phone : user?.contactNo
      };
    
      const accessToken = generateToken(jwtPayload,envVars.JWT_ACCESS_SECRET,String(envVars.JWT_ACCESS_EXPIRES));
      const refreshToken = generateToken(jwtPayload,envVars.JWT_REFRESH_SECRET,String(envVars.JWT_REFRESH_EXPIRES));

      return {
        accessToken,
        refreshToken
      }
};
