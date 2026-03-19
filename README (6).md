<div align="center">
  <br />
  <img src="./public/logo.png" alt="UIGen Logo" width="80" />
  <h1>✨ UIGen</h1>

  <p>
    <strong>The next-generation AI Component Builder & Live Sandbox</strong>
  </p>
  <p>
    A production-grade, Vercel-ready platform that leverages advanced LLMs to intelligently<br/>
    architect, scaffold, and render complex React UIs from simple text prompts.
  </p>

  <br/>

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_UIGen-black?style=for-the-badge)](https://your-deployment-url.vercel.app)
  [![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge)](https://groq.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

  <br/><br/>

  <img src="./screenshots/preview.png" alt="UIGen Preview" width="90%" style="border-radius:12px;" />

  <br/><br/>
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [How It Works](#-how-the-ai-sandbox-works)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🌟 Overview

**UIGen** eliminates the gap between idea and implementation. Describe a UI in plain English — UIGen's AI agent architects the component tree, writes production-ready React code, and renders it live in an isolated sandbox — all in your browser, in seconds.

No local dev server. No boilerplate. Just describe and build.

---

## 🚀 Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered Code Generation
Generate, edit, and iterate on complex React components using natural language via the **Vercel AI SDK** and **Groq's** blazing-fast inference engine.

</td>
<td width="50%">

### 💻 Real-time Live Sandbox
A secure, hot-reloading iframe execution environment built entirely in-browser — interact with generated UIs instantly, no setup required.

</td>
</tr>
<tr>
<td width="50%">

### 🗂️ Agentic Virtual File System
An in-memory multidimensional file manager. The AI agent creates directories, architects multi-file component trees, and performs precision string-replacement edits.

</td>
<td width="50%">

### 🛡️ Babel AST Polyfill Engine
A resilient custom Babel transpiler plugin that scans Abstract Syntax Trees to auto-mock hallucinated imports and safely polyfill undefined components — React never crashes.

</td>
</tr>
<tr>
<td width="50%">

### ⚡ ESM Native Package Resolution
Real-time fetching of NPM packages (`lucide-react`, `recharts`, `framer-motion`) with intelligent module deduplication to prevent hook-call violations.

</td>
<td width="50%">

### 🗃️ Database Persistence
Conversations, file systems, and project environments are securely persisted via **Prisma** and **PostgreSQL** — pick up exactly where you left off.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) — App Router + Turbopack |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **AI Integration** | [Vercel AI SDK](https://sdk.vercel.ai/docs) |
| **AI Inference** | [Groq](https://groq.com/) — OpenAI-compatible endpoints |
| **In-Browser Compiler** | [@babel/standalone](https://babeljs.io/) |
| **Database ORM** | [Prisma](https://www.prisma.io/) + PostgreSQL |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🧠 How the AI Sandbox Works

UIGen is fundamentally different from a standard chat UI. When the AI generates code, it writes directly to an isolated **Virtual File System Context** running in your browser.

```
User Prompt
    ↓
AI Agent (Groq + Vercel AI SDK)
    ↓
Virtual File System (create / edit / replace files)
    ↓
Babel AST Transpiler (JSX → browser-ready JS)
    ↓
ESM Package Resolver (fetch NPM deps from esm.sh)
    ↓
Sandboxed iframe Renderer
    ↓
Live Interactive UI ✨
```

1. **Intelligent Editors** — The AI uses `file_manager` and `str_replace_editor` tools to make granular updates without regenerating thousands of lines of code.
2. **In-Browser Transpilation** — The engine aggregates the file system, intercepts missing ESM imports, and uses `@babel/standalone` to parse raw JSX into browser-executable JavaScript.
3. **Safe Execution** — Custom console interceptors and React Error Boundaries catch runtime errors instantly, bubbling them back to the AI for automatic iteration.

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- `npm` or `yarn`
- A PostgreSQL database (local or hosted e.g. [Neon](https://neon.tech/), [Supabase](https://supabase.com/))
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/uigen.git
cd uigen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Then fill in your credentials (see [Environment Variables](#-environment-variables) below).

### 4. Initialize the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the development server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) and start building! 🚀

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# ─── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/uigen"

# ─── AI Provider ────────────────────────────────────────
GROQ_API_KEY="your_groq_api_key_here"
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com/) | ✅ Yes |

---

## ☁️ Deployment

UIGen is optimized for **one-click Vercel deployment**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/uigen)

**Steps:**
1. Click the button above
2. Connect your GitHub repository
3. Add your environment variables in the Vercel dashboard
4. Deploy — your app will be live at `https://your-project.vercel.app`

> **Note:** Make sure your PostgreSQL database is publicly accessible (e.g. use [Neon](https://neon.tech/) for a free hosted option).

---

## 📁 Project Structure

```
uigen/
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable React components
├── lib/                    # Core utilities (AI, sandbox, file system)
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets
├── screenshots/            # README screenshots
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ using Next.js, React, and Groq AI</p>
  <a href="https://your-deployment-url.vercel.app">🌐 Live Demo</a> · 
  <a href="https://github.com/your-username/uigen/issues">🐛 Report Bug</a> · 
  <a href="https://github.com/your-username/uigen/issues">💡 Request Feature</a>
</div>
