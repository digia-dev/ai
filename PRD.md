# Tara AI — Product Requirements Document

## Product

**Tara AI** — AI-Powered Assistant for Giantara Ecosystem.
Similar to Google Labs / NotebookLM.

## Users

- Tim Giantara
- Pengguna yang butuh analisis dokumen cepat
- Pengguna yang butuh asisten AI terintegrasi

## Features

### F1: Authentication

| Item    | Detail               |
|---------|----------------------|
| Register| Email + Name + Password |
| Login   | Email + Password     |
| Session | JWT token (7 hari)   |
| Logout  | Hapus token client  |

### F2: Chat dengan AI

| Item          | Detail                                    |
|---------------|-------------------------------------------|
| Model         | DeepSeek V4 Flash via OpenRouter          |
| Response      | JSON format dengan metadata               |
| History       | 20 msg terakhir sebagai context           |
| Source grounding | AI mengakses dokumen yang diupload     |
| Clarification | Tampilkan pilihan jika permintaan ambigu  |

### F3: Document Upload (NotebookLM-style)

| Item     | Detail                                         |
|----------|------------------------------------------------|
| File     | PDF, DOCX, DOC, TXT, MD, CSV, HTML            |
| Max size | 10MB per file                                  |
| Storage  | Text content disimpan di PostgreSQL            |
| Context  | AI otomatis akses dokumen saat chat            |
| Citations| Jawaban dengan referensi ke sumber             |

### F4: #Input Commands

| Item     | Detail                                                    |
|----------|-----------------------------------------------------------|
| Format   | `#input [instruction]`                                    |
| Reminder | `#input saya akan meeting 28 agustus jam 2 siang` → parse tanggal/waktu |
| Extensible | Framework untuk command lain                           |

### F5: Conversation History

| Item    | Detail                             |
|---------|------------------------------------|
| Per-user| Setiap user punya conversation sendiri |
| CRUD    | List, create, delete conversations |
| Auto-title | Judul otomatis dari pesan pertama |

### F6: Source Management

| Item     | Detail                     |
|----------|----------------------------|
| Upload   | File upload + drag & drop  |
| Text     | Paste text langsung        |
| List     | Lihat semua sumber         |
| Delete   | Hapus sumber               |

## Non-Functional Requirements

- Mobile responsive
- White theme (Plus Jakarta Sans font)
- PWA support (manifest.json)
- Build lokal (tidak build di server)
- PostgreSQL database
- Express.js backend
- React + Vite frontend
- TypeScript
- Tailwind CSS + Radix UI

## Constraints

- Shared hosting cPanel (limited memory, no root)
- PostgreSQL via Unix socket (TCP blocked by pg_hba.conf)
- Git deploy from GitHub
- No server-side build (cPanel kills processes with SIGABRT)
