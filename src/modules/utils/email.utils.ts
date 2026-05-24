import nodemailer from "nodemailer";
import envVars from "../../config/envars";

export const sendVerificationEmail = async (email: string, code: string) => {
  console.log(email)
  console.log(code)
  // const transporter = nodemailer.createTransport({
  //   host: envVars.MAIL_HOST,
  //   port: 587,
  //   secure: false, 
  //   auth: {
  //     user: envVars.MAIL_USER, 
  //     pass: envVars.MAIL_PASS      
  //   },
  // });

  // const mailOptions = {
  //   from: '"Bibah" <bewyaris71@gmail.com>', 
  //   to: email,
  //   subject: "Verify Your Account",
  //   text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
  //   html: `<h3>Welcome!</h3><p>Your verification code is: <b>${code}</b></p><p>Valid for 10 minutes.</p>`,
  // };

  // await transporter.sendMail(mailOptions);
};