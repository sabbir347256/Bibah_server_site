import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { AuthRouter } from "../modules/auth/auth.routes";
import { transactionRoutes } from "../modules/Recharge/recharge.routes";
import { fieldVerifyRoute } from "../modules/filedverification/fieldverify.routes";
import { documentVerification } from "../modules/documentVerification/document.routes";
import { withdrawRoutes } from "../modules/withdraw/withdraw.routes";
import { nidTransactionRoutes } from "../modules/nidTransaction/nidtransaction.routes";
import { fieldTransactionRoutes } from "../modules/fieldtransaction/fieldtransaction.routes";
import { phoneUnlockPaymentRoutes } from "../modules/contactNumberPayment/number.routes";
import { premiumPaymentRoutes } from "../modules/premiumefunction/premium.routes";
import { photoGalleryRoutes } from "../modules/profileImage/image.routes";

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
  },
  {
    path: "/verification",
    router: documentVerification,
  },
  {
    path: "/withdraw",
    router: withdrawRoutes,
  },
  {
    path: "/nidtransaction",
    router: nidTransactionRoutes,
  },
  {
    path: "/fieldTransaction",
    router: fieldTransactionRoutes,
  },
  {
    path: "/phoneunlock",
    router: phoneUnlockPaymentRoutes,
  },
  {
    path: "/premiumPayment",
    router: premiumPaymentRoutes,
  },
  {
    path: "/photo-gallery",
    router: photoGalleryRoutes,
  },

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.router);
});
