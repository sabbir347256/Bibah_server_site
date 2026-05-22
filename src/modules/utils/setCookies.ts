import { Response } from "express";

export type AuthToken = {
  accessToken?: string;
  refreshToken?: string;
};

export const setAuthCookies = async (res: Response, tokenInfo: AuthToken) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: false,
    });
  }
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: false,
    });
  }
};
