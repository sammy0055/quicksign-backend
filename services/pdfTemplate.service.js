const { pdfTemplate } = require("../models");
const fs = require("fs");
const path = require("path");

class PdfTemplateService {
  static async getPdfTemplates(page = 1, limit = 6) {
    // Convert to numbers to avoid issues with string inputs
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate offset (skip) value
    const offset = (page - 1) * limit;

    // Get total user count
    const totalTemplates = await pdfTemplate.count();

    // Fetch users with pagination
    const templates = await pdfTemplate.findAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]], // Optional: Sort by newest first
    });

    // Check if there are more results to fetch
    const hasMore = offset + templates.length < totalTemplates;

    return {
      totalTemplates,
      page,
      limit,
      hasMore,
      templates,
    };
  }

  static async removePdfTemplateFile(fileName, documentId) {
    const [file] = fileName.split(".");
    const pdfPath = path.resolve(__dirname, `../pdfTemplates/pdf/${file}.pdf`);
    const thumbnailPath = path.resolve(
      __dirname,
      `../pdfTemplates/thumbnail/${file}-1.png`
    );

    await pdfTemplate.destroy({
      where: { id: documentId },
    });

    fs.unlink(pdfPath, (err) => {
      if (err) {
        console.error(`no such file: ${fileName}`);
        return false;
      }
      console.log("File deleted successfully");
    });

    fs.unlink(thumbnailPath, (err) => {
      if (err) {
        console.error(`no such file: ${file}-1.png`);
        return false;
      }
      console.log("File deleted successfully");
    });

    return true;
  }
}

module.exports = PdfTemplateService;
