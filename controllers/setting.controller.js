const settingsService = require("../services/setting.service");

class SettingController {
  // Create settings for a user
  async createSettings(req, res) {
    try {
      const userId = req.userId; // Get userId from the authenticated user
      const settingsData = req.body; // Settings data from the request body

      const settings = await settingsService.createSettings(
        userId,
        settingsData
      );
      res.status(201).json({
        success: true,
        message: "Settings created successfully.",
        data: settings,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get settings for a user
  async getSettings(req, res) {
    try {
      const userId = req.userId; // Get userId from the authenticated user

      const settings = await settingsService.getSettings(userId);
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Updaing settings for a user
  async updateSettings(req, res) {
    try {
      const userId = req.userId; // Get userId from the authenticated user
      const settingsData = req.body; // Updated settings data from the request body
      const signatureFile = req.file; // Get the uploaded file (signature)

      if (signatureFile) {
        // If a signature file is uploaded, add the file path to the settingsData
        settingsData.signature = `${process.env.URL}uploads/${userId}/signatures/${signatureFile.filename}`;
      }
      const updatedSettings = await settingsService.updateSettings(
        userId,
        settingsData
      );

      if (!updatedSettings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found to update.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Settings updated successfully.",
        data: updatedSettings,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete settings for a user
  async deleteSettings(req, res) {
    try {
      const userId = req.userId; // Get userId from the authenticated user

      await settingsService.deleteSettings(userId);
      res.status(200).json({
        success: true,
        message: "Settings deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SettingController();
