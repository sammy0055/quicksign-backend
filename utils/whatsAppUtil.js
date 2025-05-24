// helpers/whatsAppUtil.js
require("dotenv").config();
const twilio = require("twilio");
const { sendWhatSappMessage } = require("../helpers/whatsapp-messager");

/**
 * WhatsApp messaging utility that provides functions to send different types of WhatsApp messages
 */
class whatsAppUtil {
  constructor() {
    // Initialize Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || "+1";
  }

  /**
   * Format phone number to ensure it has country code
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Properly formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove spaces, dashes, etc.
    let formatted = phoneNumber.replace(/\s+/g, "").replace(/-/g, "");

    // Add "+" if it doesn't exist
    if (!formatted.startsWith("+")) {
      formatted = this.defaultCountryCode + formatted;
    }

    return formatted;
  }

  /**
   * Send a simple text message via WhatsApp
   * @param {string} phoneNumber - Recipient's phone number
   * @param {string} message - Message content
   * @returns {Promise} - Message sending result
   */
  async sendTextMessage(phoneNumber, message) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const response = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${formattedNumber}`,
      });

      console.log(
        `WhatsApp message sent to ${phoneNumber}, SID: ${response.sid}`
      );
      return response;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  /**
   * Send a document signing request message
   * @param {object} recipient - Recipient information object
   * @param {string} recipient.phone - Recipient's phone number
   * @param {string} recipient.name - Recipient's name or default identifier
   * @param {object} document - Document information
   * @param {string} document.name - Document name
   * @param {string} document.note - Additional note (optional)
   * @param {string} signUrl - URL for signing the document
   * @returns {Promise} - Message sending result
   */
  async sendDocumentSignRequest(recipient, document, signUrl, lang) {
    const name = recipient.name || "there";
    const note = document.note ? `\nNote: ${document.note}` : "";

    const message =
      lang === "en"
        ? `Hello ${name},\n\nYou have been assigned a new document "${document.name}" to sign.${note}\n\nPlease click on the following link to view and sign the document: ${signUrl}`
        : `שלום ${name},\n\nהוקצה לך מסמך חדש "${document.name}" לחתימה.${note}\n\nנא ללחוץ על הקישור הבא כדי לצפות ולחתום על המסמך: ${signUrl}
`;

    // return await this.sendTextMessage(recipient.phone, message);
    return await sendWhatSappMessage(recipient.phone, message);
  }

  /**
   * Send a document signed confirmation
   * @param {object} recipient - Recipient information
   * @param {object} document - Document information
   * @returns {Promise} - Message sending result
   */
  async sendDocumentSignedConfirmation(recipient, document) {
    const name = recipient.name || "there";

    const message = `Hello ${name},\n\nThank you for signing the document "${document.name}". Your signature has been recorded successfully.`;

    return await this.sendTextMessage(recipient.phone, message);
  }

  /**
   * Send a reminder for pending document
   * @param {object} recipient - Recipient information
   * @param {object} document - Document information
   * @param {string} signUrl - URL for signing the document
   * @param {number} daysRemaining - Days remaining until deadline (optional)
   * @returns {Promise} - Message sending result
   */
  async sendSigningReminder(recipient, document, signUrl, daysRemaining) {
    const name = recipient.name || "there";
    const deadline = daysRemaining
      ? `\nThis document needs to be signed within ${daysRemaining} days.`
      : "";

    const message = `Hello ${name},\n\nThis is a reminder that you have a pending document "${document.name}" waiting for your signature.${deadline}\n\nPlease click on the following link to view and sign the document: ${signUrl}`;

    return await this.sendTextMessage(recipient.phone, message);
  }
}

// Export a singleton instance
const whatsappUtilInstance = new whatsAppUtil();
module.exports = whatsappUtilInstance;
