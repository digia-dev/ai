require('dotenv').config();
const express = require('express');
const path = require('path');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tara-ai-jwt-secret-2026-secure-change-in-production';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'giantar1_tara',
  password: process.env.DB_PASS || 'TaraAI2026Secure!',
  database: process.env.DB_NAME || 'giantar1_tara_ai',
  host: process.env.DB_HOST || '/var/run/postgresql',
});

app.use(cors({ origin: ['https://ai.giantara.web.id', 'http://localhost:5173'] }));
app.use(express.json({ limit: '10mb' }));

// ============ DB MIGRATIONS ============
async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN DEFAULT false');
    await client.query(`CREATE TABLE IF NOT EXISTS "Tag" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(7) DEFAULT '#6B7280',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("userId", name)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "AgentTag" (
      "agentId" INTEGER REFERENCES "Agent"(id) ON DELETE CASCADE,
      "tagId" INTEGER REFERENCES "Tag"(id) ON DELETE CASCADE,
      PRIMARY KEY("agentId", "tagId")
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "SharedLink" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "conversationId" INTEGER REFERENCES "AgentConversation"(id) ON DELETE CASCADE,
      token VARCHAR(32) UNIQUE NOT NULL,
      title VARCHAR(255),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "expiresAt" TIMESTAMP,
      views INTEGER DEFAULT 0
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "UserMemory" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      key VARCHAR(100) NOT NULL,
      value TEXT NOT NULL,
      "sourceConversationId" INTEGER,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("userId", key)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "ConversationBranch" (
      id SERIAL PRIMARY KEY,
      "conversationId" INTEGER REFERENCES "Conversation"(id) ON DELETE CASCADE,
      "parentId" INTEGER,
      "branchName" VARCHAR(100) DEFAULT 'main',
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "PromptTemplate" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) DEFAULT 'Custom',
      prompt TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "ConversationComment" (
      id SERIAL PRIMARY KEY,
      "conversationId" INTEGER REFERENCES "Conversation"(id) ON DELETE CASCADE,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS "Webhook" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      url TEXT NOT NULL,
      active BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`);
    await client.query('ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "branchId" INTEGER DEFAULT 1');
    await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false');
    console.log('Migrations completed');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    client.release();
  }
}
runMigrations();

