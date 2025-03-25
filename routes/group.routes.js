const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const checkAuth = require("../middleware/verifyJwtToken");
const upload = require("../helpers/fileUpload");

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// CRUD Routes with asyncHandler
router.post(
  "/",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(groupController.createGroup.bind(groupController))
);
router.post(
  "/get_all_groups",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(groupController.getAllGroups.bind(groupController))
);
router.post(
  "/upload-csv",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  upload.fields([{ name: "groupCsv", maxCount: 1 }]),
  asyncHandler(groupController.uploadCsvForGroup.bind(groupController))
);
router.get(
  "/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(groupController.getGroupById.bind(groupController))
);
router.put(
  "/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(groupController.updateGroup.bind(groupController))
);
router.delete(
  "/:id",
  [checkAuth.verifyToken, checkAuth.verifyUserRole(["Admin"])],
  asyncHandler(groupController.deleteGroup.bind(groupController))
);

module.exports = router;
