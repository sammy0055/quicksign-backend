const twilio = require("twilio");

// Load environment variables (optional if using dotenv)
require('dotenv').config();

function getTwilioClient() {
  const accountSid = "AC0bde6c641a0bd80a5022b82fbe60c31d"
  const authToken = "132d320f2afe80b71fd2c8cb9199a9af"

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are missing");
  }

  return twilio(accountSid, authToken);
}

function formatPhoneNumber(phoneNumber, defaultCountryCode = "+1") {
  if (!phoneNumber.startsWith("+")) {
    return `${defaultCountryCode}${phoneNumber}`;
  }
  return phoneNumber;
}

async function sendWhatsAppMessage({ phoneNumber, message }) {
  const client = getTwilioClient();
  const whatsappNumber = "+14155238886"
  const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || "+1";

  if (!whatsappNumber) {
    throw new Error("Twilio WhatsApp number is missing");
  }

  const formattedNumber = formatPhoneNumber(phoneNumber, defaultCountryCode);

  try {
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedNumber}`,
    });

    console.log(
      `WhatsApp message sent to ${formattedNumber}, SID: ${response.sid}`
    );
    return response;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.message);
    throw error;
  }
}

// Example usage:
// sendWhatsAppMessage({ phoneNumber: "1234567890", message: "Hello from Twilio!" });
module.exports = { sendWhatsAppMessage };
