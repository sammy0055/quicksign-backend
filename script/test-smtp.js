const nodemailer = require("nodemailer");
const { sendWhatsAppMessage } = require("./whatsapp");

// Step 1: Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Tells Nodemailer to use Gmail SMTP
  host: "smtp.gmail.com", // Gmail's SMTP server
  port: 465, // Secure SMTP port (587 for TLS, 465 for SSL)
  secure: true, // Use SSL for secure connection
  auth: {
    user: "ronicksamuel@gmail.com", // Your Gmail address
    pass: "opxc pkww kpsi objc", // Your Google App Password (NOT your Gmail password)
  },
});

// Step 2: Define the email details
const mailOptions = {
  from: '"Mike Dan" <ronicksamuel@gmail.com>', // Sender's name and email
  to: "naenet05@gmail.com", // Recipient email address
  subject: "Hello from Nodemailer!", // Email subject
  text: "This is a test email sent using Nodemailer and Gmail SMTP.", // Plain text body
  html: "<h2>Hello from Nodemailer!</h2><p>This is a <b>test email</b> sent using Gmail SMTP.</p>", // HTML body
};

// Step 3: Send the email
console.log("we here--------------------------------");
// sendWhatsAppMessage({ phoneNumber: "+2348171727284", message: "Hello from Twilio!"})
transporter.sendMail(mailOptions, (error, info) => {
  console.log("we working-------------------------");
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Email sent: " + info.response);
  }
});
