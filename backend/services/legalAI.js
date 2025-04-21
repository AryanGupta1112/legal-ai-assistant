require("dotenv").config();
const fetch = require("node-fetch");

const HF_TOKEN = process.env.HUGGINGFACE_HUB_TOKEN;
const MODEL_NAME = "facebook/bart-large-cnn";
const TRANSLATION_MODEL = "facebook/mbart-large-50-many-to-many-mmt";

const riskKeywords = {
  "Termination Risk": ["terminate", "cancellation", "breach", "failure to comply"],
  "Financial Risk": ["penalty", "late payment", "additional fees", "interest charge"],
  "Liability Risk": ["not liable", "no responsibility", "indemnify", "hold harmless"],
  "Legal Disputes": ["lawsuit", "arbitration", "court", "legal action"],
  "Confidentiality Risk": ["disclosure", "data breach", "non-disclosure violation"],
};

const clauses = {
  "Obligations": ["must", "shall", "required to", "obliged to", "responsible for", "agrees to"],
  "Confidentiality": ["confidential", "non-disclosure", "private and secure", "proprietary information"],
  "Payment": ["payment within", "must pay", "due in", "invoice shall be paid", "late payments", "pay within", "payment obligations", "shall be paid"],
  "Termination": ["may be terminated", "cancel this agreement", "termination upon", "end of contract", "breach of agreement", "termination period", "may terminate"],
  "Liability": ["not liable", "no responsibility", "at own risk", "shall not be held responsible", "not responsible for", "limited liability", "exempt from liability"],
  "Force Majeure": ["neither party shall be liable", "unforeseen events", "acts of god", "government actions", "natural disasters", "strikes", "beyond reasonable control"],
  "Indemnification": ["indemnify", "hold harmless", "compensate for damages", "liabilities arising from", "legal claims", "compensate for loss"]
};

// ✅ Chunked AI summarization
async function analyzeText(text) {
  if (text.split(" ").length < 80) return text.trim();

  const textChunks = text.match(/.{1,1200}(\s|$)/g) || [text];
  const summaries = [];

  for (const chunk of textChunks) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL_NAME}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: chunk,
            parameters: {
              max_length: 400,
              min_length: 100,
              do_sample: false,
              temperature: 0.0,
              top_k: 1,
              repetition_penalty: 1.8,
              no_repeat_ngram_size: 5,
              length_penalty: 2.0,
              early_stopping: true
            }
          })
        });

        const contentType = res.headers.get("content-type");
        if (!contentType.includes("application/json")) {
          const errorText = await res.text();
          console.error("❌ Invalid JSON:", errorText.slice(0, 100));
          throw new Error("Model returned non-JSON.");
        }

        const result = await res.json();
        if (result.error) {
          if (result.error.includes("currently loading")) {
            await new Promise(r => setTimeout(r, 15000));
            continue;
          }
          throw new Error(result.error);
        }

        summaries.push(result[0]?.summary_text || "[No summary]");
        break;
      } catch (err) {
        if (attempt === 2) summaries.push("[Error summarizing chunk]");
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  const raw = summaries.join(" ");
  const uniqueSentences = [...new Set(raw.split(/(?<=[.?!])\s+/))];
  let clean = uniqueSentences.join(" ");

  const repeatedFragment = "held responsible for delays caused by force majeure events";
  const last = clean.lastIndexOf(repeatedFragment);
  const first = clean.indexOf(repeatedFragment);
  if (last !== first) clean = clean.slice(0, last - 1).trim();
  clean = clean.replace(/(?:\s*\b\w{1,3}\b){3,}$/g, "").trim();
  if (!clean.match(/[.?!]$/)) clean += ".";

  return clean;
}

// ✅ Clause detection
function detectClauses(text) {
  const detected = {};
  for (const [type, keywords] of Object.entries(clauses)) {
    if (keywords.some(k => text.toLowerCase().includes(k))) {
      detected[type] = true;
    }
  }
  return detected;
}

// ✅ Risk detection
async function analyzeContractRisk(text) {
  const risks = [];
  for (const [type, words] of Object.entries(riskKeywords)) {
    if (words.some(word => text.toLowerCase().includes(word))) risks.push(type);
  }
  return risks.length ? `⚠️ Potential Risks: ${risks.join(", ")}` : "✅ No significant risks detected.";
}

// ✅ Multilingual translation with chunking
async function translateText(text, sourceLang = "en", targetLang = "fr") {
  console.log(`🚀 Translating text from ${sourceLang} to ${targetLang}...`);
  const cleaned = cleanBeforeTranslation(text);
  const chunks = cleaned.match(/.{1,250}(\s|$)/g) || [cleaned];
  const translated = [];

  const srcLang = getLanguageCode(sourceLang);
  const tgtLang = getLanguageCode(targetLang);

  for (const chunk of chunks) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`https://api-inference.huggingface.co/models/${TRANSLATION_MODEL}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: chunk,
            parameters: {
              src_lang: srcLang,
              tgt_lang: tgtLang
            }
          })
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          console.error("❌ Translation API Error:", data);
          return `Error: ${data.error || "Translation failed."}`;
        }

        translated.push(data[0]?.translation_text || "");
        break;
      } catch (err) {
        console.error(`❌ Translation retry ${attempt}:`, err);
        if (attempt === 2) return "Translation service unavailable.";
        await new Promise(res => setTimeout(res, 15000));
      }
    }
  }

  const raw = translated.join(" ").replace(/Page\s\d+/gi, "").trim();
  const unique = [...new Set(raw.split(/(?<=[.?!])\s+/))];
  let clean = unique.join(" ").replace(/(?:\s*\b\w{1,3}\b){3,}$/g, "").trim();
  if (!clean.match(/[.?!]$/)) clean += ".";

  return clean;
}

// ✅ Preprocess text for translation
function cleanBeforeTranslation(text) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const unique = [...new Set(sentences)];
  return unique.join(" ").trim();
}

// ✅ Language code mapping
function getLanguageCode(lang) {
  return {
    en: "en_XX", es: "es_XX", fr: "fr_XX", de: "de_DE", zh: "zh_CN", hi: "hi_IN"
  }[lang] || "en_XX";
}

module.exports = {
  analyzeText,
  detectClauses,
  analyzeContractRisk,
  translateText
};
