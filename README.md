# DocFlow - Full Project Overview

This repository is a **monorepo** containing both the React frontend and the FastAPI backend for DocFlow.

---

## 🏗️ Architecture Setup
- **Monorepo Structure**: The root folder contains the Vite React frontend, and the `backend/` folder contains the Python FastAPI application.
- **Development Server**: Configured `concurrently` in `package.json` to allow starting both the frontend and backend simultaneously using the `npm run dev` command.
- **API Proxying**: The Vite development server is configured to proxy `/api` requests to the FastAPI backend running on port 8000, eliminating CORS issues during local development.

---

## 🖥️ Frontend (React + Vite + Tailwind CSS)

The frontend is a modern React application utilizing Vite for fast builds and Tailwind CSS for styling.

### Pages Built:
- **Projects Page (`ProjectsPage.jsx`)**: Displays the list of available projects.
- **Project Workspace (`ProjectWorkspace.jsx`)**: The main dashboard for interacting with a specific project.
- **Upload Document Page (`UploadDocumentPage.jsx`)**: Interface for users to upload new documents to a project.
- **Component Showcase (`ComponentShowcase.jsx`)**: A page demonstrating the various reusable UI components in the application.

### Key Component Modules:
- **UI System**: Reusable interface components (Badges, Buttons, Inputs, Collapsible Sections).
- **Studio / Chat**: Interfaces for the AI chat panel and the studio workspace.
- **Sources**: Components for managing and displaying document sources (like `StageSection`).
- **Layout**: Application shell and navigation (`TopNav`, `AppLayout`).

---

## ⚙️ Backend (Python + FastAPI + PostgreSQL)

The backend (`DocFlow-AI`) is currently in **Phase 1 (Scaffold)**. It uses FastAPI, SQLAlchemy (with Alembic for migrations), and PostgreSQL.

### What is Implemented (Phase 1):
- ✅ **Upload Flow**: Endpoint for document uploads, requiring project and stage IDs, with team-visibility defaults.
- ✅ **Document Identity & Versioning**: Database schema designed to handle documents and version history (`documents` and `document_versions` tables).
- ✅ **Multi-tenant Schema**: Tables designed to handle multiple tenants (`tenants`, `projects`, `users`, `teams`) with denormalized `tenant_id` on documents.
- ✅ **Validation**: File type and size validation (Supports PDF, DOCX, TXT, MD with a 10MB cap).
- ✅ **Async Worker Skeleton**: A basic polling worker setup to handle async tasks (currently a placeholder for the future Structure Scanner).

### What is Deferred (Future Phases):
- ⏳ **Authentication**: Currently, `uploaded_by` and `tenant_id` are passed as raw form fields. This will be replaced with real auth later.
- ⏳ **Upload New Version**: Only the "new document" upload exists so far; uploading a new version to an existing document is pending.
- ⏳ **Structure Scanner (Phase 3)**: The actual logic for scanning document structure is not yet implemented.

---

## 🚀 How to Run the App

### 1. Database Setup
Ensure you have PostgreSQL running. You'll need to create a database named `docflow_ai` in pgAdmin or via CLI.

### 2. Backend Setup
Navigate to the `backend/` directory to set up the environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```
Edit `.env` and fill in your PostgreSQL password.

Run the migrations to create tables:
```bash
alembic upgrade head
```

### 3. Start Both Apps
From the **root of the project** (not the backend folder), run:
```bash
npm install
npm run dev
```
This will start both the React Vite frontend and the Python FastAPI backend concurrently.
