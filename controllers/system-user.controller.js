const { SystemUserService } = require("../services/system-user.service");
const UserService = require("../services/user.service");
const PdfTemplateService = require("../services/pdfTemplate.service");

class SystemUserController {
  static loginSytemUser = async (req, res) => {
    // Regular email/password login flow
    try {
      const data = await SystemUserService.login(req.body);
      res.status(200).json({ message: "User logged in successfully.", data });
    } catch (error) {
      res.status(400).json({ error: { message: error.message } });
    }
  };

  static createSytemUser = async (req, res) => {
    try {
      const data = await SystemUserService.createSytemUser({ ...req.body });
      res.status(200).json({ data });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        error: {
          code: "system-user-auth-failed",
          message: error.message,
        },
      });
    }
  };

  static async getPaginatedUsers(req, res) {
    const { page, limit } = req.query;

    try {
      const users = await UserService.getUsers(page, limit);
      return res.status(200).json({ data: users });
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  static async freezeUser(req, res) {
    const { userId } = req.query;

    try {
      const data = await SystemUserService.freezeUser(userId);
      return res
        .status(200)
        .json({ message: "User freezed successfully.", data });
    } catch (error) {
      console.error("Freeze user error:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async disconnectUser(req, res) {
    const { userId } = req.query;

    try {
      const data = await SystemUserService.disconnectUser(userId);
      return res
        .status(200)
        .json({ message: "User disconnected successfully.", data });
    } catch (error) {
      console.error("Freeze user error:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async activateUser(req, res) {
    const { userId } = req.query;

    try {
      const data = await SystemUserService.activateUser(userId);
      return res
        .status(200)
        .json({ message: "User activeted successfully.", data });
    } catch (error) {
      console.error("Freeze user error:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async getUserByEmailOrId(req, res) {
    const { email, id } = req.query;

    try {
      const user = await UserService.getUserByEmailOrId({ email, id });
      return res.status(200).json({ data: user });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  static async pdfTemplateUpload(req, res) {
    try {
    
      res.status(200).json({ data:[] });
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }

  static async getPaginatedPdfTemplate(req, res) {
    try {
      const { page, limit } = req.query;
      const data = await PdfTemplateService.getPdfTemplates(page, limit);
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }

  static async removePdfTemplate(req, res) {
    try {
      const { fileName, documentId } = req.query;
      if (!fileName && !documentId)
        throw new Error("fileName and documentId is required");
      await PdfTemplateService.removePdfTemplateFile(fileName, documentId);
      res.status(200).json({ message: "file removed successfully" });
    } catch (error) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
}

module.exports = { SystemUserController };
