import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { AuthRouter } from "../modules/auth/auth.routes";
import { transactionRoutes } from "../modules/Recharge/recharge.routes";
import { fieldVerifyRoute } from "../modules/filedverification/fieldverify.routes";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    router: userRoutes,
  },
  {
    path: "/auth",
    router: AuthRouter,
  },
  {
    path: "/transaction",
    router: transactionRoutes,
  },
  {
    path: "/fieldverify",
    router: fieldVerifyRoute,
  }

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.router);
});
