import express from "express";
import cors from "cors";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // ✅ CORRECT way

const app = express();
app.use(cors());
app.use(express.json());
let notices = [];
/* ===============================
   HEALTH CHECK (VERY IMPORTANT)
   =============================== */
app.get("/", (req, res) => {
  res.send("OK");
});
 
/* ===============================
   ADMIN AUTH
   =============================== */
app.post("/api/admin-auth", (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.ADMIN_PIN) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});
// ===== Notice Banner APIs =====

app.get("/api/notices", (req, res) => {
  res.json({ notices });
});

// Add notice (admin panel)
app.post("/api/notices", (req, res) => {
  const { notice } = req.body;

  if (!notice || notice.trim() === "") {
    return res.status(400).json({ error: "Notice is required" });
  }

  notices.push(notice);
  res.json({ notices });
});

// Delete notice
app.delete("/api/notices/:index", (req, res) => {
  const index = Number(req.params.index);

  if (isNaN(index) || index < 0 || index >= notices.length) {
    return res.status(400).json({ error: "Invalid index" });
  }

  notices.splice(index, 1);
  res.json({ notices });
});
/* ===============================
   STORAGE SETUP
   =============================== */
const upload = multer({ storage: multer.memoryStorage() });
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

// ⚠️ TEMP in-memory storage (OK for now)
let documents = [];

// ------------------ UPLOAD PDF ------------------
app.post("/api/upload-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file");

  const blob = bucket.file(Date.now() + "-" + req.file.originalname);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype,
  });

  blobStream.on("finish", () => {
    documents.push({
      name: req.file.originalname,
      url: `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
    });

    res.json({ success: true });
  });

  blobStream.end(req.file.buffer);
});

// ------------------ LIST DOCUMENTS ------------------
app.get("/api/documents", async (req, res) => {
  const [files] = await bucket.getFiles();

  const docs = files.map(file => ({
    name: file.name,
    url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
  }));

  res.json({ documents: docs });
});
// Delete PDF
app.delete("/api/documents/:name", async (req, res) => {
  try {
    const fileName = req.params.name;

    await bucket.file(fileName).delete();

    // remove from memory list
    documents = documents.filter(doc => doc.name !== fileName);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ===============================
   SERVER START (DO NOT CHANGE)
   =============================== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
