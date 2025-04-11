const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/verifyJwtToken");
const {
  SystemUserController,
} = require("../controllers/system-user.controller");
const PdfTemplateController = require("../controllers/pdf-template.controller");

router.get(
  "/pdf-templates",
  checkAuth.verifyToken,
  SystemUserController.getPaginatedPdfTemplate
);

router.get(
  "/pdf-template-file",
  checkAuth.verifyToken,
  PdfTemplateController.getPdfTemplateFile
);

module.exports = router;
