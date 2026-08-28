# Tara AI — Tech Stack Document

## Architecture

```
Browser (React + Vite)
        │
        │ HTTP
        ▼
Express.js Server
   ├── Static serving (client/dist/)
   ├── API routes (REST)
   ├── Auth middleware (JWT)
   └── File upload (multer)
        │
        ├──────────┐
        ▼          ▼
  PostgreSQL    OpenRouter
  (pg driver)   (DeepSeek V4)
```

## Frontend

| Tech         | Version | Purpose                |
|--------------|---------|------------------------|
| React        | 18.x    | UI framework           |
| TypeScript   | 5.x     | Type safety            |
| Vite         | 5.x     | Build tool + dev server|
| Tailwind CSS | 3.x     | Utility-first CSS      |
| Radix UI     | latest  | Accessible components  |
| React Router | 6.x     | Client-side routing    |

## Backend

| Tech         | Version | Purpose                |
|--------------|---------|------------------------|
| Node.js      | 22.x    | Runtime                |
| Express.js   | 4.x     | HTTP server + routing  |
| pg           | 8.x     | PostgreSQL driver      |
| bcryptjs     | 3.x     | Password hashing       |
| jsonwebtoken | 9.x     | JWT auth               |
| multer       | 1.4.x   | File upload            |
| cors         | 2.8.x   | CORS headers           |

## Database

| Item     | Detail                              |
|----------|-------------------------------------|
| Engine   | PostgreSQL 16.14                    |
| Driver   | pg (node-postgres), raw SQL         |
| Connect  | Unix socket: /var/run/postgresql    |
| Database | giantar1_tara_ai                    |
| User     | giantar1_tara                       |

### Schema

```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Conversation" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  title VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Message" (
  id SERIAL PRIMARY KEY,
  "conversationId" INTEGER REFERENCES "Conversation"(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  citations JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Source" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50),
  content TEXT,
  "wordCount" INTEGER DEFAULT 0,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'ready',
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## AI

| Item     | Detail                              |
|----------|-------------------------------------|
| Provider | OpenRouter                          |
| Model    | deepseek/deepseek-chat-v4-0324      |
| API      | REST (fetch)                        |
| Response | JSON with message content           |

## Hosting

| Item     | Detail                              |
|----------|-------------------------------------|
| Platform | cPanel (CloudLinux)                 |
| Runtime  | Node.js 22 via Passenger            |
| Domain   | ai.giantara.web.id                  |
| Deploy   | Git auto-deploy from GitHub         |
| Build    | Local only (npm run build)          |

## API Routes

| Method | Endpoint                          | Description         |
|--------|-----------------------------------|---------------------|
| POST   | /api/auth/register                | Register            |
| POST   | /api/auth/login                   | Login               |
| GET    | /api/auth/me                      | Current user        |
| GET    | /api/conversations                | List conversations  |
| POST   | /api/conversations                | New conversation    |
| DELETE | /api/conversations/:id            | Delete conversation |
| GET    | /api/conversations/:id/messages   | Get messages        |
| POST   | /api/chat                         | Chat + AI response  |
| GET    | /api/sources                      | List sources        |
| POST   | /api/sources                      | Upload/add source   |
| DELETE | /api/sources/:id                  | Delete source       |

## Project Structure

```
tara-ai/
├── client/                    ← Vite React app
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── lib/
│   │   │   ├── api.ts         ← fetch wrapper + auth
│   │   │   └── auth.ts        ← token helpers
│   │   ├── pages/
│   │   │   ├── Auth.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Sources.tsx
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── SourceCard.tsx
│   │       └── ClarificationCard.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── client/dist/               ← Build output (committed)
├── server.js                  ← Express.js backend
├── package.json               ← Backend deps only
├── uploads/                   ← File uploads (gitignored)
├── .env                       ← Secrets (gitignored)
├── .gitignore
├── PRD.md
├── STS.md
└── DESIGN.md
```

## Deployment Flow

```
Local Machine                     Server
─────────────                     ──────
1. Edit client/ code
2. cd client && npm run build
3. git add -A && git push   ───►  4. cPanel git deploy (auto)
                                   5. .env via MCP
                                   6. Create tables via MCP pgsql_run_query
                                   7. Start app via cPanel Node.js Apps
```

## Environment Variables (.env)

```
PORT=3000
DB_USER=giantar1_tara
DB_PASS=TaraAI2026Secure!
DB_NAME=giantar1_tara_ai
DB_HOST=/var/run/postgresql
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=deepseek/deepseek-chat-v4-0324
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
JWT_SECRET=...
APP_URL=https://ai.giantara.web.id
```
