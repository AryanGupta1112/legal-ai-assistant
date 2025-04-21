const PDFParser = require("pdf2json");
const fs = require("fs");

/**
 * Extracts text from a multi-page PDF using pdf2json.
 * @param {string} filePath - Path to the uploaded PDF file.
 * @returns {Promise<string>} - Extracted plain text.
 */
async function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📄 Processing PDF with pdf2json: ${filePath}`);

    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", err => {
      console.error("❌ PDF Parsing Error:", err);
      reject("Error extracting text from PDF.");
    });

    pdfParser.on("pdfParser_dataReady", pdfData => {
      if (!pdfData?.Pages?.length) {
        return reject("❌ No text found in PDF.");
      }

      let extractedText = "";

      pdfData.Pages.forEach((page, pageIndex) => {
        const pageText = page.Texts.map(textObj =>
          decodeURIComponent(textObj.R?.[0]?.T || "")
        ).join(" ");
        console.log(`📄 Page ${pageIndex + 1} extracted (${pageText.length} chars)`);
        extractedText += pageText + "\n\n"; // add spacing between pages
      });

      console.log("✅ Text extraction complete!");
      resolve(extractedText.trim());
    });

    // Start parsing
    pdfParser.loadPDF(filePath);
  });
}

module.exports = { extractTextFromPDF };
