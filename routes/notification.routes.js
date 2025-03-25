const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const checkAuth = require("../middleware/verifyJwtToken");

// Get all notifications for the authenticated user
router.get(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  notificationController.getNotifications
);

// Mark a specific notification as read
router.put(
  "/:id/read",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  notificationController.markAsRead
);

module.exports = router;
