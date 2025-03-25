const { createCanvas } = require("canvas");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const fsp = require("fs").promises;
require("structured-clone-polyfill");

// Add PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.js"
);

async function generatePdfThumbnail(pdfPath, thumbPath) {
  try {
    const data = await fsp.readFile(pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const jpegBuffer = canvas.toBuffer("image/jpeg", {
      quality: 0.8,
      chromaSubsampling: false,
    });

    await fsp.writeFile(thumbPath, jpegBuffer);
  } catch (error) {
    console.error("PDF Thumbnail Error:", error);
    throw error;
  }
}

module.exports = { generatePdfThumbnail };
