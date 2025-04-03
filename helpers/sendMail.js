const nodemailer = require("nodemailer");
const smtp = require("../config/smtp.js");

const sendMail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport(smtp);
    const mailOptions = {
      from: `"QuickSign" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendMail;
