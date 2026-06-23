import { Request, Response } from "express";
import { PremiumTransaction } from "./premium.model";
import envVars from "../../config/envars";
import axios from "axios";
import { User } from "../user/user.model";
import QueryBuilder from "../utils/queryBuilder";
import { StatusCodes } from "http-status-codes";


const initiatePremiumPayment = async (req: Request, res: Response) => {
    try {
        const { userObjectId, name, email, phone, originUrl } = req.body;

        const invoiceNumber = `PRM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await PremiumTransaction.create({
            userObjectId,
            transactionId: invoiceNumber,
            phoneNumber: phone || "01700000000",
            amount: 9999,
            status: "PENDING",
            originUrl: originUrl
        });

        const formData = new URLSearchParams();
        formData.append('merchantId', envVars.PAYSTATION_MERCHANT_ID);
        formData.append('password', envVars.PAYSTATION_PASSWORD);
        formData.append('invoice_number', invoiceNumber);
        formData.append('currency', 'BDT');
        formData.append('payment_amount', '9999');
        formData.append('reference', `Premium Upgrade User: ${userObjectId}`);
        formData.append('cust_name', name || "User Name");
        formData.append('cust_phone', phone || "01700000000");
        formData.append('cust_email', email || "user@gmail.com");
        formData.append('cust_address', "Dhaka, Bangladesh");
        formData.append('checkout_items', "PREMIUM_MEMBERSHIP");
        formData.append('opt_a', originUrl);
        formData.append('callback_url', `${envVars.BACKEND_URL}/api/v1/premiumPayment/callback`);

        const response = await axios.post('https://api.paystation.com.bd/initiate-payment', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // const response = await axios.post('https://sandbox.paystation.com.bd/initiate-payment', formData, {
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        // });

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

const handlePremiumCallback = async (req: Request, res: Response) => {
    try {
        if (!req) {
            console.error("Express Request Object is totally undefined!");
            return res.status(500).send("Request context lost.");
        }

        const status = req.body?.status || req.query?.status || req.params?.status;
        const invoice_number = req.body?.invoice_number || req.query?.invoice_number || req.params?.invoice_number;
        const trx_id = req.body?.trx_id || req.query?.trx_id || req.params?.trx_id;

        const paymentStatus = status ? String(status).toLowerCase() : "";

        if (!invoice_number) {
            return res.status(400).send("Invoice number is missing");
        }

        const transaction = await PremiumTransaction.findOne({ transactionId: invoice_number as string });

        let targetFrontendUrl = 'http://localhost:5173/user-profile';
        if (transaction?.originUrl) {
            try {
                const urlObj = new URL(transaction.originUrl);
                targetFrontendUrl = `${urlObj.origin}/user-profile`;
            } catch (e) {
                targetFrontendUrl = 'http://localhost:5173/user-profile';
            }
        }

        if (!transaction || paymentStatus === 'canceled' || paymentStatus === 'failed') {
            if (transaction) {
                transaction.status = "REJECTED";
                await transaction.save();
            }
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=PaymentCanceled`);
        }

        if (transaction.status === "APPROVED") {
            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=PREMIUM_UPGRADE&invoice=${invoice_number}`);
        }

        if (paymentStatus === 'successful' || paymentStatus === 'success') {
            await User.findByIdAndUpdate(transaction.userObjectId, {
                $set: {
                    role: "PREMIUM",
                    isVerified: true,
                    isActive: 'ACTIVE',
                    isNidPaid: true,
                    isFieldPaid: true,
                    isFieldVerification: true,
                    isDocumentVerification: true
                }
            });

            transaction.gatewayTransactionId = (trx_id as string) || "SUCCESS_TRX";
            transaction.status = "APPROVED";
            await transaction.save();

            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=PREMIUM_UPGRADE&invoice=${invoice_number}&trx=${transaction.gatewayTransactionId}`);
        } else {
            transaction.status = "REJECTED";
            await transaction.save();
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=GatewayDeclined`);
        }
    } catch (error: any) {
        console.error("Premium Callback Error Inside Catch:", error);
        return res.status(500).send("Internal Server Error occurred.");
    }
};


const getAllPremiumTransactions = async (req: Request, res: Response) => {
    const transactionQuery = new QueryBuilder(
        PremiumTransaction.find().populate("userObjectId"),
        req.query
    )
        .search(["transactionId", "phoneNumber", "status"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.countTotal();

    return res.status(StatusCodes.OK).json({
        success: true,
        statusCode: StatusCodes.OK,
        message: "Transactions retrieved successfully",
        meta,
        data: result,
    });
};

const updateTransactionStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, type } = req.body;

    const transaction = await PremiumTransaction.findById(id);
    if (!transaction) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Transaction not found",
        });
    }


    const updateData: Record<string, any> = {};

    if (type === "NID") {
        updateData.isDocumentVerification = status === "APPROVED" ? true : false;
    } else if (type === "FIELD") {
        updateData.isFieldVerification = status === "APPROVED" ? true : false;
    }


    if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(transaction.userObjectId, updateData);
    }

    return res.status(StatusCodes.OK).json({
        success: true,
        message: `${type} verification status updated to ${status} successfully`,
    });
};

const deletePremiumTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;
    const transaction = await PremiumTransaction.findByIdAndDelete(id);

    if (!transaction) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Transaction not found",
        });
    }

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Transaction deleted successfully",
        data: transaction,
    });
};


export const premiumPaymentControllers = {
    initiatePremiumPayment,
    handlePremiumCallback,
    getAllPremiumTransactions,
    updateTransactionStatus,
    deletePremiumTransaction
};