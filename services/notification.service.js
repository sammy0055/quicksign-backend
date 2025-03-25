const { Notification } = require("../models");

const createNotification = async ({
  userId,
  type,
  message,
  taskId,
  clientName,
}) => {
  const notification = await Notification.create({
    userId,
    type,
    message,
    taskId,
    clientName,
  });

  // If you have integrated Socket.IO, you can emit a real-time event here.
  // For example:
  // if (global.io) {
  //   global.io.to(userId).emit("notification", notification);
  // }

  return notification;
};

const getUserNotifications = async (userId) => {
  return await Notification.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
};

const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new Error("Notification not found");
  }
  notification.isRead = true;
  return await notification.save();
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
};
