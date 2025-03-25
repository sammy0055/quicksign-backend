const { Setting, User } = require("../models");

class SettingService {
  // Create settings for a user
  async createSettings(userId, settingsData) {
    try {
      // Check if settings already exist for the user
      const existingSettings = await Setting.findOne({ where: { userId } });
      if (existingSettings) {
        throw new Error("Settings already exist for this user.");
      }

      // Create new settings
      const settings = await Setting.create({ userId, ...settingsData });
      return settings;
    } catch (error) {
      throw new Error(`Error creating settings: ${error.message}`);
    }
  }

  // Get settings for a user
  async getSettings(userId) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        include: [{ model: Setting, required: true }],
      });

      if (!user) {
        throw new Error("Settings not found for this user.");
      }
      return user.Setting;
    } catch (error) {
      throw new Error(`Error fetching settings: ${error.message}`);
    }
  }

  // Update settings for a user
  async updateSettings(userId, settingsData) {
    try {
      // Find existing settings
      const settings = await Setting.findOne({ where: { userId } });
      if (!settings) {
        throw new Error("Settings not found for this user.");
      }

      // Update settings
      const updatedSettings = await settings.update(settingsData);
      return updatedSettings;
    } catch (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  }

  // Delete settings for a user
  async deleteSettings(userId) {
    try {
      const settings = await Setting.findOne({ where: { userId } });
      if (!settings) {
        throw new Error("Settings not found for this user.");
      }

      await settings.destroy();
    } catch (error) {
      throw new Error(`Error deleting settings: ${error.message}`);
    }
  }
}

module.exports = new SettingService();
