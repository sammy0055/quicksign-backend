const fs = require("fs");
// const Poppler = require("pdf-poppler");
const path = require("path");
const multer = require("multer");

// Set up storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "pdfTemplates/pdf"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const originalname = file.originalname;
    const newFileName = Date.now() + path.extname(originalname);
    req.fileMetadata = {
      newFileName,
      originalname,
    };
    cb(null, newFileName);
  },
});

const uploadPdfTemplateToStorage = multer({ storage });

module.exports = { uploadPdfTemplateToStorage };
