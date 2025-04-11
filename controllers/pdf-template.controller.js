const path = require("path");
var fs = require("fs");

class PdfTemplateController {
  static getPdfTemplateFile(req, res) {
    const fileName = req.query.fileName;
    const fullPath = path.resolve(__dirname, "../pdfTemplates/pdf", fileName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        console.error("Read error:", err);
        return res.status(500).json({ error: "Failed to read file" });
      }
      res.status(200).send(data);
    });
  }
}

module.exports = PdfTemplateController