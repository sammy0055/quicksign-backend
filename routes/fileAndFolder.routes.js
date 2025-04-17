const express = require("express");
const checkAuth = require("../middleware/verifyJwtToken");
const FileAndFolderController = require("../controllers/file_folder.controller");
const {
  validateFileFields,
  validateFolderFields,
} = require("../middleware/fileAndFolder-validation");
const router = express.Router();

router.post(
  "/createDirectory",
  checkAuth.verifyToken,
  validateFolderFields,
  FileAndFolderController.addPdfFolder
);
router.post(
  "/createFile",
  checkAuth.verifyToken,
  validateFileFields,
  FileAndFolderController.addPdfFile
);

router.delete(
  "/removeDirectory",
  checkAuth.verifyToken,
  FileAndFolderController.removePdfFolder
);
router.delete(
  "/removeFile",
  checkAuth.verifyToken,
  FileAndFolderController.removePdfFile
);

router.get(
  "/getFilesAndFolders",
  checkAuth.verifyToken,
  FileAndFolderController.getFileAndFolder
);

module.exports = router;