const distPath = path.join('/home/giantar1/ai', 'client', 'dist');
const uploadsPath = path.join('/home/giantar1/ai', 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
const distExists = fs.existsSync(distPath);
if (distExists) {
  app.use(express.static(path.join(distPath), { index: 'index.html' }));
}

app.get('/api/debug', (req, res) => {
  res.json({ distExists, files: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [], distPath });
});

const upload = multer({
  dest: path.join('/home/giantar1/ai', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, async () => {
    try {
      const result = await pool.query('SELECT "isAdmin" FROM "User" WHERE id = $1', [req.user.id]);
      if (!result.rows[0]?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    } catch {
      res.status(500).json({ error: 'Auth check failed' });
    }
  });
}

// ============ ADMIN APIs ============

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [users, conversations, messages, tokens, agents] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM "User"'),
      pool.query('SELECT COUNT(*) as count FROM "Conversation"'),
      pool.query('SELECT COUNT(*) as count FROM "Message"'),
      pool.query('SELECT COALESCE(SUM("tokenBalance"), 0) as total FROM "UserBilling"'),
      pool.query('SELECT COUNT(*) as count FROM "Agent"'),
    ]);
    res.json({
      users: parseInt(users.rows[0].count),
      conversations: parseInt(conversations.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      totalTokens: parseInt(tokens.rows[0].total),
      agents: parseInt(agents.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u."createdAt", u."isAdmin", u.banned,
        COALESCE(b."tokenBalance", 0) as "tokenBalance",
        (SELECT COUNT(*) FROM "Conversation" WHERE "userId" = u.id) as "conversationCount",
        (SELECT COUNT(*) FROM "Message" m JOIN "Conversation" c ON m."conversationId" = c.id WHERE c."userId" = u.id) as "messageCount"
      FROM "User" u
      LEFT JOIN "UserBilling" b ON b."userId" = u.id
      ORDER BY u."createdAt" DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE "User" SET banned = NOT banned WHERE id = $1 RETURNING id, banned',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ id: result.rows[0].id, banned: result.rows[0].banned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/admin', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE "User" SET "isAdmin" = NOT "isAdmin" WHERE id = $1 RETURNING id, "isAdmin"',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ id: result.rows[0].id, isAdmin: result.rows[0].isAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/health', adminAuth, async (req, res) => {
  try {
    const dbOk = await pool.query('SELECT 1').then(() => true).catch(() => false);
    res.json({
      status: 'ok',
      database: dbOk ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MODEL CONFIG ============

const MODEL_CONFIG = {
  'deepseek/deepseek-v4-flash': { name: 'DeepSeek V4 Flash', context: '1M' },
  'deepseek/deepseek-v3.2': { name: 'DeepSeek V3.2', context: '1M' },
  'deepseek/deepseek-v4-pro': { name: 'DeepSeek V4 Pro', context: '1M' },
  'openai/gpt-4o-mini': { name: 'GPT-4o Mini', context: '128K' },
  'openai/gpt-5.6-luna': { name: 'GPT-5.6 Luna', context: '1M' },
  'openai/gpt-4.1-mini': { name: 'GPT-4.1 Mini', context: '1M' },
  'anthropic/claude-3-haiku': { name: 'Claude 3 Haiku', context: '200K' },
  'anthropic/claude-haiku-4.5': { name: 'Claude Haiku 4.5', context: '200K' },
  'qwen/qwen3-coder': { name: 'Qwen3 Coder', context: '262K' },
  'qwen/qwen3.5-flash': { name: 'Qwen3.5 Flash', context: '1M' },
  'mistralai/mistral-nemo': { name: 'Mistral Nemo', context: '131K' },
  'meta-llama/llama-3.3-70b-instruct': { name: 'Llama 3.3 70B', context: '131K' },
  'meta-llama/llama-4-scout': { name: 'Llama 4 Scout', context: '1M' },
  'google/gemini-2.5-flash-lite': { name: 'Gemini 2.5 Flash Lite', context: '1M' },
};

// ============ TAVILY SEARCH ============

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

const FOCUS_MODES = {
  general: { label: 'General', searchDepth: 'basic', topic: 'general' },
  academic: { label: 'Academic', searchDepth: 'advanced', topic: 'general', includeDomains: ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'researchgate.net', 'jstor.org', 'sciencedirect.com'] },
  news: { label: 'News', searchDepth: 'basic', topic: 'news' },
  code: { label: 'Code', searchDepth: 'basic', topic: 'general', includeDomains: ['stackoverflow.com', 'github.com', 'dev.to', 'medium.com', 'docs.python.org', 'developer.mozilla.org', 'docs.rs'] },
};

async function tavilySearch(query, mode = 'general') {
  if (!TAVILY_API_KEY) return null;

  const config = FOCUS_MODES[mode] || FOCUS_MODES.general;
  const body = {
    query,
    search_depth: config.searchDepth,
    topic: config.topic,
    max_results: 5,
    include_answer: true,
    include_raw_content: false,
  };

  if (config.includeDomains) {
    body.include_domains = config.includeDomains;
  }

  try {
    const res = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, ...body }),
    });

    if (!res.ok) {
      console.error('Tavily error:', res.status);
      return null;
    }

    const data = await res.json();
    return {
      answer: data.answer || '',
      results: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
    };
  } catch (err) {
    console.error('Tavily search failed:', err.message);
    return null;
  }
}

function buildSearchContext(searchResult) {
  if (!searchResult) return '';

  let context = '';
  if (searchResult.answer) {
    context += `Ringkasan dari web:\n${searchResult.answer}\n\n`;
  }

  if (searchResult.results.length > 0) {
    context += 'Sumber:\n';
    searchResult.results.forEach((r, i) => {
      context += `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 500)}\n\n`;
    });
  }

  return context;
}

function extractCitations(searchResult) {
  if (!searchResult || !searchResult.results) return [];
  return searchResult.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.content.slice(0, 200),
    score: r.score,
  }));
}

async function generateRelatedQuestions(message, aiResponse, searchResult) {
  if (!TAVILY_API_KEY) return [];

  try {
    const res = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': 'Tara AI',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: 'Generate 3 concise follow-up questions based on the user query and AI response. Return ONLY a JSON array of strings, no markdown, no explanation. Example: ["question 1", "question 2", "question 3"]'
          },
          {
            role: 'user',
            content: `Pertanyaan user: ${message}\n\nJawaban AI: ${aiResponse.slice(0, 1000)}\n\n${searchResult?.answer ? `Konteks web: ${searchResult.answer.slice(0, 500)}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '[]';
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch {
    return [];
  }
}

const DEFAULT_AGENTS = [
  {
    name: 'Tara',
    icon: '✦',
    model: 'deepseek/deepseek-v4-flash',
    temperature: 0.7,
    isDefault: true,
    isTemplate: true,
    systemPrompt: `Kamu adalah Tara, AI Assistant yang dirancang untuk membantu pengguna menyelesaikan berbagai kebutuhan secara akurat, jelas, profesional, dan mudah dipahami.

IDENTITAS:
- Nama: Tara
- Peran: General-purpose AI Assistant
- Bahasa: Bahasa Indonesia dan English
- Temperature: 0.7
- Gaya: Friendly, professional, clear, structured

PRINSIP UTAMA:
Selalu pahami maksud pengguna terlebih dahulu sebelum memberikan jawaban. Berikan respons yang relevan dengan konteks, langsung menjawab kebutuhan utama, dan hindari informasi yang tidak diperlukan.

KAPABILITAS:
- Menjawab pertanyaan umum secara akurat dan relevan.
- Menjelaskan konsep atau informasi kompleks dengan bahasa sederhana.
- Menganalisis dokumen dan mengekstrak informasi, fakta, poin penting, serta insight yang relevan.
- Merangkum dokumen atau teks panjang menjadi ringkasan yang ringkas dan informatif.
- Menerjemahkan Bahasa Indonesia ↔ English dengan mempertahankan makna, konteks, dan tone asli.
- Membantu menulis, memperbaiki, menyusun, dan mengembangkan berbagai jenis teks.
- Membantu brainstorming, perencanaan, pengambilan keputusan, dan problem solving.
- Membantu pengguna menyusun informasi menjadi format yang lebih terstruktur.
- Menyesuaikan kedalaman jawaban dengan kompleksitas pertanyaan pengguna.

BAHASA:
- Gunakan bahasa yang sama dengan bahasa utama pengguna.
- Jika pengguna menggunakan Bahasa Indonesia, jawab dalam Bahasa Indonesia.
- Jika pengguna menggunakan English, jawab dalam English.

GAYA KOMUNIKASI:
- Friendly tetapi tetap professional.
- Gunakan bahasa yang natural dan mudah dipahami.
- Gunakan heading, bullet points, numbered lists, dan tabel jika membantu keterbacaan.

ATURAN AKURASI:
- Jangan mengarang fakta, sumber, angka, kutipan, atau informasi yang tidak tersedia.
- Bedakan antara fakta, interpretasi, asumsi, dan rekomendasi.
- Jika informasi tidak cukup untuk memberikan jawaban yang dapat diandalkan, jelaskan informasi apa yang kurang.

FORMAT RESPONS:
Untuk pertanyaan umum:
1. Jawab langsung pertanyaan utama.
2. Berikan penjelasan atau detail pendukung.
3. Tambahkan kesimpulan atau next step jika relevan.

Untuk analisis dokumen:
1. Ringkasan
2. Poin-Poin Utama
3. Insight atau Temuan
4. Hal yang Perlu Diperhatikan
5. Kesimpulan

Selalu berkomunikasi dengan sikap helpful, confident, transparent, dan professional.`
  },
  {
    name: 'Data Analyst',
    icon: '📊',
    model: 'openai/gpt-4o-mini',
    temperature: 0.3,
    isDefault: true,
    isTemplate: true,
    systemPrompt: `You are Data Analyst, a reliable AI assistant for analyzing structured and semi-structured data. Your purpose is to help users understand datasets, identify meaningful patterns, summarize results, and turn findings into clear, actionable insights.

You can analyze data provided as CSV, JSON, or plain text. Always base conclusions on the available data. Never invent values, trends, or statistics.

KAPABILITAS:
A. Data Understanding - Detect columns, fields, records, and data types.
B. Statistical Analysis - Generate appropriate statistics based on the dataset.
C. Insight Generation - Convert analytical results into practical findings.
D. Data Presentation - Use Markdown tables for structured results.
E. File Generation - Generate downloadable files when requested (CSV, Markdown).

FORMAT OUTPUT:
### Summary
Brief overview of the dataset and analysis.

### Key Statistics
Relevant statistical results in a Markdown table.

### Key Insights
- Concise, evidence-based findings.

### Data Quality
Mention missing, duplicated, inconsistent, or potentially unreliable data.

### Recommended Actions
Provide practical next steps based directly on the findings.

ATURAN:
- Be accurate, concise, and transparent.
- Never fabricate missing data.
- Explain calculations when they materially affect interpretation.
- Avoid unnecessary technical jargon.
- Do not confuse correlation with causation.
- Flag small sample sizes or limitations when they affect conclusions.

Untuk generate file, gunakan format:
\`\`\`file:nama-file.csv
isi file di sini
\`\`\``
  },
  {
    name: 'Content Writer',
    icon: '📝',
    model: 'anthropic/claude-3-haiku',
    temperature: 0.8,
    isDefault: true,
    isTemplate: true,
    systemPrompt: `Kamu adalah Content Writer profesional yang membantu pengguna membuat konten berkualitas, relevan, dan orisinal.

KAPABILITAS:
- Tulis artikel, blog post, landing page copy, social media copy, product description, email, dan copywriting.
- SEO optimization berdasarkan keyword, search intent, struktur heading, readability, dan relevansi konten.
- Menghasilkan output dalam Markdown, HTML, atau plain text.
- Membuat file output .md, .html, atau .txt ketika fitur file generation tersedia.
- Menyesuaikan tone, audience, panjang, bahasa, dan tujuan konten berdasarkan instruksi pengguna.

GAYA PENULISAN:
- Engaging, natural, dan mudah dibaca.
- Struktur jelas menggunakan heading dan subheading yang sesuai.
- Hindari kalimat generik, filler, dan pengulangan.
- Gunakan contoh atau detail spesifik jika tersedia.
- Gunakan Call-to-Action (CTA) yang relevan dengan tujuan konten.

ATURAN:
- Jangan mengarang fakta, data, kutipan, atau sumber.
- Jangan menyalin karya orang lain. Hasil harus original.
- Jika informasi penting belum tersedia, tanyakan pertanyaan yang diperlukan.
- Untuk SEO, prioritaskan kualitas dan search intent daripada keyword stuffing.

OUTPUT DEFAULT:
1. Content Title
2. Main Content
3. CTA jika relevan
4. SEO Information untuk konten SEO

Untuk file output, gunakan format:
\`\`\`file:nama-file.md
isi file di sini
\`\`\``
  },
  {
    name: 'Code Assistant',
    icon: '💻',
    model: 'qwen/qwen3-coder',
    temperature: 0.2,
    isDefault: true,
    isTemplate: true,
    systemPrompt: `Kamu adalah Code Assistant expert yang membantu pengguna menulis, memahami, memperbaiki, dan mengoptimalkan kode secara praktis, akurat, dan mudah dipahami.

KAPABILITAS:
- Tulis kode dalam berbagai bahasa pemrograman.
- Debug dan perbaiki error pada kode.
- Optimasi performa, struktur, readability, dan maintainability.
- Refactor kode tanpa mengubah behavior yang diharapkan.
- Menjelaskan kode dan error secara step-by-step.
- Membuat struktur project dan beberapa file kode.
- Generate file kode seperti .js, .ts, .py, .html, .css, .json, .sql, dan format lain.

ATURAN:
- Selalu prioritaskan kode yang benar, sederhana, aman, dan mudah dipelihara.
- Jangan mengarang API, library, function, atau syntax yang tidak diketahui.
- Identifikasi root cause sebelum memberikan solusi ketika debugging.
- Hindari solusi yang unnecessarily complex.
- Jangan memberikan credential, API key, password, atau secret secara langsung.

FORMAT OUTPUT:
- Gunakan code blocks dengan syntax highlighting.
- Berikan penjelasan singkat sebelum kode.
- Setelah kode, jelaskan bagian penting atau perubahan yang dilakukan.
- Untuk debugging, gunakan format: 1. Masalah 2. Penyebab 3. Solusi 4. Kode yang diperbaiki.
- Untuk generate file, gunakan format:
\`\`\`file:nama-file.ext
isi file di sini
\`\`\`

KUALITAS KODE:
- Gunakan naming yang jelas dan konsisten.
- Gunakan error handling yang sesuai.
- Ikuti best practice yang relevan dengan bahasa/framework yang digunakan.`
  }
];

// ============ AUTH ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO "User" (email, name, password) VALUES ($1, $2, $3) RETURNING id', [email, name, hash]);
    const userId = result.rows[0].id;

    // Create billing with trial tokens
    await pool.query(
      'INSERT INTO "UserBilling" ("userId", plan, "tokenBalance", "trialTokens", "trialEndsAt") VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'30 days\')',
      [userId, 'trial', 10000, 10000]
    );
    await pool.query(
      'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'trial', 10000, 10000, 'Trial bonus: 10,000 token']
    );

    // Create default agents
    for (const agent of DEFAULT_AGENTS) {
      await pool.query(
        'INSERT INTO "Agent" ("userId", name, icon, "systemPrompt", model, temperature, "isDefault", "isTemplate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, agent.name, agent.icon, agent.systemPrompt, agent.model, agent.temperature, agent.isDefault, agent.isTemplate]
      );
    }

    const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, "createdAt" FROM "User" WHERE id = $1', [req.user.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONVERSATIONS ============

app.get('/api/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, "createdAt", "updatedAt" FROM "Conversation" WHERE "userId" = $1 ORDER BY "updatedAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO "Conversation" ("userId", title) VALUES ($1, $2) RETURNING id, title',
      [req.user.id, req.body.title || 'New Chat']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Message" WHERE "conversationId" = $1', [req.params.id]);
    await pool.query('DELETE FROM "Conversation" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MESSAGES ============

app.get('/api/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const result = await pool.query(
      'SELECT id, role, content, metadata, citations, "createdAt" FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONVERSATION SEARCH ============

app.get('/api/conversations/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) return res.json([]);

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT DISTINCT c.id, c.title, c."createdAt", c."updatedAt",
       ts_rank_cd(to_tsvector('simple', c.title), plainto_tsquery('simple', $2)) as rank
       FROM "Conversation" c
       LEFT JOIN "Message" m ON c.id = m."conversationId"
       WHERE c."userId" = $1
       AND (c.title ILIKE $2 OR m.content ILIKE $2)
       ORDER BY rank DESC, c."updatedAt" DESC
       LIMIT 20`,
      [req.user.id, searchQuery]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MESSAGE REGENERATION ============

app.post('/api/conversations/:id/regenerate', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const lastMsg = await pool.query(
      'SELECT id FROM "Message" WHERE "conversationId" = $1 AND role = \'assistant\' ORDER BY "createdAt" DESC LIMIT 1',
      [req.params.id]
    );
    if (lastMsg.rows.length === 0) return res.status(404).json({ error: 'No assistant message to regenerate' });

    await pool.query('DELETE FROM "Message" WHERE id = $1', [lastMsg.rows[0].id]);

    const lastUserMsg = await pool.query(
      'SELECT content FROM "Message" WHERE "conversationId" = $1 AND role = \'user\' ORDER BY "createdAt" DESC LIMIT 1',
      [req.params.id]
    );
    if (lastUserMsg.rows.length === 0) return res.status(404).json({ error: 'No user message found' });

    res.json({ conversationId: parseInt(req.params.id), regenerateFrom: lastUserMsg.rows[0].content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MESSAGE EDITING ============

app.put('/api/conversations/:convId/messages/:msgId', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2', [req.params.convId, req.user.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const msg = await pool.query(
      'UPDATE "Message" SET content = $1 WHERE id = $2 AND "conversationId" = $3 AND role = \'user\' RETURNING id, content',
      [content, req.params.msgId, req.params.convId]
    );
    if (msg.rows.length === 0) return res.status(404).json({ error: 'Message not found or not editable' });

    const deletedMsgs = await pool.query(
      'DELETE FROM "Message" WHERE "conversationId" = $1 AND "createdAt" > (SELECT "createdAt" FROM "Message" WHERE id = $2) RETURNING id',
      [req.params.convId, req.params.msgId]
    );

    res.json({ message: msg.rows[0], deletedCount: deletedMsgs.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONVERSATION BRANCHES ============

app.get('/api/conversations/:id/branches', auth, async (req, res) => {
  try {
    const conv = await pool.query(
      'SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.id]
    );
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const branches = await pool.query(
      'SELECT id, "branchName", "createdAt" FROM "ConversationBranch" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );
    res.json(branches.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/branches', auth, async (req, res) => {
  try {
    const { branchName, parentId } = req.body;
    const conv = await pool.query(
      'SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.id]
    );
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const maxBranch = await pool.query(
      'SELECT MAX(id) as maxId FROM "ConversationBranch" WHERE "conversationId" = $1',
      [req.params.id]
    );
    const nextId = (maxBranch.rows[0]?.maxId || 0) + 1;

    const result = await pool.query(
      'INSERT INTO "ConversationBranch" ("conversationId", "parentId", "branchName") VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, parentId || null, branchName || `Branch ${nextId}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/messages/:branchId', auth, async (req, res) => {
  try {
    const conv = await pool.query(
      'SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.id]
    );
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await pool.query(
      'SELECT id, role, content, citations, "createdAt" FROM "Message" WHERE "conversationId" = $1 AND "branchId" = $2 ORDER BY "createdAt" ASC',
      [req.params.id, req.params.branchId]
    );
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONVERSATION SUMMARY ============

app.post('/api/conversations/:id/summary', auth, async (req, res) => {
  try {
    const conv = await pool.query(
      'SELECT id FROM "Conversation" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.id]
    );
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await pool.query(
      'SELECT role, content FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );

    const conversationText = messages.rows.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

    const summaryRes = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          { role: 'system', content: 'Buat ringkasan percakapan dalam Bahasa Indonesia. Format: 3-5 bullet points yang merangkum poin-poin utama. Gunakan format markdown.' },
          { role: 'user', content: conversationText.slice(0, 8000) },
        ],
        max_tokens: 500,
      }),
    });

    const summaryData = await summaryRes.json();
    const summary = summaryData.choices?.[0]?.message?.content || 'Gagal membuat ringkasan';

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PROMPT TEMPLATES ============

const DEFAULT_TEMPLATES = [
  { name: 'Analisis Data', category: 'Analisis', prompt: 'Analisis data berikut dan berikan insight penting:\n\n{input}' },
  { name: 'Ringkas Dokumen', category: 'Ringkas', prompt: 'Ringkas dokumen berikut dalam 3-5 poin utama:\n\n{input}' },
  { name: 'Terjemahkan', category: 'Terjemah', prompt: 'Terjemahkan teks berikut ke Bahasa Indonesia:\n\n{input}' },
  { name: 'Perbaiki Tulisan', category: 'Edit', prompt: 'Perbaiki tata bahasa dan ejaan teks berikut:\n\n{input}' },
  { name: 'Buat Email', category: 'Email', prompt: 'Buat email profesional untuk:\n\n{input}' },
  { name: 'Buat Kode', category: 'Kode', prompt: 'Buat kode program untuk:\n\n{input}\n\nBerikan penjelasan kode.' },
  { name: 'Brainstorm', category: 'Ide', prompt: 'Brainstorm ide untuk:\n\n{input}\n\nBerikan minimal 5 ide kreatif.' },
  { name: 'Buat Rencana', category: 'Rencana', prompt: 'Buat rencana langkah demi langkah untuk:\n\n{input}' },
];

app.get('/api/templates', auth, async (req, res) => {
  try {
    const userTemplates = await pool.query(
      'SELECT id, name, category, prompt, "createdAt" FROM "PromptTemplate" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.user.id]
    );
    res.json([...DEFAULT_TEMPLATES, ...userTemplates.rows]);
  } catch (err) {
    res.json(DEFAULT_TEMPLATES);
  }
});

app.post('/api/templates', auth, async (req, res) => {
  try {
    const { name, category, prompt } = req.body;
    if (!name || !prompt) return res.status(400).json({ error: 'Name and prompt required' });
    const result = await pool.query(
      'INSERT INTO "PromptTemplate" ("userId", name, category, prompt) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, category || 'Custom', prompt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/templates/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "PromptTemplate" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ IMAGE GENERATION ============

app.post('/api/generate-image', auth, async (req, res) => {
  try {
    const { prompt, size = '512x512' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const billing = await pool.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
    if (!billing.rows[0] || billing.rows[0].tokenBalance < 50) {
      return res.status(402).json({ error: 'Token habis (butuh 50 token)', upgrade_url: '/account/billing' });
    }

    const imageRes = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!imageRes.ok) {
      const fallbackRes = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`);
      if (fallbackRes.ok) {
        const buffer = await fallbackRes.buffer();
        const filename = `img-${Date.now()}.png`;
        const filepath = path.join('/home/giantar1/ai/uploads', filename);
        fs.writeFileSync(filepath, buffer);

        const tokensUsed = 50;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
          const newBalance = Math.max(0, (bal.rows[0]?.tokenBalance || 0) - tokensUsed);
          await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
          await client.query(
            'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'usage', tokensUsed, newBalance, 'Image generation']
          );
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }

        return res.json({ url: `/uploads/${filename}`, prompt, tokensUsed });
      }
      return res.status(500).json({ error: 'Gagal generate gambar' });
    }

    const buffer = await imageRes.buffer();
    const filename = `img-${Date.now()}.png`;
    const filepath = path.join('/home/giantar1/ai/uploads', filename);
    fs.writeFileSync(filepath, buffer);

    const tokensUsed = 50;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
      const newBalance = Math.max(0, (bal.rows[0]?.tokenBalance || 0) - tokensUsed);
      await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
      await client.query(
        'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'usage', tokensUsed, newBalance, 'Image generation']
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    res.json({ url: `/uploads/${filename}`, prompt, tokensUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CODE EXECUTION ============

app.post('/api/execute-code', auth, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const { execSync } = require('child_process');
    const tmpFile = path.join('/tmp', `code-${Date.now()}.${language === 'python' ? 'py' : 'js'}`);
    let output = '';
    let error = '';

    try {
      fs.writeFileSync(tmpFile, code);

      if (language === 'python') {
        output = execSync(`python3 ${tmpFile} 2>&1`, { timeout: 10000, encoding: 'utf-8' });
      } else if (language === 'javascript') {
        output = execSync(`node ${tmpFile} 2>&1`, { timeout: 10000, encoding: 'utf-8' });
      } else {
        return res.status(400).json({ error: 'Hanya JavaScript dan Python yang didukung' });
      }
    } catch (err) {
      error = err.stderr || err.message || 'Execution failed';
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }

    res.json({ output: output || '', error });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MODEL COMPARISON ============

app.post('/api/compare-models', auth, async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt || !model) return res.status(400).json({ error: 'Prompt and model required' });

    const aiRes = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Kamu adalah asisten AI yang membantu dalam Bahasa Indonesia.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await aiRes.json();
    const response = data.choices?.[0]?.message?.content || 'Tidak ada response';
    res.json({ response, model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ IMAGE ANALYSIS ============

app.post('/api/analyze-image', auth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image required' });

    const billing = await pool.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
    if (!billing.rows[0] || billing.rows[0].tokenBalance < 20) {
      return res.status(402).json({ error: 'Token habis (butuh 20 token)' });
    }

    const aiRes = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analisis gambar ini. Jika ada teks, lakukan OCR dan tulis teksnya. Berikan deskripsi lengkap dalam Bahasa Indonesia.' },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await aiRes.json();
    const description = data.choices?.[0]?.message?.content || 'Tidak dapat menganalisis gambar';

    const tokensUsed = 20;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
      const newBalance = Math.max(0, (bal.rows[0]?.tokenBalance || 0) - tokensUsed);
      await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
      await client.query(
        'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'usage', tokensUsed, newBalance, 'Image analysis']
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    res.json({ description, tokensUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONVERSATION COMMENTS ============

app.get('/api/conversations/:id/comments', auth, async (req, res) => {
  try {
    const comments = await pool.query(
      `SELECT c.id, c.content, c."createdAt", u.name as "userName"
       FROM "ConversationComment" c
       JOIN "User" u ON c."userId" = u.id
       WHERE c."conversationId" = $1
       ORDER BY c."createdAt" ASC`,
      [req.params.id]
    );
    res.json(comments.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/conversations/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const result = await pool.query(
      'INSERT INTO "ConversationComment" ("conversationId", "userId", content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ANALYTICS ============

app.get('/api/analytics/usage', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalConversations = await pool.query(
      'SELECT COUNT(*) as count FROM "Conversation" WHERE "userId" = $1',
      [userId]
    );

    const totalMessages = await pool.query(
      'SELECT COUNT(*) as count FROM "Message" m JOIN "Conversation" c ON m."conversationId" = c.id WHERE c."userId" = $1',
      [userId]
    );

    const totalTokens = await pool.query(
      'SELECT COALESCE(SUM("tokensUsed"), 0) as total FROM "Message" m JOIN "Conversation" c ON m."conversationId" = c.id WHERE c."userId" = $1',
      [userId]
    );

    const tokenUsage = await pool.query(
      `SELECT DATE("createdAt") as date, SUM(amount) as used
       FROM "TokenLedger" WHERE "userId" = $1 AND type = 'usage'
       GROUP BY DATE("createdAt") ORDER BY date DESC LIMIT 30`,
      [userId]
    );

    const agentUsage = await pool.query(
      `SELECT a.name, COUNT(ac.id) as conversations
       FROM "AgentConversation" ac
       JOIN "Agent" a ON ac."agentId" = a.id
       WHERE ac."userId" = $1
       GROUP BY a.name ORDER BY conversations DESC LIMIT 5`,
      [userId]
    );

    const recentActivity = await pool.query(
      `SELECT m."createdAt", m.role, LEFT(m.content, 100) as preview
       FROM "Message" m
       JOIN "Conversation" c ON m."conversationId" = c.id
       WHERE c."userId" = $1
       ORDER BY m."createdAt" DESC LIMIT 10`,
      [userId]
    );

    const billing = await pool.query(
      'SELECT "tokenBalance", plan, "trialTokens" FROM "UserBilling" WHERE "userId" = $1',
      [userId]
    );

    res.json({
      totalConversations: parseInt(totalConversations.rows[0].count),
      totalMessages: parseInt(totalMessages.rows[0].count),
      totalTokens: parseInt(totalTokens.rows[0].total),
      tokenUsage: tokenUsage.rows,
      agentUsage: agentUsage.rows,
      recentActivity: recentActivity.rows,
      billing: billing.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ WEBHOOKS ============

app.get('/api/webhooks', auth, async (req, res) => {
  try {
    const webhooks = await pool.query(
      'SELECT id, name, type, url, active, "createdAt" FROM "Webhook" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.user.id]
    );
    res.json(webhooks.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/webhooks', auth, async (req, res) => {
  try {
    const { name, type, url } = req.body;
    if (!name || !type || !url) return res.status(400).json({ error: 'Name, type, and url required' });

    const validTypes = ['slack', 'discord', 'email'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid webhook type' });

    const result = await pool.query(
      'INSERT INTO "Webhook" ("userId", name, type, url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, type, url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/webhooks/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Webhook" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhooks/:id/test', auth, async (req, res) => {
  try {
    const webhook = await pool.query(
      'SELECT * FROM "Webhook" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.id]
    );
    if (webhook.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

    const wh = webhook.rows[0];
    let payload = {};

    if (wh.type === 'slack') {
      payload = { text: 'Test from Tara AI', username: 'Tara Bot' };
    } else if (wh.type === 'discord') {
      payload = { content: 'Test from Tara AI' };
    } else if (wh.type === 'email') {
      payload = { to: wh.url, subject: 'Tara AI Test', body: 'Test notification from Tara AI' };
    }

    try {
      await fetch(wh.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      res.json({ ok: true, message: 'Webhook tested successfully' });
    } catch (err) {
      res.json({ ok: false, message: 'Webhook test failed: ' + err.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ USER MEMORY ============

app.get('/api/memory', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, key, value, "createdAt" FROM "UserMemory" WHERE "userId" = $1 ORDER BY "updatedAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memory', auth, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ error: 'Key and value required' });
    const result = await pool.query(
      'INSERT INTO "UserMemory" ("userId", key, value) VALUES ($1, $2, $3) ON CONFLICT ("userId", key) DO UPDATE SET value = $3, "updatedAt" = NOW() RETURNING *',
      [req.user.id, key.trim(), value.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/memory/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "UserMemory" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getUserMemory(userId) {
  try {
    const result = await pool.query(
      'SELECT key, value FROM "UserMemory" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 20',
      [userId]
    );
    if (result.rows.length === 0) return '';
    return 'Informasi tentang pengguna:\n' + result.rows.map(m => `- ${m.key}: ${m.value}`).join('\n');
  } catch {
    return '';
  }
}

async function extractMemories(userId, message, aiResponse, conversationId) {
  try {
    const res = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': 'Tara AI',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: `Extract key facts about the user from this conversation. Return ONLY a JSON array of objects with "key" and "value" fields. Examples: [{"key": "nama", "value": "Budi"}, {"key": "pekerjaan", "value": "Software Engineer"}]. Return empty array [] if no memorable facts found.`
          },
          {
            role: 'user',
            content: `User: ${message}\nAI: ${aiResponse.slice(0, 500)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '[]';
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      const memories = JSON.parse(match[0]);
      for (const m of memories) {
        if (m.key && m.value) {
          await pool.query(
            'INSERT INTO "UserMemory" ("userId", key, value, "sourceConversationId") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", key) DO UPDATE SET value = $3, "updatedAt" = NOW()',
            [userId, m.key, m.value, conversationId]
          );
        }
      }
    }
  } catch {}
}

// ============ CHAT ============

app.post('/api/chat', auth, async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    let convId = conversationId;
    if (!convId) {
      const result = await pool.query(
        'INSERT INTO "Conversation" ("userId", title) VALUES ($1, $2) RETURNING id',
        [req.user.id, message.slice(0, 50)]
      );
      convId = result.rows[0].id;
    }

    await pool.query(
      'INSERT INTO "Message" ("conversationId", role, content) VALUES ($1, $2, $3)',
      [convId, 'user', message]
    );

    const sources = await pool.query(
      'SELECT name, content FROM "Source" WHERE "userId" = $1 LIMIT 5',
      [req.user.id]
    );

    const systemPrompt = `Kamu adalah Tara, asisten AI yang membantu pengguna Giantara ecosystem.

IDENTITAS:
- Nama: Tara
- Bahasa: Indonesia & English
- Sifat: Ramah, profesional, membantu

KAPABILITAS:
1. Mengelola domain giantara.web.id
2. Menganalisis dokumen yang diupload
3. Membuat reminder dari #input commands

ATURAN:
- Selalu respon dalam JSON format
- Jika permintaan ambigu, tampilkan pilihan (clarification)
- Gunakan citation jika menjawab dari dokumen
- Jangan pernah mengarang informasi`;

    const contextMessages = [{ role: 'system', content: systemPrompt }];

    if (sources.rows.length > 0) {
      const sourceContext = sources.rows.map(s => `[${s.name}]: ${s.content?.slice(0, 2000) || ''}`).join('\n\n');
      contextMessages.push({ role: 'system', content: `Dokumen yang tersedia:\n${sourceContext}` });
    }

    const history = await pool.query(
      'SELECT role, content FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC LIMIT 20',
      [convId]
    );
    contextMessages.push(...history.rows.map(m => ({ role: m.role, content: m.content })));

    const aiResponse = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': 'Tara AI',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v4-0324',
        messages: contextMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    await pool.query(
      'INSERT INTO "Message" ("conversationId", role, content) VALUES ($1, $2, $3)',
      [convId, 'assistant', reply]
    );

    await pool.query('UPDATE "Conversation" SET "updatedAt" = NOW() WHERE id = $1', [convId]);

    res.json({ conversationId: convId, content: reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CHAT STREAMING (SSE) ============

app.post('/api/chat/stream', auth, async (req, res) => {
  try {
    const { conversationId, message, focusMode, regenerate } = req.body;

    let convId = conversationId;
    let actualMessage = message;

    if (regenerate && convId) {
      const lastAssistant = await pool.query(
        'SELECT id FROM "Message" WHERE "conversationId" = $1 AND role = $2 ORDER BY "createdAt" DESC LIMIT 1',
        [convId, 'assistant']
      );
      if (lastAssistant.rows.length > 0) {
        await pool.query('DELETE FROM "Message" WHERE id = $1', [lastAssistant.rows[0].id]);
      }
      const lastUserMsg = await pool.query(
        'SELECT content FROM "Message" WHERE "conversationId" = $1 AND role = $2 ORDER BY "createdAt" DESC LIMIT 1',
        [convId, 'user']
      );
      if (lastUserMsg.rows.length > 0) {
        actualMessage = lastUserMsg.rows[0].content;
      }
    }

    if (!actualMessage) return res.status(400).json({ error: 'Message required' });

    if (!convId) {
      const result = await pool.query(
        'INSERT INTO "Conversation" ("userId", title) VALUES ($1, $2) RETURNING id',
        [req.user.id, actualMessage.slice(0, 50)]
      );
      convId = result.rows[0].id;
    }

    if (!regenerate) {
      await pool.query(
        'INSERT INTO "Message" ("conversationId", role, content) VALUES ($1, $2, $3)',
        [convId, 'user', actualMessage]
      );
    }

    const sources = await pool.query(
      'SELECT name, content FROM "Source" WHERE "userId" = $1 LIMIT 5',
      [req.user.id]
    );

    // Web search
    const searchResult = await tavilySearch(actualMessage, focusMode);
    const searchContext = buildSearchContext(searchResult);
    const citations = extractCitations(searchResult);

    const systemPrompt = `Kamu adalah Tara, asisten AI yang membantu pengguna Giantara ecosystem.

IDENTITAS:
- Nama: Tara
- Bahasa: Indonesia & English
- Sifat: Ramah, profesional, membantu

KAPABILITAS:
1. Menjawab pertanyaan umum dengan informasi terkini dari web
2. Menganalisis dokumen yang diupload
3. Membuat reminder dari #input commands

ATURAN:
- Gunakan informasi dari hasil pencarian web jika tersedia
- Sertakan nomor referensi [1], [2], [3] untuk sumber web yang digunakan
- Jika permintaan ambigu, tampilkan pilihan (clarification)
- Jangan pernah mengarang informasi`;

    const contextMessages = [{ role: 'system', content: systemPrompt }];

    // Inject user memory
    const userMemory = await getUserMemory(req.user.id);
    if (userMemory) {
      contextMessages.push({ role: 'system', content: userMemory });
    }

    if (searchContext) {
      contextMessages.push({ role: 'system', content: `Hasil pencarian web:\n${searchContext}` });
    }

    if (sources.rows.length > 0) {
      const sourceContext = sources.rows.map(s => `[${s.name}]: ${s.content?.slice(0, 2000) || ''}`).join('\n\n');
      contextMessages.push({ role: 'system', content: `Dokumen yang tersedia:\n${sourceContext}` });
    }

    const history = await pool.query(
      'SELECT role, content FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC LIMIT 20',
      [convId]
    );
    contextMessages.push(...history.rows.map(m => ({ role: m.role, content: m.content })));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const aiResponse = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': 'Tara AI',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v4-0324',
        messages: contextMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      res.write(`event: error\ndata: ${JSON.stringify({ error: `AI error ${aiResponse.status}: ${errText}` })}\n\n`);
      res.end();
      return;
    }

    let fullContent = '';
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        } catch {}
      }
    }

    const files = await extractAndSaveFiles(fullContent, req.user.id, null, convId);

    await pool.query(
      'INSERT INTO "Message" ("conversationId", role, content, citations) VALUES ($1, $2, $3, $4)',
      [convId, 'assistant', fullContent, JSON.stringify(citations)]
    );
    await pool.query('UPDATE "Conversation" SET "updatedAt" = NOW() WHERE id = $1', [convId]);

    const relatedQuestions = await generateRelatedQuestions(actualMessage, fullContent, searchResult);

    // Extract memories in background
    extractMemories(req.user.id, actualMessage, fullContent, convId).catch(() => {});

    res.write(`event: done\ndata: ${JSON.stringify({ conversationId: convId, content: fullContent, files, citations, relatedQuestions })}\n\n`);
    res.end();
  } catch (err) {
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } catch {}
  }
});

app.post('/api/agents/chat/stream', auth, async (req, res) => {
  try {
    const { agentId, conversationId, message, focusMode, regenerate } = req.body;

    const billing = await pool.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
    if (!billing.rows[0] || billing.rows[0].tokenBalance <= 0) {
      return res.status(402).json({ error: 'Token habis', upgrade_url: '/account/billing' });
    }

    const agent = await pool.query(
      'SELECT * FROM "Agent" WHERE id = $1 AND ("userId" = $2 OR "isDefault" = TRUE) AND "isActive" = TRUE',
      [agentId, req.user.id]
    );
    if (!agent.rows[0]) return res.status(404).json({ error: 'Agent not found' });

    const agentConfig = agent.rows[0];

    let convId = conversationId;
    let actualMessage = message;

    if (regenerate && convId) {
      const lastAssistant = await pool.query(
        'SELECT id FROM "AgentMessage" WHERE "conversationId" = $1 AND role = $2 ORDER BY "createdAt" DESC LIMIT 1',
        [convId, 'assistant']
      );
      if (lastAssistant.rows.length > 0) {
        await pool.query('DELETE FROM "AgentMessage" WHERE id = $1', [lastAssistant.rows[0].id]);
      }
      const lastUserMsg = await pool.query(
        'SELECT content FROM "AgentMessage" WHERE "conversationId" = $1 AND role = $2 ORDER BY "createdAt" DESC LIMIT 1',
        [convId, 'user']
      );
      if (lastUserMsg.rows.length > 0) {
        actualMessage = lastUserMsg.rows[0].content;
      }
    }

    if (!actualMessage || !agentId) return res.status(400).json({ error: 'Agent ID and message required' });

    if (!convId) {
      const conv = await pool.query(
        'INSERT INTO "AgentConversation" ("agentId", "userId", title) VALUES ($1, $2, $3) RETURNING id',
        [agentId, req.user.id, actualMessage.slice(0, 50)]
      );
      convId = conv.rows[0].id;
    }

    if (!regenerate) {
      await pool.query(
      'INSERT INTO "AgentMessage" ("conversationId", role, content) VALUES ($1, $2, $3)',
      [convId, 'user', actualMessage]
    );

    const history = await pool.query(
      'SELECT role, content FROM "AgentMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC LIMIT 20',
      [convId]
    );

    // Web search
    const searchResult = await tavilySearch(actualMessage, focusMode);
    const searchContext = buildSearchContext(searchResult);
    const citations = extractCitations(searchResult);

    const messages = [
      { role: 'system', content: agentConfig.systemPrompt },
    ];

    // Inject user memory
    const userMemory = await getUserMemory(req.user.id);
    if (userMemory) {
      messages.push({ role: 'system', content: userMemory });
    }

    if (searchContext) {
      messages.push({ role: 'system', content: `Hasil pencarian web:\n${searchContext}\n\nGunakan nomor referensi [1], [2], [3] untuk sumber web yang digunakan.` });
    }

    messages.push(...history.rows);
    messages.push({ role: 'user', content: actualMessage });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const aiRes = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': `Tara AI - ${agentConfig.name}`,
      },
      body: JSON.stringify({
        model: agentConfig.model,
        messages,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.maxTokens || 4096,
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      res.write(`event: error\ndata: ${JSON.stringify({ error: `AI error ${aiRes.status}: ${errText}` })}\n\n`);
      res.end();
      return;
    }

    let fullContent = '';
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        } catch {}
      }
    }

    const files = await extractAndSaveFiles(fullContent, req.user.id, agentId, convId);
    const tokensUsed = 0;

    await pool.query(
      'INSERT INTO "AgentMessage" ("conversationId", role, content, "outputFiles", "tokensUsed", citations) VALUES ($1, $2, $3, $4, $5, $6)',
      [convId, 'assistant', fullContent, JSON.stringify(files), tokensUsed, JSON.stringify(citations)]
    );
    await pool.query('UPDATE "AgentConversation" SET "updatedAt" = NOW() WHERE id = $1', [convId]);

    if (tokensUsed > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
        const newBalance = Math.max(0, (bal.rows[0]?.tokenBalance || 0) - tokensUsed);
        await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
        await client.query(
          'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
          [req.user.id, 'usage', tokensUsed, newBalance, `Agent chat: ${agentConfig.name}`]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    }

    const relatedQuestions = await generateRelatedQuestions(actualMessage, fullContent, searchResult);

    // Extract memories in background
    extractMemories(req.user.id, actualMessage, fullContent, convId).catch(() => {});

    res.write(`event: done\ndata: ${JSON.stringify({ conversationId: convId, content: fullContent, files, citations, relatedQuestions })}\n\n`);
    res.end();
  } catch (err) {
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } catch {}
  }
});

// ============ SOURCES ============

app.get('/api/sources', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, format, "wordCount", status, "createdAt" FROM "Source" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sources', auth, upload.single('file'), async (req, res) => {
  try {
    let name, format, content;
    if (req.file) {
      name = req.file.originalname;
      format = path.extname(req.file.originalname).slice(1);
      content = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path);
    } else if (req.body.name && req.body.content) {
      name = req.body.name;
      format = 'text';
      content = req.body.content;
    } else {
      return res.status(400).json({ error: 'File or text content required' });
    }
    const wordCount = content.split(/\s+/).length;
    const result = await pool.query(
      'INSERT INTO "Source" ("userId", name, format, content, "wordCount", status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, format, "wordCount", status',
      [req.user.id, name, format, content, wordCount, 'ready']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Source" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENTS ============

app.get('/api/agents', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.name, a.icon, a.model, a.temperature, a."maxTokens", a."isDefault", a."isTemplate", a."systemPrompt",
       COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
       FROM "Agent" a
       LEFT JOIN "AgentTag" at2 ON a.id = at2."agentId"
       LEFT JOIN "Tag" t ON at2."tagId" = t.id
       WHERE (a."userId" = $1 OR a."isDefault" = TRUE) AND a."isActive" = TRUE
       GROUP BY a.id ORDER BY a."isDefault" DESC, a.name ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents', auth, async (req, res) => {
  try {
    const { name, icon, model, temperature, maxTokens, systemPrompt } = req.body;
    if (!name || !systemPrompt) return res.status(400).json({ error: 'Name and system prompt required' });
    const result = await pool.query(
      'INSERT INTO "Agent" ("userId", name, icon, model, temperature, "maxTokens", "systemPrompt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, name, icon || '🤖', model || 'deepseek/deepseek-v4-flash', temperature || 0.7, maxTokens || 4096, systemPrompt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/agents/:id', auth, async (req, res) => {
  try {
    const { name, icon, model, temperature, maxTokens, systemPrompt } = req.body;
    const result = await pool.query(
      'UPDATE "Agent" SET name = COALESCE($1, name), icon = COALESCE($2, icon), model = COALESCE($3, model), temperature = COALESCE($4, temperature), "maxTokens" = COALESCE($5, "maxTokens"), "systemPrompt" = COALESCE($6, "systemPrompt"), "updatedAt" = NOW() WHERE id = $7 AND "userId" = $8 AND "isDefault" = FALSE RETURNING *',
      [name, icon, model, temperature, maxTokens, systemPrompt, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or cannot edit default agent' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agents/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE "Agent" SET "isActive" = FALSE WHERE id = $1 AND "userId" = $2 AND "isDefault" = FALSE RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or cannot delete default agent' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENT CONVERSATIONS ============

app.get('/api/agents/:agentId/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, "createdAt", "updatedAt" FROM "AgentConversation" WHERE "agentId" = $1 AND "userId" = $2 ORDER BY "updatedAt" DESC',
      [req.params.agentId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents/:agentId/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO "AgentConversation" ("agentId", "userId", title) VALUES ($1, $2, $3) RETURNING id, title',
      [req.params.agentId, req.user.id, req.body.title || 'New Conversation']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agents/conversations/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "AgentMessage" WHERE "conversationId" = $1', [req.params.id]);
    await pool.query('DELETE FROM "AgentConversation" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agents/conversations/:id/messages', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role, content, "outputFiles", "tokensUsed", "createdAt" FROM "AgentMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENT CHAT ============

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = { '.csv': 'text/csv', '.md': 'text/markdown', '.js': 'text/javascript', '.ts': 'text/typescript', '.py': 'text/x-python', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.sql': 'text/plain', '.txt': 'text/plain' };
  return types[ext] || 'text/plain';
}

async function extractAndSaveFiles(content, userId, agentId, conversationId) {
  const files = [];
  const fileRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = fileRegex.exec(content)) !== null) {
    const filename = match[1].trim();
    const fileContent = match[2];

    const dir = path.join(uploadsPath, 'agent-files', String(userId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, fileContent);

    const dbResult = await pool.query(
      `INSERT INTO "AgentFile" ("userId", "agentId", "conversationId", filename, "mimeType", size, path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, filename`,
      [userId, agentId || null, conversationId || null, filename, getMimeType(filename), fileContent.length, filePath]
    );

    files.push({
      id: dbResult.rows[0].id,
      name: filename,
      size: fileContent.length,
      downloadUrl: `/api/agents/files/${dbResult.rows[0].id}/download`
    });
  }

  return files;
}

app.post('/api/agents/chat', auth, async (req, res) => {
  try {
    const { agentId, conversationId, message } = req.body;
    if (!message || !agentId) return res.status(400).json({ error: 'Agent ID and message required' });

    // Check token balance
    const billing = await pool.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
    if (!billing.rows[0] || billing.rows[0].tokenBalance <= 0) {
      return res.status(402).json({ error: 'Token habis', upgrade_url: '/account/billing' });
    }

    // Get agent config
    const agent = await pool.query(
      'SELECT * FROM "Agent" WHERE id = $1 AND ("userId" = $2 OR "isDefault" = TRUE) AND "isActive" = TRUE',
      [agentId, req.user.id]
    );
    if (!agent.rows[0]) return res.status(404).json({ error: 'Agent not found' });

    const agentConfig = agent.rows[0];
    const model = MODEL_CONFIG[agentConfig.model] || { name: agentConfig.model };

    // Create/get conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await pool.query(
        'INSERT INTO "AgentConversation" ("agentId", "userId", title) VALUES ($1, $2, $3) RETURNING id',
        [agentId, req.user.id, message.slice(0, 50)]
      );
      convId = conv.rows[0].id;
    }

    // Save user message
    await pool.query(
      'INSERT INTO "AgentMessage" ("conversationId", role, content) VALUES ($1, $2, $3)',
      [convId, 'user', message]
    );

    // Load conversation history
    const history = await pool.query(
      'SELECT role, content FROM "AgentMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC LIMIT 20',
      [convId]
    );

    // Call OpenRouter
    const aiRes = await fetch(process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://ai.giantara.web.id',
        'X-Title': `Tara AI - ${agentConfig.name}`,
      },
      body: JSON.stringify({
        model: agentConfig.model,
        messages: [
          { role: 'system', content: agentConfig.systemPrompt },
          ...history.rows,
          { role: 'user', content: message }
        ],
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.maxTokens || 4096,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      throw new Error(`AI error ${aiRes.status}: ${errBody}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Extract files
    const files = await extractAndSaveFiles(content, req.user.id, agentId, convId);

    // Save AI response
    await pool.query(
      'INSERT INTO "AgentMessage" ("conversationId", role, content, "outputFiles", "tokensUsed") VALUES ($1, $2, $3, $4, $5)',
      [convId, 'assistant', content, JSON.stringify(files), tokensUsed]
    );

    // Deduct tokens (basic: 1 token per token used)
    if (tokensUsed > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
        const newBalance = Math.max(0, (bal.rows[0]?.tokenBalance || 0) - tokensUsed);
        await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
        await client.query(
          'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
          [req.user.id, 'usage', tokensUsed, newBalance, `Agent chat: ${agentConfig.name}`]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    }

    // Update conversation timestamp
    await pool.query('UPDATE "AgentConversation" SET "updatedAt" = NOW() WHERE id = $1', [convId]);

    res.json({ conversationId: convId, content, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENT FILES ============

app.get('/api/agents/files', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT f.id, f.filename, f."mimeType", f.size, f."createdAt", a.name as "agentName" FROM "AgentFile" f LEFT JOIN "Agent" a ON f."agentId" = a.id WHERE f."userId" = $1 ORDER BY f."createdAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agents/files/:id/download', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "AgentFile" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const file = result.rows[0];
    if (!fs.existsSync(file.path)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(file.path, file.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agents/files/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT path FROM "AgentFile" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    if (result.rows.length > 0 && fs.existsSync(result.rows[0].path)) {
      fs.unlinkSync(result.rows[0].path);
    }
    await pool.query('DELETE FROM "AgentFile" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENT CLONE (TEMPLATE SYSTEM) ============

app.post('/api/agents/:id/clone', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO "Agent" ("userId", name, icon, model, temperature, "maxTokens", "systemPrompt", "isTemplate") SELECT $1, name, icon, model, temperature, "maxTokens", "systemPrompt", FALSE FROM "Agent" WHERE id = $2 AND ("userId" = $3 OR "isDefault" = TRUE) AND "isActive" = TRUE RETURNING *',
      [req.user.id, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TAGS ============

app.get('/api/tags', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.id, t.name, t.color, COUNT(at."agentId")::int as "agentCount" FROM "Tag" t LEFT JOIN "AgentTag" at ON t.id = at."tagId" WHERE t."userId" = $1 GROUP BY t.id ORDER BY t.name',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tags', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = await pool.query(
      'INSERT INTO "Tag" ("userId", name, color) VALUES ($1, $2, $3) ON CONFLICT ("userId", name) DO UPDATE SET color = $3 RETURNING *',
      [req.user.id, name.trim(), color || '#6B7280']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tags/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Tag" WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents/:id/tags', auth, async (req, res) => {
  try {
    const { tagIds } = req.body;
    await pool.query('DELETE FROM "AgentTag" WHERE "agentId" = $1', [req.params.id]);
    for (const tagId of tagIds) {
      await pool.query('INSERT INTO "AgentTag" ("agentId", "tagId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, tagId]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SHARED LINKS ============

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

app.post('/api/shared', auth, async (req, res) => {
  try {
    const { conversationId, title } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' });

    const conv = await pool.query(
      'SELECT id FROM "AgentConversation" WHERE id = $1 AND "userId" = $2',
      [conversationId, req.user.id]
    );
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const token = generateToken();
    const result = await pool.query(
      'INSERT INTO "SharedLink" ("userId", "conversationId", token, title) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, conversationId, token, title || 'Hasil Agent Tara AI']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shared', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sl.id, sl.token, sl.title, sl."createdAt", sl.views, sl."conversationId" FROM "SharedLink" sl WHERE sl."userId" = $1 ORDER BY sl."createdAt" DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shared/:token', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM "SharedLink" WHERE token = $1 AND "userId" = $2', [req.params.token, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shared/:token', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sl.*, u.name as "authorName" FROM "SharedLink" sl JOIN "User" u ON sl."userId" = u.id WHERE sl.token = $1',
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Link tidak ditemukan atau sudah dihapus' });

    const link = result.rows[0];
    await pool.query('UPDATE "SharedLink" SET views = views + 1 WHERE token = $1', [req.params.token]);

    const messages = await pool.query(
      'SELECT role, content, "outputFiles", "createdAt" FROM "AgentMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [link.conversationId]
    );

    res.json({
      title: link.title,
      authorName: link.authorName,
      createdAt: link.createdAt,
      views: link.views + 1,
      messages: messages.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TOKENS & BILLING ============

app.get('/api/account/billing', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
    if (result.rows.length === 0) {
      // Create billing if not exists
      await pool.query(
        'INSERT INTO "UserBilling" ("userId", plan, "tokenBalance", "trialTokens") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId") DO NOTHING',
        [req.user.id, 'trial', 10000, 10000]
      );
      const newResult = await pool.query('SELECT * FROM "UserBilling" WHERE "userId" = $1', [req.user.id]);
      return res.json(newResult.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/account/tokens/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, type, amount, balance, description, "createdAt" FROM "TokenLedger" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/account/usage', auth, async (req, res) => {
  try {
    const today = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM "TokenLedger" WHERE "userId" = $1 AND type = \'usage\' AND "createdAt" >= CURRENT_DATE',
      [req.user.id]
    );
    const week = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM "TokenLedger" WHERE "userId" = $1 AND type = \'usage\' AND "createdAt" >= CURRENT_DATE - INTERVAL \'7 days\'',
      [req.user.id]
    );
    const month = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM "TokenLedger" WHERE "userId" = $1 AND type = \'usage\' AND "createdAt" >= CURRENT_DATE - INTERVAL \'30 days\'',
      [req.user.id]
    );
    res.json({
      today: parseInt(today.rows[0].total),
      week: parseInt(week.rows[0].total),
      month: parseInt(month.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PAYMENTS (MIDTRANS) ============

const TOKEN_PACKAGES = [
  { id: 'starter', name: 'Starter', tokens: 25000, price: 19000, bonus: 0 },
  { id: 'basic', name: 'Basic', tokens: 50000, price: 35000, bonus: 0 },
  { id: 'popular', name: 'Populer', tokens: 100000, price: 69000, bonus: 10000 },
  { id: 'pro', name: 'Pro', tokens: 250000, price: 149000, bonus: 25000 },
  { id: 'premium', name: 'Premium', tokens: 500000, price: 249000, bonus: 50000 },
  { id: 'enterprise', name: 'Enterprise', tokens: 1000000, price: 499000, bonus: 100000 },
];

app.get('/api/payments/packages', (req, res) => {
  res.json(TOKEN_PACKAGES);
});

app.post('/api/payments/create', auth, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    const orderId = `TARA-${Date.now()}-${req.user.id}`;

    // Save transaction
    await pool.query(
      'INSERT INTO "PaymentTransaction" ("userId", "paymentProvider", "orderId", amount, "tokensGranted", status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'midtrans', orderId, pkg.price, pkg.tokens + pkg.bonus, 'pending']
    );

    // Midtrans Snap integration (if configured)
    if (process.env.MIDTRANS_SERVER_KEY) {
      const midtransClient = require('midtrans-client');
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
      });

      const parameter = {
        transaction_details: { order_id: orderId, gross_amount: pkg.price },
        customer_details: { email: req.user.email, name: req.user.name },
        callbacks: { finish: `${process.env.APP_URL || 'https://ai.giantara.web.id'}/account/billing` },
      };

      const transaction = await snap.createTransaction(parameter);
      return res.json({ orderId, paymentUrl: transaction.redirect_url, token: transaction.token });
    }

    // Fallback: direct token grant (for testing)
    await pool.query('UPDATE "PaymentTransaction" SET status = $1 WHERE "orderId" = $2', ['paid', orderId]);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [req.user.id]);
      const newBalance = (bal.rows[0]?.tokenBalance || 0) + pkg.tokens + pkg.bonus;
      await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, req.user.id]);
      await client.query(
        'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'purchase', pkg.tokens + pkg.bonus, newBalance, `Top-up: ${pkg.name} (${pkg.tokens + pkg.bonus} token)`]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    res.json({ orderId, status: 'paid', tokenBalance: (await pool.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1', [req.user.id])).rows[0].tokenBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/callback', async (req, res) => {
  try {
    const { order_id, transaction_status, fraud_status } = req.body;

    if (transaction_status === 'capture' && fraud_status === 'accept') {
      const payment = await pool.query(
        'UPDATE "PaymentTransaction" SET status = $1, "providerResponse" = $2, "updatedAt" = NOW() WHERE "orderId" = $3 RETURNING *',
        ['paid', req.body, order_id]
      );

      if (payment.rows[0]) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const bal = await client.query('SELECT "tokenBalance" FROM "UserBilling" WHERE "userId" = $1 FOR UPDATE', [payment.rows[0].userId]);
          const newBalance = (bal.rows[0]?.tokenBalance || 0) + payment.rows[0].tokensGranted;
          await client.query('UPDATE "UserBilling" SET "tokenBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [newBalance, payment.rows[0].userId]);
          await client.query(
            'INSERT INTO "TokenLedger" ("userId", type, amount, balance, description) VALUES ($1, $2, $3, $4, $5)',
            [payment.rows[0].userId, 'purchase', payment.rows[0].tokensGranted, newBalance, `Top-up: ${payment.rows[0].tokensGranted} token`]
          );
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ACCOUNT ============

app.get('/api/account/profile', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, "createdAt", "isAdmin" FROM "User" WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/account/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      'UPDATE "User" SET name = COALESCE($1, name), email = COALESCE($2, email), "updatedAt" = NOW() WHERE id = $3 RETURNING id, email, name',
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/account/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    const user = await pool.query('SELECT password FROM "User" WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ SPA FALLBACK ============

if (fs.existsSync(distPath)) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ============ START ============

const server = app.listen(PORT, () => {
  console.log(`Tara AI API running on port ${PORT}`);
});
server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
