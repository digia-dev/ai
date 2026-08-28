const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tara-ai-jwt-secret-2026-secure-change-in-production';

// MySQL pool
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER || 'giantar1_tara',
  password: process.env.DB_PASS || 'TaraAI2026Secure!',
  database: process.env.DB_NAME || 'giantar1_tara',
  waitForConnections: true,
  connectionLimit: 5,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// Auth middleware
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

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, name, password) VALUES (?, ?, ?)', [email, name, hash]);

    const token = jwt.sign({ id: result.insertId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.insertId, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, email, name, createdAt FROM users WHERE id = ?', [req.user.id]);
  res.json(rows[0] || null);
});

// ============ CONVERSATION ROUTES ============

app.get('/api/conversations', auth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, createdAt, updatedAt FROM conversations WHERE userId = ? ORDER BY updatedAt DESC',
    [req.user.id]
  );
  res.json(rows);
});

app.post('/api/conversations', auth, async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO conversations (userId, title) VALUES (?, ?)',
    [req.user.id, req.body.title || 'New Chat']
  );
  res.json({ id: result.insertId, title: req.body.title || 'New Chat' });
});

app.delete('/api/conversations/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM messages WHERE conversationId = ? AND conversationId IN (SELECT id FROM conversations WHERE userId = ?)', [req.params.id, req.user.id]);
  await pool.query('DELETE FROM conversations WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ============ MESSAGE ROUTES ============

app.get('/api/conversations/:id/messages', auth, async (req, res) => {
  const [conv] = await pool.query('SELECT id FROM conversations WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  if (conv.length === 0) return res.status(404).json({ error: 'Not found' });

  const [rows] = await pool.query(
    'SELECT id, role, content, metadata, citations, createdAt FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
    [req.params.id]
  );
  res.json(rows);
});

// ============ CHAT ROUTE ============

app.post('/api/chat', auth, async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Ensure conversation exists
    let convId = conversationId;
    if (!convId) {
      const [result] = await pool.query(
        'INSERT INTO conversations (userId, title) VALUES (?, ?)',
        [req.user.id, message.slice(0, 50)]
      );
      convId = result.insertId;
    }

    // Save user message
    await pool.query(
      'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
      [convId, 'user', message]
    );

    // Get sources for context
    const [sources] = await pool.query(
      'SELECT name, content FROM sources WHERE userId = ? LIMIT 5',
      [req.user.id]
    );

    // Build messages for AI
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

    let contextMessages = [{ role: 'system', content: systemPrompt }];

    // Add source context if available
    if (sources.length > 0) {
      const sourceContext = sources.map(s => `[${s.name}]: ${s.content?.slice(0, 2000) || ''}`).join('\n\n');
      contextMessages.push({ role: 'system', content: `Dokumen yang tersedia:\n${sourceContext}` });
    }

    // Get conversation history
    const [history] = await pool.query(
      'SELECT role, content FROM messages WHERE conversationId = ? ORDER BY createdAt ASC LIMIT 20',
      [convId]
    );
    contextMessages.push(...history.map(m => ({ role: m.role, content: m.content })));

    // Call OpenRouter
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
      const err = await aiResponse.json().catch(() => ({}));
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    // Save AI message
    await pool.query(
      'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
      [convId, 'assistant', reply]
    );

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET updatedAt = NOW() WHERE id = ?', [convId]);

    res.json({ conversationId: convId, content: reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SOURCES ROUTES ============

app.get('/api/sources', auth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, format, wordCount, status, createdAt FROM sources WHERE userId = ? ORDER BY createdAt DESC',
    [req.user.id]
  );
  res.json(rows);
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

    const [result] = await pool.query(
      'INSERT INTO sources (userId, name, format, content, wordCount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, format, content, wordCount, 'ready']
    );

    res.json({ id: result.insertId, name, format, wordCount, status: 'ready' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM sources WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ============ SPA FALLBACK ============

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ START ============

app.listen(PORT, () => {
  console.log(`Tara AI running on port ${PORT}`);
});
