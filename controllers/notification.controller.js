const notificationService = require("../services/notification.service");

exports.getNotifications = async (req, res) => {
  try {
    // Assuming req.user is set by your auth middleware
    const userId = req.userId;
    const notifications = await notificationService.getUserNotifications(
      userId
    );
    res.status(200).json({ data: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updatedNotification =
      await notificationService.markNotificationAsRead(notificationId);
    res.status(200).json({ data: updatedNotification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// This function can be called internally from your task controller
// when a document is sent/opened/signed.
exports.createNotification = async (data) => {
  return await notificationService.createNotification(data);
};
