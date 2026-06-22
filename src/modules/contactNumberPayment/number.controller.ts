import { Request, Response } from "express";
import envVars from "../../config/envars";
import axios from "axios";
import { PhoneUnlockTransaction } from "./number.model";
import { User } from "../user/user.model";

const initiatePhoneUnlockPayment = async (req: Request, res: Response) => {
    try {
        const { buyerUserObjectId, targetUserObjectId, name, email, phone, originUrl } = req.body;

        const invoiceNumber = `PHN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await PhoneUnlockTransaction.create({
            buyerUserObjectId,
            targetUserObjectId,
            transactionId: invoiceNumber,
            phoneNumber: phone || "01700000000",
            amount: 77,
            status: "PENDING",
            originUrl: originUrl
        });

        const formData = new URLSearchParams();
        formData.append('merchantId', envVars.PAYSTATION_MERCHANT_ID);
        formData.append('password', envVars.PAYSTATION_PASSWORD);
        formData.append('invoice_number', invoiceNumber);
        formData.append('currency', 'BDT');
        formData.append('payment_amount', '77');
        formData.append('reference', `Phone Unlock Target: ${targetUserObjectId}`);
        formData.append('cust_name', name || "User Name");
        formData.append('cust_phone', phone || "01700000000");
        formData.append('cust_email', email || "user@gmail.com");
        formData.append('cust_address', "Dhaka, Bangladesh");
        formData.append('checkout_items', "PHONE_NUMBER_UNLOCK");
        formData.append('opt_a', originUrl);
        formData.append('callback_url', `${envVars.BACKEND_URL}/api/v1/phoneUnlock/callback`);

        const response = await axios.post('https://sandbox.paystation.com.bd/initiate-payment', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status_code === "200" && response.data.status === "success") {
            return res.status(200).json({
                success: true,
                payment_url: response.data.payment_url
            });
        } else {
            return res.status(400).json({ success: false, message: response.data.message || "Gateway Error" });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handlePhoneUnlockCallback = async (req: Request, res: Response) => {
    try {
        const { status, invoice_number, trx_id } = req.method === 'POST' ? req.body : req.query;
        const paymentStatus = String(status).toLowerCase();

        if (!invoice_number) {
            return res.status(400).send("Invalid Request Parameter");
        }

        const transaction = await PhoneUnlockTransaction.findOne({ transactionId: invoice_number as string });
        let targetFrontendUrl = transaction?.originUrl || 'https://bibah.app';

        if (!transaction) {
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=TransactionNotFound`);
        }

        if (transaction.status === "APPROVED") {
            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=PHONE_UNLOCK&invoice=${invoice_number}&trx=${transaction.gatewayTransactionId || trx_id}`);
        }

        if (paymentStatus === 'successful' || paymentStatus === 'success') {
            await User.findByIdAndUpdate(transaction.buyerUserObjectId, {
                $addToSet: { unlockedUserPhones: transaction.targetUserObjectId }
            });

            transaction.gatewayTransactionId = trx_id as string;
            transaction.status = "APPROVED";
            await transaction.save();

            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=PHONE_UNLOCK&invoice=${invoice_number}&trx=${trx_id}`);
        } else {
            transaction.status = "REJECTED";
            await transaction.save();
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=GatewayDeclined`);
        }
    } catch (error: any) {
        return res.status(500).send("Internal Server Error occurred.");
    }
};

export const phoneUnlockPaymentControllers = {
    initiatePhoneUnlockPayment,
    handlePhoneUnlockCallback
};