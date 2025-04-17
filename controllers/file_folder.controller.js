const db = require("../models");
const FileAndFolderService = require("../services/file_folder.service");

require("dotenv").config();

const SUPERBASE_STORAGE_BUCKET_NAME = process.env.SUPERBASE_STORAGE_BUCKET_NAME;
class FileAndFolderController {
  static async addPdfFile(req, res) {
    try {
      const userId = req.userId;
      const user = await db.User.findByPk(userId);
      if (!user.companyId)
        throw new Error("access denied, companyId is required");
      const data = await FileAndFolderService.addPdfFile(
        req.body,
        user.companyId
      );
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async addPdfFolder(req, res) {
    try {
      const userId = req.userId;
      const user = await db.User.findByPk(userId);

      if (!user.companyId)
        throw new Error("access denied, companyId is required");
      const data = await FileAndFolderService.addPdfFolder(
        req.body,
        user.companyId
      );
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async removePdfFolder(req, res) {
    try {
      const folderId = req.query.folderId;
      await FileAndFolderService.removeFolder(folderId);
      res.status(200).json({
        message: "folder removed successfully",
        data: { message: "folder removed successfully" },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  static async removePdfFile(req, res) {
    try {
      const folderId = req.query.fileId;
      await FileAndFolderService.removeFile(folderId);
      res.status(200).json({
        message: "file removed successfully",
        data: { message: "file removed successfully" },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getFileAndFolder(req, res) {
    try {
      const companyId = req.query.companyId;
      const data = await FileAndFolderService.getFilesAndFolders(companyId);
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = FileAndFolderController;
