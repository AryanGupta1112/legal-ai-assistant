import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Box,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Grid,
  CssBaseline,
  IconButton,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import TranslateIcon from "@mui/icons-material/Translate";
import GavelIcon from "@mui/icons-material/Gavel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

function App() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [clauses, setClauses] = useState({});
  const [riskAnalysis, setRiskAnalysis] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [language, setLanguage] = useState("es");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  const handleAnalyze = async () => {
    if (!inputText.trim()) return alert("Enter some legal text!");
    setLoading(true);
    try {
      const res = await axios.post("${process.env.REACT_APP_BACKEND_URL}/analyze", { text: inputText });
      setResult(res.data.summary);
      setClauses(res.data.clauses);
    } catch (error) {
      console.error("❌ Error analyzing text:", error);
      setResult("Failed to analyze text.");
    }
    setLoading(false);
  };

  const handleRiskAnalysis = async () => {
    if (!inputText.trim()) return alert("Enter some legal text!");
    setLoading(true);
    try {
      const res = await axios.post("${process.env.REACT_APP_BACKEND_URL}/analyze-risk", { text: inputText });
      setRiskAnalysis(res.data.riskAnalysis);
    } catch (error) {
      console.error("❌ Error analyzing risk:", error);
      setRiskAnalysis("Failed to analyze contract risk.");
    }
    setLoading(false);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return alert("Enter text to translate!");
    setLoading(true);
    try {
      const res = await axios.post("${process.env.REACT_APP_BACKEND_URL}/translate", {
        text: inputText,
        sourceLang,
        targetLang,
      });
      setTranslatedText(res.data.translatedText || "No translation available.");
    } catch (error) {
      console.error("❌ Error translating:", error);
      setTranslatedText("Error: Failed to translate.");
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    setLoading(true);
    try {
      const res = await axios.post("${process.env.REACT_APP_BACKEND_URL}/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInputText(res.data.text);
      setClauses(res.data.clauses);
    } catch (error) {
      console.error("❌ File upload error:", error);
    }
    setLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ padding: 4, mt: 4, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h4" gutterBottom>⚖️ Legal AI Assistant</Typography>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>

          <TextField
            label="Enter Legal Text"
            multiline
            rows={6}
            fullWidth
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnalyze}
                disabled={loading}
                startIcon={<GavelIcon />}
              >
                {loading ? <CircularProgress size={24} /> : "Analyze"}
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                color="warning"
                onClick={handleRiskAnalysis}
                disabled={loading}
                startIcon={<WarningAmberIcon />}
              >
                {loading ? <CircularProgress size={24} /> : "Analyze Risk"}
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>🌍 From</InputLabel>
              <Select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150, ml: 2 }}>
              <InputLabel>🌍 To</InputLabel>
              <Select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="success"
              onClick={handleTranslate}
              disabled={loading}
              startIcon={<TranslateIcon />}
              sx={{ ml: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Translate"}
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Upload PDF
              <input type="file" accept="application/pdf" hidden onChange={handleFileUpload} />
            </Button>
          </Box>

          {Object.keys(clauses).length > 0 && (
            <Box sx={{ mt: 3, textAlign: "left" }}>
              <Typography variant="h6">📜 Detected Clauses:</Typography>
              <ul>
                {Object.entries(clauses).map(([key, value]) =>
                  value ? <li key={key}><strong>{key}</strong>: ✅ Detected</li> : null
                )}
              </ul>
            </Box>
          )}

          {result && (
            <Box sx={{ mt: 3, textAlign: "left" }}>
              <Typography variant="h6">📄 Summary:</Typography>
              <Typography>{result}</Typography>
            </Box>
          )}

          {riskAnalysis && (
            <Box
            sx={{
              mt: 3,
              textAlign: "left",
              bgcolor: darkMode ? "#b71c1c" : "#ffebee", // dark red for dark mode
              color: darkMode ? "#fff" : "#000",
              padding: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6">⚠️ Risk Analysis:</Typography>
            <Typography>{riskAnalysis}</Typography>
          </Box>
          
          )}

          {translatedText && (
            <Box
            sx={{
              mt: 3,
              textAlign: "left",
              bgcolor: darkMode ? "#1e88e5" : "#e3f2fd",
              color: darkMode ? "#fff" : "#000",
              padding: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6">🌍 Translated Text:</Typography>
            <Typography>{translatedText}</Typography>
          </Box>
          
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
