import { Request, Response } from "express";
import { Transaction } from "./recharge.model";
import { utils } from "../utils/utils";
import { StatusCodes } from "http-status-codes";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";
import axios from "axios";
import envVars from "../../config/envars";


const initiatePayStationPayment = async (req: Request, res: Response) => {
    try {
        const { userObjectId, userId, amount, name, email, phone, originUrl } = req.body;
        console.log(originUrl)

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await Transaction.create({
            userObjectId,
            userId,
            transactionId: invoiceNumber,
            phoneNumber: phone || "01700000000",
            amount: Number(amount),
            status: "PENDING",
            originUrl: originUrl
        });

        const formData = new URLSearchParams();
        formData.append('merchantId', envVars.PAYSTATION_MERCHANT_ID);
        formData.append('password', envVars.PAYSTATION_PASSWORD);
        formData.append('invoice_number', invoiceNumber);
        formData.append('currency', 'BDT');
        formData.append('payment_amount', String(amount));
        formData.append('pay_with_charge', '1');
        formData.append('reference', `Wallet Recharge User: ${userId}`);
        formData.append('cust_name', name || "User Name");
        formData.append('cust_phone', phone || "01700000000");
        formData.append('cust_email', email || "user@gmail.com");
        formData.append('cust_address', "Dhaka, Bangladesh");

        formData.append('opt_a', originUrl);

        formData.append('callback_url', `${envVars.BACKEND_URL}/api/v1/transaction/paystation-callback`);

        const response = await axios.post('https://api.paystation.com.bd/initiate-payment', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status_code === "200" && response.data.status === "success") {
            return res.status(200).json({
                success: true,
                payment_url: response.data.payment_url
            });
        } else {
            return res.status(400).json({ success: false, message: response.data.message || "Payment Gateway Error" });
        }

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// const paystationCallback = async (req: Request, res: Response) => {
//     try {

//         const { status, invoice_number, trx_id, opt_a } = req.query;
//         console.log(opt_a)

//         const targetFrontendUrl = (opt_a as string);
//         console.log(targetFrontendUrl)

//         const transaction = await Transaction.findOne({ transactionId: invoice_number as string });

//         if (!transaction) {
//             return res.redirect(`${targetFrontendUrl}/payment-fail?message=TransactionNotFound`);
//         }

//         if (status === 'Successful') {
//             if (transaction.status === "APPROVED") {
//                 return res.redirect(`${targetFrontendUrl}/payment-success`);
//             }

//             const amountToAdd = transaction.amount || 0;

//             await User.findByIdAndUpdate(transaction.userObjectId, {
//                 $set: { isActive: IsActive.ACTIVE },
//                 $inc: {
//                     mainWalletBalance: amountToAdd,
//                     bonusWalletPoints: amountToAdd
//                 }
//             });

//             transaction.transactionId = trx_id as string;
//             transaction.status = "APPROVED";
//             await transaction.save();

//             return res.redirect(`${targetFrontendUrl}/payment-success?invoice=${invoice_number}&trx=${trx_id}`);
//         } else {
//             transaction.status = "REJECTED";
//             await transaction.save();

//             return res.redirect(`${targetFrontendUrl}/payment-fail?invoice=${invoice_number}`);
//         }

//     } catch (error: any) {
//         console.error("Callback Error: ", error);
//         const backupUrl = (req.query.opt_a as string) || 'https://bibah.app';
//         res.redirect(`${backupUrl}/payment-fail?message=ServerError`);
//     }
// };


const paystationCallback = async (req: Request, res: Response) => {
    try {
        const { status, invoice_number, trx_id } = req.query; // opt_a আর লাগছে না

        const transaction = await Transaction.findOne({ transactionId: invoice_number as string });

        let targetFrontendUrl = 'https://bibah.app';

        if (!transaction) {
            return res.status(404).send(
                getRedirectHTML(`${targetFrontendUrl}/payment-fail?message=TransactionNotFound`, "Transaction Not Found", "Canceled")
            );
        }

        targetFrontendUrl = transaction.originUrl || 'https://bibah.app';
        console.log("Fetched Origin URL from DB:", targetFrontendUrl);

        if (status === 'Successful') {
            if (transaction.status === "APPROVED") {
                return res.redirect(`${targetFrontendUrl}/payment-success`);
            }

            const amountToAdd = transaction.amount || 0;

            await User.findByIdAndUpdate(transaction.userObjectId, {
                $set: { isActive: IsActive.ACTIVE },
                $inc: {
                    mainWalletBalance: amountToAdd,
                    bonusWalletPoints: amountToAdd
                }
            });

            transaction.transactionId = trx_id as string;
            transaction.status = "APPROVED";
            await transaction.save();

            return res.redirect(`${targetFrontendUrl}/payment-success?invoice=${invoice_number}&trx=${trx_id}`);
            
        } else {
            transaction.status = "REJECTED";
            await transaction.save();
            
            const redirectUrl = `${targetFrontendUrl}`;
            
            return res.status(200).send(
                getRedirectHTML(redirectUrl, "You canceled the payment session or it failed.", "Payment Canceled")
            );
        }

    } catch (error: any) {
        console.error("Callback Error: ", error);
        return res.status(500).send(
            getRedirectHTML('https://bibah.app/payment-fail?message=ServerError', "Internal Server Error occurred.", "Error")
        );
    }
};

const getRedirectHTML = (url: string, message: string, statusText: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="5;url=${url}" />
        <title>Payment Status</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex flex-col items-center justify-center min-h-screen font-sans">
        <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100">
            <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-800 mb-2">${statusText}!</h2>
            <p class="text-sm text-gray-500 mb-6">${message}</p>
            <div class="space-y-3">
                <div class="flex justify-center items-center gap-2 text-xs text-gray-400">
                    <span>Redirecting back to website in <span id="countdown" class="font-bold text-red-600">5</span> seconds...</span>
                </div>
                <a href="${url}" class="block w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition duration-200">
                    Go Back Immediately
                </a>
            </div>
        </div>

        <script>
            let count = 5;
            const counterElement = document.getElementById('countdown');
            const interval = setInterval(() => {
                count--;
                if(counterElement) counterElement.innerText = count;
                if (count <= 0) {
                    clearInterval(interval);
                }
            }, 1000);
        </script>
    </body>
    </html>
    `;
};

const createTransaction = async (req: Request, res: Response) => {
    try {
        const { userObjectId, userId, transactionId, phoneNumber, amount } = req.body;
        console.log('alkdhf', req.body)

        const isExist = await Transaction.findOne({ transactionId });
        if (isExist) {
            return res.status(400).json({ success: false, message: "Transaction ID already exists" });
        }

        const result = await Transaction.create({
            userObjectId,
            userId,
            transactionId,
            phoneNumber,
            amount
        });

        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transaction submitted successfully",
            data: result,
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const result = await Transaction.find().populate("userObjectId").sort({ createdAt: -1 });
        return utils.sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Transactions fetched successfully",
            data: result,
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTransactionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        if (transaction.status === "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "This transaction is already approved. Amount cannot be added again."
            });
        }

        if (status === "APPROVED") {
            const amountToAdd = transaction.amount || 0;

            const updatedUser = await User.findByIdAndUpdate(
                transaction.userObjectId,
                {
                    $set: { isActive: IsActive.ACTIVE },
                    $inc: {
                        mainWalletBalance: amountToAdd,
                        bonusWalletPoints: amountToAdd
                    }
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "Associated user not found" });
            }
        }

        transaction.status = status;
        const result = await transaction.save();

        res.status(200).json({
            success: true,
            message: `Transaction status updated to ${status} successfully`,
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await Transaction.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const transactionControllers = {
    createTransaction,
    getAllTransactions,
    deleteTransaction,
    updateTransactionStatus,
    initiatePayStationPayment,
    paystationCallback
};