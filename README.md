<div align="center">
  <img src="public/logo.svg" alt="Ning Logo" width="120"/>
  <h1>Ning</h1>
  <p><strong>Think Local, Total Protection.</strong></p>
</div>

Ning is a privacy-first, local AI desktop and web client built around [Ollama](https://ollama.com/). It offers a beautiful, enterprise-grade React interface bundled into a lightweight, standalone native Desktop application using Tauri. Zero telemetry, zero cloud dependencies, and your data never leaves your machine.

---

## ✨ Features

- **100% Offline & Private:** Your chats and documents are processed locally by models running directly on your hardware.
- **Built-in Local RAG:** Upload PDFs, Markdown, TXT, or CSVs to chat with your documents. Text extraction and vector embeddings (`nomic-embed-text`) happen entirely on your device.
- **Hardware-Aware (Tauri):** The Rust backend seamlessly reads your actual CPU cores and available RAM in real-time, helping you avoid crashing your system with oversized models.
- **AI Models Library:** Search for popular models or perform a "Custom Pull" for any obscure model from the Ollama registry without touching a terminal.
- **Model Context Protocol (MCP):** Connect external tools (like local filesystems or custom scripts) directly to your AI's context.
- **Multiplatform:** Fully automated CI/CD pipeline via GitHub Actions to build binaries for Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`, `.deb`).

## 🚀 Getting Started (Web Version)

If you want to run Ning locally in your browser for development purposes:

### 1. Prerequisites
- **Node.js** (v18+)
- **Ollama**: Must be installed and running on your machine.

### 2. Configure Ollama for Web Access
By default, Ollama blocks browser connections (CORS). You must start Ollama with the following environment variable:
```bash
# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve

# Windows (Command Prompt)
set OLLAMA_ORIGINS="*" && ollama serve
```

### 3. Install & Run Ning
```bash
git clone https://github.com/YOUR_USERNAME/ning-ai.git
cd ning-ai
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## 📦 Desktop Releases (Automated via GitHub Actions)

You **do not** need to install Rust or complex build tools on your local machine to get the desktop app. Ning uses a magical CI/CD pipeline.

1. Fork or push this repository to GitHub.
2. Create a new release tag (e.g., `v1.0.0`) and push it:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. Go to the **Actions** tab in your GitHub repository. The `Tauri Build` workflow will automatically boot up Mac, Windows, and Ubuntu servers to compile your app.
4. Once completed, download your installer directly from the GitHub **Releases** page!

## 🛠 Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend (Desktop):** Rust, Tauri, sysinfo
- **Core Engine:** Ollama

## 🔒 Philosophy

**"Think Local, Total Protection"** is more than a motto. Ning acts as a "Remote Smart Client" that piggybacks onto the user's native Ollama installation. We intentionally do not bundle heavy LLM binaries inside the app to keep the installer incredibly lightweight (< 10MB) while maintaining absolute system integrity.
