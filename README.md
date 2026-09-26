# DocuMind AI — Intelligent PDF Document Assistant

<div align="center">
  <h3>An AI-powered document intelligence platform using Retrieval-Augmented Generation (RAG) for context-aware question answering, multi-document comparison, automated summarization, and verifiable source citations.</h3>
</div>

---

## 🌟 Key Highlights & Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **PDF Multi-Upload** | Upload single or multiple PDF documents with real-time text extraction and chunking. | ✅ Production |
| **Page-Aware Chunking** | Overlapping sliding-window chunking (700 chars / 120 char overlap) preserving exact page numbers. | ✅ Production |
| **Hybrid RAG Vector Store** | Dense vector embeddings (`text-embedding-004` via `@google/genai` or unit-normalized local fallback) combined with lexical BM25-lite keyword boosting. | ✅ Production |
| **Interactive Citation Pills** | Responses cite sources in `[Page X]` format. Clicking any pill opens a side drawer showing the exact source chunk, page number, and similarity score. | ✅ Production |
| **Executive Summarization** | Multi-layered briefing containing executive summary, key takeaways, action items, and extracted topic tags. | ✅ Production |
| **Interactive Quiz Generator** | Generates MCQs with 4 options, instant visual feedback (green/red), explanations, cited pages, and celebratory confetti. | ✅ Production |
| **Side-by-Side Comparison** | Select 2 documents to compare objectives, shared principles, conflicting claims, and unique insights. | ✅ Production |
| **Full Auth & Guest Mode** | JWT-based user authentication + instant 1-click **Guest Explorer** mode for zero-friction access. | ✅ Production |
| **Live Telemetry & Admin** | Tracks indexed chunks, total PDF storage, query counts, MongoDB health, and vector database status. | ✅ Production |
| **Intelligence Report Export** | One-click export of executive briefings and Q&A logs to formatted Markdown and printable views. | ✅ Production |

---

## 🛠️ Architecture & Tech Stack

```
[ User PDF Upload ]
       │
       ▼
[ Page-by-Page Extraction (pdf-parse) ]
       │
       ▼
[ Sliding-Window Semantic Chunking + Metadata ]
       │
       ▼
[ Dense Vector Embeddings (Gemini text-embedding-004 / Normalized 128d) ]
       │
       ▼
[ Vector Storage & Cosine Index (MongoDB + In-Memory Cache) ]
       │
       ├───────────────────────────────────────────────┐
       ▼                                               ▼
[ User Question ]                            [ Document Analytics ]
       │                                               │
[ Cosine Similarity & BM25-lite Retrieval ]           ▼
       │                                     [ Admin Dashboard ]
[ Grounded Prompt + Page References ]
       │
       ▼
[ LLM Generation (Gemini 2.5 Flash / Fast RAG Synthesis) ]
       │
       ▼
[ Cited Answer + Clickable Citation Badges [Page X] + Follow-up Questions ]
```

### Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios, Canvas Confetti.
- **Backend**: Node.js v26, Express.js, Multer (file upload), PDF-parse.
- **Database**: MongoDB (Mongoose ORM) with automatic in-memory fallback.
- **AI & RAG Engine**: Google Gemini API (`@google/genai` v2.21.0), `text-embedding-004`, `gemini-2.5-flash`, Cosine Similarity Vector Store.
- **Authentication**: JSON Web Tokens (JWT) + BCrypt password hashing + Guest session tokens.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **MongoDB** running locally on port `27017` (or MongoDB Atlas connection string). *If MongoDB is not running, DocuMind AI automatically runs in resilient in-memory mode.*

### 2. Backend Setup
```bash
cd backend
npm install

# Start backend server
npm start
# or for auto-reloading:
npm run dev
```
Backend runs on: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 💻 Running in Visual Studio Code (VS Code)

This project is fully configured for **VS Code** with automated workspace tasks and launch configurations!

### Method 1: Single Command (Easiest & Recommended)
1. Open the project folder in VS Code:
   - Click `File` ➔ `Open Folder...` ➔ Select `PDF Chatbot (RAG)`.
2. Open the built-in terminal in VS Code:
   - Press **`Ctrl + ~`** (or `Terminal` ➔ `New Terminal`).
3. Run:
   ```bash
   npm run dev
   ```
   *This starts both the backend (port 5000) and frontend (port 5173) together with color-coded logs!*
4. Open your browser to **`http://localhost:5173`**.

---

### Method 2: VS Code Task (1-Shortcut Launch)
1. In VS Code, press **`Ctrl + Shift + B`** (Run Build Task).
2. VS Code will automatically start both the Backend and Frontend in dedicated split terminals!

---

### Method 3: Two Separate Terminals
In VS Code, you can open two side-by-side terminal tabs:
- **Terminal 1 (Backend)**:
  ```bash
  cd backend
  npm start
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev
  ```

## 🔑 AI Provider Configuration

DocuMind AI works **immediately out-of-the-box** using built-in high-dimensional vector embeddings and localized RAG synthesis.

To enable deep generative synthesis with Google Gemini:
1. Open the application at `http://localhost:5173`.
2. Click the **Settings (⚙️)** icon in the top navigation bar.
3. Paste your **Google Gemini API Key** (get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey)).
4. Choose your preferred model (e.g. `gemini-2.5-flash` or `gemini-2.5-pro`).
5. Click **Save Preferences**. The status indicator in the top navbar will light up green (**Gemini Active**).

Alternatively, set `GEMINI_API_KEY=your_key_here` in `backend/.env`.

---

## 📑 Included Sample Documents

Two sample research papers are pre-generated in the root directory for immediate testing:
- `sample_ai_research.pdf`: 3-page research paper on RAG benchmarks and vector retrieval.
- `sample_comparative_report.pdf`: 3-page comparative whitepaper on Fine-Tuning vs RAG architecture.

Upload them via the **Upload PDF** button to test single-doc Q&A, multi-doc queries, quiz generation, and side-by-side comparison!
