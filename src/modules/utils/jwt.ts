import jwt, { SignOptions } from "jsonwebtoken";

export const generateToken = (
  payload: object,
  secret: string,
  expiresIn: string,
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);

  return token;
};

export const verifyToken = (token: string, secret: string) => {
  const verifyedToken = jwt.verify(token, secret);

  return verifyedToken;
};

export interface IJwtPayload {
  email: string;
  userId: string;
  role: "ADMIN" | "USER";
  iat: number;
  exp: number;
}