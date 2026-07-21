# DocMind AI - Interview Question Generator
## Comprehensive Project Documentation & Architectural Review

**Date**: July 21, 2026  
**Project Location**: `e:/projects/interview_question_generator`  

---

## 1. Project Overview & Objective

### 1.1 What This Project Is Trying To Do
**DocMind AI (Interview Question Generator)** is a full-stack Retrieval-Augmented Generation (RAG) web application. Its primary goal is to empower job seekers, interviewers, and students to upload context documents (PDFs, study notes, technical specs, resumes) and generate tailored technical interview questions, key insights, and answer guides based directly on their uploaded files.

### 1.2 Tech Stack Architecture
- **Frontend**:
  - **Framework**: React 19 + Vite
  - **Styling**: Tailwind CSS v4 + Custom Glassmorphism Design System
  - **Icon System**: Lucide React (`lucide-react`)
  - **State & Architecture**: Modular API client (`src/api.js`), local component state for real-time document list and messaging history.
- **Backend**:
  - **API Framework**: FastAPI (Python)
  - **Orchestration**: LangChain (`langchain_google_genai`, `langchain_chroma`, `langchain_community`)
  - **LLM & Embeddings**: Google Gemini (`gemini-1.5-flash` & `text-embedding-004`)
  - **Vector Database**: ChromaDB (Persisted local embeddings)

---

## 2. Recent Progress & Corrected Items

### 2.1 Frontend Refactoring & UI Modernization
- **Icon Library Migration**: Replaced all custom SVGs and raw emojis with prebuilt icons from `lucide-react` across all components ([Header.jsx](file:///e:/projects/interview_question_generator/frontend/src/components/Header.jsx), [Sidebar.jsx](file:///e:/projects/interview_question_generator/frontend/src/components/Sidebar.jsx), [ChatArea.jsx](file:///e:/projects/interview_question_generator/frontend/src/components/ChatArea.jsx), and [InputBar.jsx](file:///e:/projects/interview_question_generator/frontend/src/components/InputBar.jsx)).
- **ESLint & Hoisting Fixes**: Resolved function declaration hoisting bugs in [App.jsx](file:///e:/projects/interview_question_generator/frontend/src/App.jsx) where `handleSend` was referenced inside `handlePromptClick` before initialization.
- **CSS Import Order**: Reordered Google Fonts `@import` rule prior to `@import "tailwindcss";` in [index.css](file:///e:/projects/interview_question_generator/frontend/src/index.css) to eliminate build parser warnings.
- **Modular API Layer**: Separated network call logic and API configuration into a dedicated service file ([src/api.js](file:///e:/projects/interview_question_generator/frontend/src/api.js)).
- **Copy to Clipboard**: Added interactive copy button with visual checkmark feedback on AI assistant response cards.

---

## 3. Critical Flaws & What Needs To Be Fixed

### 3.1 Backend Bug Analysis

#### Bug 1: Missing CORS Middleware in FastAPI (`main.py`)
- **Issue**: The frontend runs on `http://localhost:5173` and sends requests to `http://localhost:8000`. Currently, `main.py` does not include `CORSMiddleware`.
- **Symptom**: Browser blocks all API requests (`POST /upload/` and `POST /interview/generate`) with a CORS policy error.
- **Fix**:
  ```python
  from fastapi.middleware.cors import CORSMiddleware

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

#### Bug 2: Method Name Mismatch in `retriever.py`
- **Issue**: In `backend/app/api/interview.py`:
  ```python
  vector_store_service = VectorStoreService(embeddings)
  retriever_service = RetrieverService(vector_store_service.vector_store)
  ```
  `vector_store_service.vector_store` is a `Chroma` instance. However, `RetrieverService.__init__` calls `vector_store.get_retriever()`. `Chroma` has `.as_retriever()`, NOT `.get_retriever()`.
- **Fix**: Pass `vector_store_service` (the service class wrapper) directly to `RetrieverService`, or call `.as_retriever()` on `vector_store`.

#### Bug 3: Upload Directory Path Discrepancy
- **Issue**: `uploads.py` writes files to `Path("uploads")` (relative to the directory from which server is launched), while `pdf_loader.py` looks for files in `Path(__file__).resolve().parent.parent / "uploads"`.
- **Symptom**: `FileNotFoundError: <filename> does not exist` when trying to index uploaded PDFs.
- **Fix**: Centralize `UPLOAD_DIR` in `app/config.py` as a single source of truth.

#### Bug 4: VectorStore Connection Overhead & Memory Leak
- **Issue**: In `interview.py` and `uploads.py`, `VectorStoreService(embeddings)` and `EmbeddingService()` are re-instantiated on every single request.
- **Symptom**: Slow request response times, high RAM usage, potential file lock issues on SQLite `chroma_db`.
- **Fix**: Initialize vector store and embedding services once during startup or use FastAPI dependency injection (`Depends`).

---

## 4. Recommendations & Improvement Roadmap

### 4.1 Short-Term Fixes (High Priority)
1. **Apply Backend CORS Middleware & Path Fixes**: Fix the 3 backend bugs listed in Section 3 so that live vector search works end-to-end.
2. **Markdown & Code Highlighting in Frontend**: Install `react-markdown` and `remark-gfm` in the frontend so AI responses display structured lists, bold text, tables, and code snippets formatted cleanly.

### 4.2 Medium-Term Features (Value Additions)
1. **Interactive Document Filtering**: Allow users to select specific uploaded files in the sidebar drawer to restrict RAG retrieval to selected files.
2. **Structured Question Generation**: Enhance `QuestionGeneratorService` prompt to output structured JSON containing:
   - Question title & difficulty level (Easy, Medium, Hard).
   - Category (Behavioral, System Design, Coding, Conceptual).
   - Key evaluation points / expected answer criteria.
3. **Export Feature**: Add an "Export Questions" button to download generated interview prep kits as PDF or Markdown documents.

### 4.3 Long-Term Architecture (Production Readiness)
1. **Async Vector Store Queue**: Process large PDF uploads asynchronously using a task queue (e.g., Celery/Redis) with progress indicators in the UI.
2. **Multi-User Session Isolation**: Store vector embeddings with metadata tags (`session_id` or `user_id`) to ensure users only retrieve from their own documents.

---

## 5. Summary Matrix

| Component | Status | Key Issues | Next Recommended Action |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | ✅ Excellent | None (All SVGs replaced with `lucide-react`) | Add `react-markdown` for markdown formatting |
| **Frontend State** | ✅ Excellent | None (Clean API separation in `api.js`) | Add session state persistence |
| **FastAPI Backend** | ⚠️ Needs Fixes | Missing CORS, Path mismatch in `pdf_loader` | Add `CORSMiddleware` & centralize `UPLOAD_DIR` |
| **LangChain Pipeline** | ⚠️ Needs Fixes | `RetrieverService` API call mismatch | Fix `as_retriever()` call and reuse singleton vector store |
| **Vector DB (Chroma)** | 🟡 Functional | Re-instantiated per request | Convert to FastAPI singleton dependency |

---

*Document generated and saved to `e:/projects/interview_question_generator/PROJECT_DOCUMENTATION.md`.*
