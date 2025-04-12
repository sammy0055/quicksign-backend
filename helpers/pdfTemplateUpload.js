const fs = require("fs");
// const Poppler = require("pdf-poppler");
const path = require("path");
const multer = require("multer");
const { generatePdfThumbnail } = require("../utils/pdfThumbnail");

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

async function generatePreview(pdfTemplateUrl) {
  const pdfPath = path.resolve(
    __dirname,
    "../pdfTemplates/pdf",
    pdfTemplateUrl
  );
  const outputPath = path.resolve(__dirname, "../pdfTemplates/thumbnail");

  if (!fs.existsSync(pdfPath)) throw new Error("PDF not found");
  const [prefix] = pdfTemplateUrl.split(".");
  const options = {
    format: "png",
    out_dir: outputPath,
    out_prefix: prefix,
    page: 1,
  };
  const thumbPath = path.resolve(outputPath, `${prefix}-1.png`)
  await generatePdfThumbnail(pdfPath, thumbPath)
  // await Poppler.convert(pdfPath, options);
  return `${prefix}-1.png`;
}

module.exports = { uploadPdfTemplateToStorage, generatePreview };
