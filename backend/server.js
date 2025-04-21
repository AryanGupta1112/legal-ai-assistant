const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const { analyzeText, detectClauses, analyzeContractRisk, translateText } = require("./services/legalAI");
const { extractTextFromPDF } = require("./services/pdfProcessor");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Health Check API
app.get("/", (req, res) => {
  res.send("✅ Legal Assistant API is running!");
});

// ✅ AI-Powered Legal Text Analysis + Clause Detection
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    console.log("📝 Processing legal text...");
    const summary = await analyzeText(text);
    const clauses = detectClauses(text);
    

    console.log("✅ Analysis Complete!");
    res.json({ summary, clauses });
  } catch (error) {
    console.error("❌ Error processing text:", error);
    res.status(500).json({ error: "Failed to process text." });
  }
});

// ✅ AI-Powered Contract Risk Analysis
app.post("/analyze-risk", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required for risk analysis." });

    console.log("⚠️ Running contract risk analysis...");
    const riskReport = await analyzeContractRisk(text);

    console.log("✅ Risk Analysis Complete!");
    res.json({ riskAnalysis: riskReport });
  } catch (error) {
    console.error("❌ Error in risk analysis:", error);
    res.status(500).json({ error: "Failed to analyze contract risk." });
  }
});

// ✅ AI-Powered Multi-Language Translation
app.post("/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: "Text, sourceLang, and targetLang are required" });
    }

    console.log(`🌍 Translating from ${sourceLang} to ${targetLang}...`);
    const translatedText = await translateText(text, sourceLang, targetLang);
    
    res.json({ translatedText });
  } catch (error) {
    console.error("❌ Error in translation API:", error);
    res.status(500).json({ error: "Failed to translate text." });
  }
});
// ✅ PDF Upload and Legal Clause Extraction
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log(`📄 Extracting text from PDF: ${req.file.filename}`);
    const extractedText = await extractTextFromPDF(req.file.path);
    const clauses = detectClauses(extractedText);

    console.log("✅ PDF Extraction Complete!");
    res.json({ text: extractedText, clauses });
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    res.status(500).json({ error: "Failed to extract text from PDF." });
  }
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
