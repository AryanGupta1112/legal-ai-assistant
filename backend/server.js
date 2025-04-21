const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  analyzeText,
  detectClauses,
  analyzeContractRisk,
  translateText,
} = require("./services/legalAI");
const { extractTextFromPDF } = require("./services/pdfProcessor");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors({ origin: "https://your-vercel-url.vercel.app" }));

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Health Check API
app.get("/", (req, res) => {
  res.send("✅ Legal Assistant API is running!");
});

// ✅ Analyze Legal Text
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    console.log(`[${new Date().toISOString()}] 📝 Analyzing legal text...`);
    const summary = await analyzeText(text);
    const clauses = detectClauses(text);

    res.json({ summary, clauses });
  } catch (error) {
    console.error("❌ Error processing text:", error);
    res.status(500).json({ error: "Failed to process text." });
  }
});

// ✅ Analyze Contract Risk
app.post("/analyze-risk", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required for risk analysis." });

    console.log(`[${new Date().toISOString()}] ⚠️ Running contract risk analysis...`);
    const riskAnalysis = await analyzeContractRisk(text);

    res.json({ riskAnalysis });
  } catch (error) {
    console.error("❌ Error in risk analysis:", error);
    res.status(500).json({ error: "Failed to analyze contract risk." });
  }
});

// ✅ Translate Legal Text
app.post("/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: "Text, sourceLang, and targetLang are required." });
    }

    console.log(`[${new Date().toISOString()}] 🌍 Translating from ${sourceLang} to ${targetLang}...`);
    const translatedText = await translateText(text, sourceLang, targetLang);

    res.json({ translatedText });
  } catch (error) {
    console.error("❌ Error in translation API:", error);
    res.status(500).json({ error: "Failed to translate text." });
  }
});

// ✅ Upload PDF + Extract Legal Text
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log(`[${new Date().toISOString()}] 📄 Extracting text from PDF: ${req.file.originalname}`);
    const extractedText = await extractTextFromPDF(req.file.path);
    const clauses = detectClauses(extractedText);

    res.json({ text: extractedText, clauses });
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    res.status(500).json({ error: "Failed to extract text from PDF." });
  }
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
