const express = require("express");
const checkAuth = require("../middleware/verifyJwtToken");
const FileAndFolderController = require("../controllers/file_folder.controller");
const {
  validateFileFields,
  validateFolderFields,
} = require("../middleware/fileAndFolder-validation");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage(); // or diskStorage if you want to save the file
const upload = multer({ storage });

router.post(
  "/createDirectory",
  checkAuth.verifyToken,
  validateFolderFields,
  FileAndFolderController.addPdfFolder
);
router.put(
  "/createFile",
  checkAuth.verifyToken,
  // validateFileFields,
  upload.single("file"),
  FileAndFolderController.addPdfFile
);

router.put(
  "/testUpload",
  upload.single("file"),
  FileAndFolderController.testUpload
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

router.get(
  "/downloadPdfFile",
  checkAuth.verifyToken,
  FileAndFolderController.downloadPdfFile
);

module.exports = router;
