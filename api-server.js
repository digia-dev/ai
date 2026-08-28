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

const uploadsPath = path.join('/home/giantar1/api', 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

const upload = multer({
  dest: uploadsPath,
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    apiKeyPrefix: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 12) + '...' : 'none',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDbHost: !!process.env.DB_HOST
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO "User" (email, name, password) VALUES ($1, $2, $3) RETURNING id', [email, name, hash]);
    const token = jwt.sign({ id: result.rows[0].id, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.rows[0].id, email, name } });
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
      const errBody = await aiResponse.text();
      throw new Error(`AI error: ${aiResponse.status} - ${errBody}`);
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

const server = app.listen(PORT, () => {
  console.log('Tara AI API running on port ' + PORT);
});
server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
