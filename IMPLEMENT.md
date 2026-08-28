# Tara AI — Implementation Plan

## Overview

Build Tara AI: Vite + React + Express.js + PostgreSQL
Based on: PRD.md, STS.md, DESIGN.md

---

## Phase 1: Project Scaffolding

### 1.1 Clean up old files
- [ ] Remove `public/` (old plain HTML)
- [ ] Remove `schema.sql` (old MySQL schema)
- [ ] Remove old `server.js`
- [ ] Remove old `package.json`

### 1.2 Init backend (root)
- [ ] Create `package.json` (express, pg, bcryptjs, jsonwebtoken, multer, cors)
- [ ] Create `.gitignore`
- [ ] Create `.env` (gitignored, for local dev)
- [ ] Run `npm install`

### 1.3 Init frontend (client/)
- [ ] `npm create vite@latest client -- --template react-ts`
- [ ] `cd client && npm install`
- [ ] Install tailwindcss, postcss, autoprefixer
- [ ] Install @radix-ui/react-tabs, @radix-ui/react-dialog, @radix-ui/react-toast
- [ ] Install react-router-dom
- [ ] Configure tailwind.config.js
- [ ] Configure vite.config.ts

---

## Phase 2: Backend (server.js)

### 2.1 Database connection
- [ ] Create pg Pool (Unix socket: /var/run/postgresql)
- [ ] Environment variables from .env

### 2.2 Auth routes
- [ ] POST /api/auth/register (hash password, insert user, return JWT)
- [ ] POST /api/auth/login (verify password, return JWT)
- [ ] GET /api/auth/me (require auth, return user)
- [ ] Auth middleware (verify JWT from Authorization header)

