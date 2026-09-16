# AION - All in One

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)

> An all-in-one AI-powered productivity platform that unifies chat, notes, files, workflows, calendar, and more into a single cohesive workspace.

<img width="1911" height="902" alt="image" src="https://github.com/user-attachments/assets/2de2bbe2-17d6-4741-8251-23a021a84f22" />

---

## 🌟 Overview

**Universal AI Assistant Platform** is a comprehensive productivity suite that combines the power of multiple AI providers with a rich set of tools designed to streamline your daily workflow.

Unlike traditional chatbots, this platform is built as a **universal ecosystem** where the AI has access to all your data — notes, files, calendar events, reminders, contacts, spreadsheets, and even a digital whiteboard. It remembers context across modules and can automate repetitive tasks through a powerful workflow engine.

### Why Universal AI Assistant?

- 🧠 **AI Memory System** — The AI remembers everything across all modules
- ⚡ **Workflow Automation** — Create rules that run automatically (or generate them with AI)
- 🎯 **Multi-Agent Support** — Specialized agents for code, translation, research, and more
- 🔗 **External Integrations** — Connect with Google, GitHub, Notion, Slack, Trello
- 🎤 **Voice Assistant (JARVIS)** — Control your platform with natural language
- 🐳 **Fully Dockerized** — One command to run everything
- ✅ **Well Tested** — Unit tests, integration tests, and E2E coverage

---

## ✨ Features

### 🤖 AI Chat

- Multiple conversations with persistent history
- Context-aware responses using the AI Memory System
- Streaming-ready architecture
- File attachments (PDF, text, images, code)
- Message editing and regeneration
- Export conversations as Markdown, TXT, or PDF

### 🧠 AI Memory System

- Auto-indexing of all modules (notes, files, contacts, calendar, etc.)
- Semantic search across your entire workspace
- Context injection into every conversation
- Automatic re-indexing on first login

### 🎯 Specialized Agents

Pre-built agents for common tasks:

| Agent | Icon | Description |
|-------|------|-------------|
| General Assistant | 🤖 | Everyday tasks |
| Code Assistant | 💻 | Programming and code review |
| Translator | 🌐 | Multi-language translation |
| Summarizer | 📝 | Text summarization |
| Researcher | 🔍 | Deep research and analysis |
| Creative Writer | ✍️ | Stories and content |
| Math Tutor | 📐 | Step-by-step math explanations |
| Business Advisor | 💼 | Strategic business advice |

### 📝 Notes

- Rich text editor powered by Tiptap
- Markdown support with live preview
- Folder hierarchy for organization
- Templates for meetings, tasks, projects, and more
- Auto-save with debounce
- Export to Markdown and TXT
- Search across all notes

### 📁 Files

- Drag & drop uploads
- Folder organization
- Favorite files
- Image previews
- Multiple file type support

### 📊 Spreadsheets

- Editable grid interface
- CSV export
- Multiple spreadsheet support
- Auto-save
- Import into Charts module

### 📈 Charts

- 7 chart types: Line, Bar, Pie, Area, Radar, Scatter, Heatmap
- Real-time data editing
- Import from spreadsheets
- Export as PNG or SVG
- Custom animations

### 📅 Calendar & Reminders

- Event management with daily/monthly views
- Browser notifications
- Recurring reminders (daily, weekly, monthly)
- Timezone-aware scheduling

### 👥 Contacts

- Contact management with search
- Direct WhatsApp Web integration
- Notes and metadata per contact

### 🎨 Whiteboard

- Digital canvas for brainstorming
- 12 drawing tools (pen, shapes, text, etc.)
- Color palette and stroke customization
- Layers with bring forward/send backward
- Undo/redo history
- Multiple whiteboards

### ⚡ Workflows (Automation)

The workflow engine supports:

**Triggers:**
- `NOTE_CREATED`, `NOTE_UPDATED`
- `CONTACT_CREATED`, `CONTACT_UPDATED`
- `REMINDER_CREATED`, `REMINDER_DUE`
- `EVENT_CREATED`, `EVENT_STARTING`
- `CONVERSATION_ENDED`
- `FILE_UPLOADED`
- `SPREADSHEET_CREATED`, `SPREADSHEET_UPDATED`
- `SCHEDULE` (cron-based)
- `MANUAL`

**Actions:**
- `CREATE_NOTE`, `CREATE_REMINDER`, `CREATE_EVENT`
- `SEND_NOTIFICATION`, `SEND_EMAIL`
- `AI_PROMPT` (call AI to process data)
- `WEBHOOK`
- `UPDATE_NOTE`

**Special Features:**
- 🤖 **AI Workflow Generator** — Describe in natural language, AI creates the workflow
- 📋 **Templates** — 10+ ready-to-use automation templates
- 📊 **Analytics** — Track executions, success rate, performance

### 🔗 External Integrations

- **Google Calendar** — Sync events
- **Google Drive** — Access files
- **Notion** — Import/export notes
- **GitHub** — Repository management
- **Trello** — Task synchronization
- **Slack** — Notifications

### 🎤 JARVIS Voice Assistant

- Optional floating assistant (enable in Settings)
- Natural voice using ElevenLabs
- Multi-language support (Portuguese and English)
- Understands commands and navigates the platform
- Powered by Groq's fast LLM inference

### 🔍 Global Search (Ctrl+K)

- Universal search across all modules
- Keyboard navigation
- Instant results with context

### 📤 Export & Backup

- Export conversations (Markdown, TXT)
- Export notes (Markdown, TXT)
- Full JSON backup of all data

---

## 🛠️ Tech Stack

### Backend

| Component | Technology |
|-----------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.3.5 |
| Security | Spring Security + JWT |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| ORM | Hibernate / JPA |
| File Processing | Apache PDFBox |
| Build Tool | Maven |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite 5 |
| Styling | TailwindCSS 3 |
| State Management | Zustand |
| Routing | React Router 6 |
| Rich Text | Tiptap |
| Charts | Recharts |
| Markdown | react-markdown + remark-gfm |
| HTTP Client | Axios |

### AI Providers

- **Groq** — Fast LLM inference (default)
  - `openai/gpt-oss-20b` — General purpose
  - `openai/gpt-oss-120b` — High quality
  - `qwen/qwen3.6-27b` — With image support
- **ElevenLabs** — Natural voice synthesis

### DevOps

- **Docker** & **Docker Compose** — Containerization
- **GitHub Actions** — CI/CD
- **Nginx** — Production web server

---

## 🏗️ Architecture
<img width="3120" height="3692" alt="image" src="https://github.com/user-attachments/assets/cf264f60-2b93-4943-bc5e-09812421fae1" />

---

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))
- Optional: **ElevenLabs API Key** for voice features

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/SEU_USUARIO/universal-ai-assistant.git
cd universal-ai-assistant

# Copy environment template
cp .env.example .env

# Edit .env and add your GROQ_API_KEY
nano .env  # or use your favorite editor

# Start everything
docker compose up --build
```

### Manual Setup (without Docker)
#### Backend
```bash
cd backend

# Requires Java 17 and Maven
mvn spring-boot:run
Backend will run on http://localhost:8080
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
Frontend will run on http://localhost:5173
```
#### Database
```bash
# Start only PostgreSQL
docker compose up -d postgres
```
