import { Request, Response } from "express";
import { FieldTransaction } from "./fieldtransaction.model";
import envVars from "../../config/envars";
import axios from "axios";
import { User } from "../user/user.model";

const initiatePayment = async (req: Request, res: Response) => {
    try {
        const { userObjectId, userId, amount, name, email, phone, originUrl } = req.body;

        const invoiceNumber = `FLD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await FieldTransaction.create({
            userObjectId,
            userId,
            transactionId: invoiceNumber,
            phoneNumber: phone || "01700000000",
            amount: Number(amount) || 2340,
            status: "PENDING",
            originUrl: originUrl
        });

        const formData = new URLSearchParams();
        formData.append('merchantId', envVars.PAYSTATION_MERCHANT_ID);
        formData.append('password', envVars.PAYSTATION_PASSWORD);
        formData.append('invoice_number', invoiceNumber);
        formData.append('currency', 'BDT');
        formData.append('payment_amount', String(amount || 2340));
        formData.append('pay_with_charge', '1');
        formData.append('reference', `Field Verification User: ${userId}`);
        formData.append('cust_name', name || "User Name");
        formData.append('cust_phone', phone || "01700000000");
        formData.append('cust_email', email || "user@gmail.com");
        formData.append('cust_address', "Dhaka, Bangladesh");
        formData.append('checkout_items', "FIELD_VERIFICATION");
        formData.append('opt_a', originUrl);
        formData.append('callback_url', `${envVars.BACKEND_URL}/api/v1/fieldTransaction/transactoin-callback`);

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

const callback = async (req: Request, res: Response) => {
    try {
        const { status, invoice_number, trx_id } = req.method === 'POST' ? req.body : req.query;
        const paymentStatus = String(status).toLowerCase();

        if (!invoice_number) {
            return res.status(400).send("Invalid Request Parameter");
        }

        const transaction = await FieldTransaction.findOne({ transactionId: invoice_number as string });
        let targetFrontendUrl = transaction?.originUrl || 'https://bibah.app';

        if (!transaction) {
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=TransactionNotFound`);
        }

        // if (transaction.status === "APPROVED") {
        //     return res.redirect(`${targetFrontendUrl}`);
        // }
        if (transaction.status === "APPROVED") {
            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=FIELD_VERIFICATION&invoice=${invoice_number}&trx=${transaction.gatewayTransactionId || trx_id}`);
        }

        if (paymentStatus === 'successful' || paymentStatus === 'success') {
            await User.findByIdAndUpdate(transaction.userObjectId, {
                $set: { isFieldPaid: true, fieldStatus: "PENDING" }
            });

            transaction.gatewayTransactionId = trx_id as string;
            transaction.status = "APPROVED";
            await transaction.save();

            return res.redirect(`${targetFrontendUrl}?paymentStatus=success&purpose=FIELD_VERIFICATION&invoice=${invoice_number}&trx=${trx_id}`);
        } else {
            transaction.status = "REJECTED";
            await transaction.save();
            return res.redirect(`${targetFrontendUrl}?paymentStatus=fail&message=GatewayDeclined`);
        }
    } catch (error: any) {
        return res.status(500).send("Internal Server Error occurred.");
    }
};

const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const transaction = await FieldTransaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        if (transaction.status === "APPROVED") {
            return res.status(400).json({ success: false, message: "Already approved" });
        }

        if (status === "APPROVED") {
            await User.findByIdAndUpdate(transaction.userObjectId, {
                $set: { isFieldPaid: true, fieldStatus: "PENDING" }
            });
        }

        transaction.status = status;
        const result = await transaction.save();

        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const fieldTransactionControllers = {
    initiatePayment,
    callback,
    updateStatus
};