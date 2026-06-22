import nodemailer from "nodemailer";
import envVars from "../../config/envars";
import axios from "axios";

export const sendVerificationEmail = async (email: string, code: string) => {
  console.log(email)
  console.log(code)
  const transporter = nodemailer.createTransport({
    host: envVars.MAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: envVars.MAIL_USER,
      pass: envVars.MAIL_PASS
    },
  });

  const mailOptions = {
    from: '"Bibah" <bibah@bibah.app>',
    to: email,
    subject: "Verify Your Account",
    text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    html: `<h3>Welcome!</h3><p>Your verification code is: <b>${code}</b></p><p>Valid for 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export const sendVerificationSMS = async (contactNo: string, code: string) => {
  try {
    let formattedMobile = contactNo.trim();
    if (formattedMobile.startsWith("0")) {
    }

    const message = `Your verification code is: ${code}. It will expire in 10 minutes. - Bibah`;

    const response = await axios.post(
      "https://dnotify.net/api/v1/send-sms",
      {
        mobile: formattedMobile,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${envVars.SMS_API_TOKEN}`, 
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS API Response:", response.data);
    return response.data;
  } catch (smsError: any) {
    console.error("SMS Gateway Error:", smsError?.response?.data || smsError.message);
    return null;
  }
};