const express = require("express");
const router = express.Router();
const settingController = require("../controllers/setting.controller");
const checkAuth = require("../middleware/verifyJwtToken");
const upload = require("../helpers/fileUpload");

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// CRUD Routes with asyncHandler
router.post(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])], // Only authenticated users can create settings
  asyncHandler(settingController.createSettings.bind(settingController))
);

router.get(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])], // Only authenticated users can fetch their settings
  asyncHandler(settingController.getSettings.bind(settingController))
);

router.put(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])], // Only authenticated users can update their settings
  upload.single("signature"),
  asyncHandler(settingController.updateSettings.bind(settingController))
);

router.delete(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])], // Only authenticated users can delete their settings
  asyncHandler(settingController.deleteSettings.bind(settingController))
);

module.exports = router;
