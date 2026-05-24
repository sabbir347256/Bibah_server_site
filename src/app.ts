import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status-codes";
import { router } from "./routes";
import expressSession from 'express-session';
import { globalErrorHandler } from "./errorsHelper/globalErrorHandle";
import notFound from "./errorsHelper/notFound";
import passport from "passport";

import './config/passport';

const app = express();

app.use(
  expressSession({
    secret: "Your Secret",
    resave: false,
    saveUninitialized: false,
  }),
);


app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "http://localhost:5000", 
      "https://bdapis.vercel.app/geo/v2.0"
    ],
    credentials: true, 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cookieParser());


app.use("/api/v1", router);

app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "welcome to our bibah project server............",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
