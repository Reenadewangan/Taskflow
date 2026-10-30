import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

console.log("Email configuration:", {
  userExists: Boolean(emailUser),
  passwordExists: Boolean(emailPass),
  passwordLength: emailPass?.length,
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    type: "LOGIN",
    user: emailUser,
    pass: emailPass,
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.verify();

  return transporter.sendMail({
    from: `"TaskFlow" <${emailUser}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;