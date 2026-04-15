<div align="center">
  <h1>✨ UIGen</h1>
  <p><strong>AI-Powered React Component Builder & Live Sandbox</strong></p>
  <p>
    Describe a UI in plain English — UIGen's AI agent architects the component tree,<br/>
    writes production-ready React code, and renders it live in an isolated sandbox. Instantly.
  </p>

  <br/>

  [![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

  <br/><br/>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [AI Providers](#ai-providers)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**UIGen** is a full-stack AI development environment that eliminates the gap between idea and implementation. It combines a multi-provider LLM backend, an in-browser virtual file system, a live sandboxed iframe renderer, and a custom Babel transpilation engine into a seamless, end-to-end React UI generation platform.

No local dev server needed. No boilerplate. Just describe and build.

**Key differentiators:**
- The AI agent doesn't just generate code — it *writes to files*, making precise, surgical edits using `str_replace_editor` and `file_manager` tools, mimicking a real developer workflow.
- A custom Babel AST plugin auto-mocks hallucinated imports and polyfills undefined components so the preview never crashes.
- Projects are fully persisted (messages + virtual file system) to a database, enabling true session continuity.

---

## Features

### 🤖 Multi-Provider AI Code Generation
Generate, edit, and iterate on complex React components using natural language. Powered by the **Vercel AI SDK** with support for **Anthropic**, **OpenAI**, **Groq**, **Google**, and **xAI** — switchable via environment variable.

### 💻 Real-Time Live Sandbox
A hot-reloading, sandboxed iframe execution environment built entirely in-browser. Interact with generated UIs instantly — no setup, no compile step on your machine.

### 🗂️ Agentic Virtual File System
An in-memory, multi-file virtual file system with full CRUD. The AI agent creates directories, architects component trees, and performs precision string-replace edits without regenerating thousands of lines of code.

### 🛡️ Babel AST Polyfill Engine
A resilient custom Babel transpiler plugin that statically analyzes the Abstract Syntax Tree to auto-mock hallucinated imports and safely polyfill undefined components — the React preview sandbox never crashes due to missing dependencies.

### ⚡ ESM Native Package Resolution
Real-time fetching of NPM packages (`lucide-react`, `recharts`, `framer-motion`, etc.) via `esm.sh`, with intelligent module deduplication to prevent React hook-call violations across module instances.

### 📦 Export & Download
Export the generated project as a downloadable ZIP archive containing all virtual file system files, ready to drop into any React project.

### 🗃️ Project Persistence
Conversations, virtual file systems, and project environments are persisted to a database via **Prisma** — pick up exactly where you left off across sessions.

### 🔐 Authentication
Secure JWT-based authentication with HTTP-only cookies. Users can sign up, sign in, and have all projects scoped to their account. Anonymous usage with an opt-in prompt to save work upon sign-up is also supported.

### 🖥️ Developer Experience
- Monaco Editor (VS Code engine) for viewing and editing generated files
- Interactive file tree explorer
- Integrated console panel capturing `console.log` / `console.error` output from the sandbox
- Command palette (`⌘K`) for quick actions
- Keyboard shortcut support

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) — App Router + Turbopack |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **AI SDK** | [Vercel AI SDK 4](https://sdk.vercel.ai/docs) |
| **AI Providers** | Anthropic, OpenAI, Groq, Google, xAI (configurable) |
| **In-Browser Compiler** | [@babel/standalone](https://babeljs.io/docs/babel-standalone) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Database ORM** | [Prisma 6](https://www.prisma.io/) |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **Auth** | JWT via [jose](https://github.com/panva/jose) + HTTP-only cookies |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Architecture

UIGen's core pipeline transforms a plain text prompt into a live interactive UI:

```
User Prompt
    │
    ▼
AI Agent (Vercel AI SDK + configurable provider)
    │  Uses agentic tools in a multi-step loop (up to 40 steps):
    │  ├── str_replace_editor  → create / overwrite / patch files
    │  └── file_manager        → create / rename / delete directories
    │
    ▼
Virtual File System (in-memory, serializable)
    │
    ▼
Babel AST Transpiler (@babel/standalone)
    │  ├── JSX → browser-executable ES modules
    │  ├── Resolves local @/ alias imports from the VFS
    │  └── Auto-mocks missing/hallucinated imports with Proxy placeholders
    │
    ▼
ESM Package Resolver (esm.sh CDN)
    │  Fetches real NPM packages on demand with deduplication
    │
    ▼
Sandboxed iframe Renderer
    │  ├── React Error Boundary catches render errors
    │  ├── Console interceptor forwards logs to the console panel
    │  └── Runtime error handler bubbles errors back to the AI for auto-fix
    │
    ▼
Live Interactive UI ✨
```

### Agentic Tool Design

Rather than dumping a wall of code in a single response, UIGen's AI agent behaves like a developer:

- **`str_replace_editor`** — Supports `create` (write a new file) and `str_replace` (replace a specific unique block of text). This enables targeted, surgical edits to large files.
- **`file_manager`** — Supports `create_directory`, `rename`, and `delete` operations on the virtual file system tree.

This design means iterative changes are fast and token-efficient — the AI modifies only what changed, not the entire file.

---

## Project Structure

```
uigen/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Project models)
│   └── migrations/            # Prisma migration history
│
├── src/
│   ├── app/
│   │   ├── [projectId]/       # Dynamic route for persisted projects
│   │   ├── api/chat/          # Streaming AI chat endpoint (POST)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── main-content.tsx   # Core IDE layout and state management
│   │   └── page.tsx           # Home page
│   │
│   ├── actions/               # Next.js Server Actions
│   │   ├── create-project.ts
│   │   ├── delete-project.ts
│   │   ├── get-project.ts
│   │   ├── get-projects.ts
│   │   ├── rename-project.ts
│   │   └── index.ts           # Auth actions (sign in, sign up, sign out)
│   │
│   ├── components/
│   │   ├── auth/              # AuthDialog, SignInForm, SignUpForm
│   │   ├── chat/              # ChatInterface, MessageList, MessageInput, MarkdownRenderer
│   │   ├── editor/            # CodeEditor (Monaco), FileTree
│   │   ├── preview/           # PreviewFrame (sandboxed iframe), ConsolePanel
│   │   ├── ui/                # Primitive components (shadcn/ui)
│   │   ├── CommandPalette.tsx
│   │   ├── ExportDialog.tsx
│   │   └── HeaderActions.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-keyboard-shortcuts.ts
│   │
│   └── lib/
│       ├── auth.ts                    # JWT session management
│       ├── provider.ts                # AI provider factory + MockLanguageModel
│       ├── prisma.ts                  # Prisma client singleton
│       ├── file-system.ts             # VirtualFileSystem class
│       ├── anon-work-tracker.ts       # Tracks anonymous session work
│       ├── contexts/
│       │   ├── chat-context.tsx       # Chat state context
│       │   └── file-system-context.tsx # VFS React context + refresh trigger
│       ├── prompts/
│       │   └── generation.tsx         # System prompt for the AI agent
│       ├── tools/
│       │   ├── str-replace.ts         # str_replace_editor tool builder
│       │   └── file-manager.ts        # file_manager tool builder
│       └── transform/
│           └── jsx-transformer.ts     # Babel AST transpiler + ESM resolver
│
├── next.config.ts
├── tsconfig.json
├── tailwind.config (via postcss)
└── vitest.config.mts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- `npm` (bundled with Node.js)
- An API key for at least one supported AI provider (see [AI Providers](#ai-providers))
- A PostgreSQL database for production, or SQLite (zero-config) for local development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/uigen.git
cd uigen
```

### 2. Install dependencies and initialize the database

The `setup` script handles everything in one step:

```bash
npm run setup
```

This runs `npm install`, generates the Prisma client, and applies database migrations.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials. At minimum you need a database URL and one AI provider key. See [Environment Variables](#environment-variables) for the full reference.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note for Windows users:** Use `npm run dev` (not the `dev:daemon` variant) — the Windows-specific `set` syntax is already handled by the `dev` script.

---

## Environment Variables

Create a `.env` file in the project root. The app will fall back to a `MockLanguageModel` if no API key is set, which is useful for UI development.

```env
# ─── Database ─────────────────────────────────────────────────
# SQLite (default, zero-config for local dev):
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (recommended for production):
# DATABASE_URL="postgresql://user:password@localhost:5432/uigen"

# ─── Authentication ───────────────────────────────────────────
# Any long random string. Generate with: openssl rand -base64 32
JWT_SECRET="your-secret-key-here"

# ─── AI Provider (configure ONE or more) ─────────────────────
GROQ_API_KEY="your_groq_api_key"
ANTHROPIC_API_KEY="your_anthropic_api_key"
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_GENERATIVE_AI_API_KEY="your_google_api_key"
XAI_API_KEY="your_xai_api_key"
```

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Database connection string | ✅ Yes |
| `JWT_SECRET` | Secret for signing JWT session tokens | ✅ Yes (use a strong random value in production) |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/) | One provider required |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) | One provider required |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/) | One provider required |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | One provider required |
| `XAI_API_KEY` | [xAI Console](https://console.x.ai/) | One provider required |

---

## AI Providers

The active provider is selected automatically based on which API key is present in the environment. The priority order is:

1. **Anthropic** (`ANTHROPIC_API_KEY`) — Claude models
2. **OpenAI** (`OPENAI_API_KEY`) — GPT-4o, o-series
3. **Groq** (`GROQ_API_KEY`) — Llama 3.1 (very fast inference)
4. **Google** (`GOOGLE_GENERATIVE_AI_API_KEY`) — Gemini models
5. **xAI** (`XAI_API_KEY`) — Grok models
6. **Mock** — Deterministic mock responses; used when no key is set (development only)

To change the active provider, simply set the corresponding key in `.env` and remove or comment out the others.

---

## Database

UIGen uses **Prisma** as its ORM with the following schema:

```
User
 ├── id         cuid (PK)
 ├── email      unique
 ├── password   bcrypt hash
 └── projects   Project[]

Project
 ├── id         cuid (PK)
 ├── name       string
 ├── userId     string? (nullable for anonymous projects)
 ├── messages   JSON string (full conversation history)
 └── data       JSON string (serialized virtual file system)
```

### Common database commands

```bash
# Apply migrations (run after cloning or pulling schema changes)
npx prisma migrate dev

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Reset the database (drops all data and re-migrates)
npm run db:reset

# Regenerate the Prisma client after schema changes
npx prisma generate
```

### Production database

For production, switch `DATABASE_URL` to a PostgreSQL connection string and update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Free hosted options: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), [Railway](https://railway.app/).

---

## Authentication

UIGen implements a custom, cookie-based JWT authentication system — no third-party auth service required.

- Sessions are stored in **HTTP-only, `SameSite=lax` cookies** (7-day expiry)
- Passwords are hashed with **bcrypt**
- The `middleware.ts` guards protected API routes (`/api/projects`, `/api/filesystem`)
- Anonymous usage is supported — users are prompted to create an account to save their work

---

## Deployment

UIGen is optimized for **Vercel** deployment.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/uigen)

### Manual deployment steps

1. Push your repository to GitHub
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add all required environment variables (see [Environment Variables](#environment-variables))
4. Set `DATABASE_URL` to a publicly accessible PostgreSQL instance
5. Deploy — your app will be live at `https://your-project.vercel.app`

### Build commands

```bash
# Production build
npm run build

# Start production server (after build)
npm start
```

> **Important:** The `NODE_OPTIONS='--require ./node-compat.cjs'` flag is applied automatically by all npm scripts. This polyfill ensures compatibility with certain Node.js built-ins used by dependencies in the Next.js runtime.

---

## Testing

UIGen uses **Vitest** with **Testing Library** for unit and component tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Test files live alongside the source they test under `__tests__/` directories:

```
src/components/chat/__tests__/
src/components/editor/__tests__/
src/lib/__tests__/
src/lib/contexts/__tests__/
src/lib/transform/__tests__/
```

Key test areas:
- **JSX Transformer** — Babel AST transformation, import resolution, placeholder generation
- **Virtual File System** — CRUD operations, serialization/deserialization
- **Chat Context** — Message state management
- **File System Context** — React context integration and refresh logic
- **UI Components** — ChatInterface, MessageList, MessageInput, FileTree, MarkdownRenderer

---

## Contributing

Contributions are welcome! Please open an issue first to discuss significant changes.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests where appropriate
4. Ensure all tests pass: `npm test`
5. Ensure the build succeeds: `npm run build`
6. Commit your changes: `git commit -m 'feat: add your feature'`
7. Push the branch: `git push origin feature/your-feature-name`
8. Open a Pull Request

Please follow the existing code style (TypeScript strict mode, functional components, Tailwind for styling).

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with Next.js, React 19, Vercel AI SDK, and Tailwind CSS</p>
  <a href="https://github.com/your-username/uigen/issues">🐛 Report a Bug</a> ·
  <a href="https://github.com/your-username/uigen/issues">💡 Request a Feature</a>
</div>