### 2.3 Conversation routes
- [ ] GET /api/conversations (list user's conversations)
- [ ] POST /api/conversations (create new)
- [ ] DELETE /api/conversations/:id (delete + messages)
- [ ] GET /api/conversations/:id/messages (get messages)

### 2.4 Chat route
- [ ] POST /api/chat
  - [ ] Create conversation if no conversationId
  - [ ] Save user message
  - [ ] Fetch user's sources for context
  - [ ] Build system prompt + source context + history
  - [ ] Call OpenRouter API
  - [ ] Save AI response
  - [ ] Update conversation timestamp
  - [ ] Return { conversationId, content }

### 2.5 Source routes
- [ ] GET /api/sources (list user's sources)
- [ ] POST /api/sources (upload file OR text content)
  - [ ] multer for file upload (10MB limit)
  - [ ] Read file content as text
  - [ ] Save to DB with wordCount
- [ ] DELETE /api/sources/:id

### 2.6 Static file serving
- [ ] Serve `client/dist/` as static
- [ ] SPA fallback: all other routes → index.html

---

## Phase 3: Frontend

### 3.1 App setup
- [ ] main.tsx: React root + BrowserRouter
- [ ] App.tsx: Route definitions
  - / → redirect to /chat or /login
  - /login → Auth page
  - /register → Auth page
  - /chat → Chat page (protected)
  - /sources → Sources page (protected)

### 3.2 Auth page (pages/Auth.tsx)
- [ ] Login/Register toggle
- [ ] Form: name (register), email, password
- [ ] Error display
- [ ] Call /api/auth/register or /api/auth/login
- [ ] Store token in localStorage
- [ ] Redirect to /chat on success

### 3.3 Chat page (pages/Chat.tsx)
- [ ] Layout: Sidebar + Main
- [ ] State: conversations, currentConvId, messages, input

### 3.4 Sidebar (components/Sidebar.tsx)
- [ ] Logo (SVG) + title
- [ ] New chat button (+)
- [ ] Conversation list (click to open, hover shows delete)
- [ ] Footer: Sources link, Logout button

### 3.5 Messages area
- [ ] Welcome screen (when no conversation selected)
  - [ ] Icon + "Hi, I'm Tara"
  - [ ] 4 suggestion cards (2x2 grid)
- [ ] Message list (scrollable)
- [ ] MessageBubble component
  - [ ] User: gray avatar "U"
  - [ ] AI: black avatar "T"
  - [ ] Content with pre-wrap
- [ ] Typing indicator (3 dots)

### 3.6 Chat input
- [ ] Textarea (auto-resize)
- [ ] Send button (Enter to send, Shift+Enter for newline)
- [ ] Disable during loading

### 3.7 ClarificationCard (components/ClarificationCard.tsx)
- [ ] Parse AI response for clarification JSON
- [ ] Display question + option buttons
- [ ] On click: send selected option as new message

### 3.8 Sources page (pages/Sources.tsx)
- [ ] Header + Back button
- [ ] Radix Tabs: File Upload | Text Source
- [ ] File tab: drag & drop zone
  - [ ] Accept: PDF, DOCX, DOC, TXT, MD, CSV, HTML
  - [ ] Call POST /api/sources with FormData
- [ ] Text tab: name input + textarea + submit
  - [ ] Call POST /api/sources with JSON
- [ ] Source list (SourceCard component)
  - [ ] Icon + name + word count + delete button

### 3.9 API helper (lib/api.ts)
- [ ] apiFetch(url, options) — adds Authorization header
- [ ] Handles 401 → redirect to login
- [ ] JSON parse helper

### 3.10 Auth helper (lib/auth.ts)
- [ ] getToken() / setToken() / removeToken() — localStorage
- [ ] isAuthenticated() — check if token exists

---

## Phase 4: SVG Icon

### 4.1 Create Tara logo
- [ ] Abstract geometric diamond shape
- [ ] Black version (default)
- [ ] White version (inverted)
- [ ] Save as: client/public/icon.svg

### 4.2 PWA icons
- [ ] Generate 192x192 PNG from SVG
- [ ] Generate 512x512 PNG from SVG
- [ ] Save to client/public/

### 4.3 Update manifest.json
- [ ] client/public/manifest.json with icons

---

## Phase 5: Database Setup (Server)

### 5.1 Create tables via MCP
- [ ] pgsql_run_query: CREATE TABLE "User"
- [ ] pgsql_run_query: CREATE TABLE "Conversation"
- [ ] pgsql_run_query: CREATE TABLE "Message"
- [ ] pgsql_run_query: CREATE TABLE "Source"

### 5.2 Create .env on server
- [ ] Create file via MCP: ai/.env
- [ ] DB_HOST=/var/run/postgresql (Unix socket)

---

## Phase 6: Build & Deploy

### 6.1 Build frontend locally
- [ ] cd client && npm run build
- [ ] Verify client/dist/ exists

### 6.2 Git push
- [ ] git add -A
- [ ] git commit
- [ ] git push origin main

### 6.3 Server deploy
- [ ] Trigger cPanel git deploy
- [ ] Verify files on server via MCP list_files

### 6.4 Start app
- [ ] cPanel Node.js Apps: Create/Start
- [ ] Node.js 22, root: ai, startup: server.js

### 6.5 Test
- [ ] Open https://ai.giantara.web.id
- [ ] Test register
- [ ] Test login
- [ ] Test chat
- [ ] Test source upload
- [ ] Test source delete
- [ ] Test conversation delete
- [ ] Test clarification
- [ ] Test #input command

---

## File Checklist (all files to create)

```
tara-ai/
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css          ← tailwind imports
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   ├── pages/
│   │   │   ├── Auth.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Sources.tsx
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── ClarificationCard.tsx
│   │       └── SourceCard.tsx
│   ├── public/
│   │   ├── icon.svg           ← Tara logo
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── manifest.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── package.json
├── .env                       ← local dev (gitignored)
├── .gitignore
├── package.json               ← backend deps
├── server.js
├── PRD.md
├── STS.md
├── DESIGN.md
└── IMPLEMENT.md
```

---

## Execution Order

1. Phase 1: Scaffolding (clean + init)
2. Phase 2: Backend (server.js)
3. Phase 3: Frontend (React)
4. Phase 4: SVG Icon
5. Phase 5: Database (MCP)
6. Phase 6: Build & Deploy

**Estimated: ~25 files to create/edit**
