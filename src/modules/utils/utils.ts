import { Response } from "express";
import { StatusCodes } from "http-status-codes";

type TMeta = {
  total: number;
};

type IResponseOptions<T> = {
  statusCode?: number; 
  success: boolean;
  message: string;
  data: T;
  meta?: TMeta;
};

export const sendResponse = <T>(
  res: Response,
  options: IResponseOptions<T>,
) => {
  const { statusCode = StatusCodes.OK, success, message, data, meta } = options;

  const responseObj: any = {
    statusCode,
    success,
    message,
    data,
  };

  if (meta) responseObj.meta = meta;

  return res.status(statusCode).json(responseObj);
};
export const utils = {
  sendResponse,
};
