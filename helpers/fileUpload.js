const multer = require("multer");
const path = require("path");
const fs = require("fs");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (file.fieldname === "taskPdf") {
        const senderId = req.userId;
        if (!senderId) {
          return cb(
            new Error("Admin user ID missing for taskPdf upload"),
            false
          );
        }
        const basePath = path.join("uploads", senderId);
        if (!fs.existsSync(basePath))
          fs.mkdirSync(basePath, { recursive: true });

        // Parse req.body.data to determine if the task is reusable
        const data = JSON.parse(req.body.data || "{}");
        const isReusable = data.isReusable || false; // Default to false if not provided
        const uploadPath = path.join(
          basePath,
          isReusable ? "taskPdfs" : "tempTaskPdfs"
        );

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      } else if (file.fieldname === "editedPdf") {
        const senderId = req.adminUserId;
        if (!senderId) {
          return cb(
            new Error("Admin user ID missing for editedPdf upload"),
            false
          );
        }
        const basePath = path.join("uploads", senderId);
        if (!fs.existsSync(basePath))
          fs.mkdirSync(basePath, { recursive: true });
        const uploadPath = path.join(basePath, "taskPdfs");
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      } else {
        const userId = req.userId || "anonymous";
        const basePath = path.join("uploads", userId);
        if (!fs.existsSync(basePath))
          fs.mkdirSync(basePath, { recursive: true });
        let uploadPath;
        if (file.fieldname === "profileImage") {
          uploadPath = path.join(basePath, "profilePics");
        } else if (file.fieldname === "groupCsv") {
          uploadPath = path.join(basePath, "groupCsvs");
        } else if (file.fieldname === "signature") {
          uploadPath = path.join(basePath, "signatures");
        } else {
          return cb(new Error("Unsupported file field"), false);
        }
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      }
    } catch (error) {
      cb(new Error("Error determining upload destination"), false);
    }
  },

  filename: (req, file, cb) => {
    const mimeTypeToExtension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
    };
    const extension = mimeTypeToExtension[file.mimetype];
    if (!extension) return cb(new Error("Unsupported file type"), false);
    const sanitizedName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    cb(
      null,
      `${new Date()
        .toISOString()
        .replace(/:/g, "-")}-${sanitizedName}.${extension}`
    );
  },
});

module.exports = multer({
  storage: fileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
