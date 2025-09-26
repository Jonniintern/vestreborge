const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Sikkerhet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true
}));

// Multer for fileopplasting
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Kun PNG-filer er tillatt'), false);
    }
  }
});

// Servér statiske filer
app.use(express.static('public'));
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Opprett nødvendige mapper
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database setup
const dbPath = path.join(__dirname, 'etiketter.db');
const db = new Database(dbPath);

// Opprett tabeller
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    hide_fixed INTEGER NOT NULL DEFAULT 0,
    stickers_used INTEGER NOT NULL DEFAULT 0,
    template_used TEXT DEFAULT 'egen',
    template_name TEXT DEFAULT 'Egen',
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT
  )
`);

// E-post konfiguration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const transporter = process.env.SMTP_USER ? nodemailer.createTransporter(emailConfig) : null;

// Hovedrute - servér index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API for å motta etiketter
app.post('/api/submit-label', upload.single('image'), async (req, res) => {
  try {
    // Validering
    const { title, name, phone, hideFixed, stickers_used, template_used, template_name, timestamp } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Mangler bildefil' });
    }
    
    if (!title || !name || !phone) {
      return res.status(400).json({ error: 'Alle felt må fylles ut' });
    }

    // Lagre fil
    const fileExtension = '.png';
    const timestamp_clean = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `etikett-${title.replace(/[^a-zA-Z0-9æøå]/g, '-')}-${timestamp_clean}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, req.file.buffer);

    // Lagre i database
    const stmt = db.prepare(`
      INSERT INTO submissions (created_at, title, name, phone, hide_fixed, stickers_used, template_used, template_name, file_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      new Date().toISOString(),
      title,
      name,
      phone,
      hideFixed === 'true' ? 1 : 0,
      parseInt(stickers_used) || 0,
      template_used || 'egen',
      template_name || 'Egen',
      filePath,
      'pending'
    );

    // Send e-post varsling hvis konfigurert
    if (transporter && process.env.NOTIFICATION_EMAIL) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.NOTIFICATION_EMAIL,
          subject: `Ny etikett bestilling: ${title}`,
          html: `
            <h2>📝 Ny etikett bestilling</h2>
            <p><strong>Produkt:</strong> ${title}</p>
            <p><strong>Kunde:</strong> ${name}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <p><strong>Mal brukt:</strong> ${template_name || 'Egen'}</p>
            <p><strong>Klistremerker brukt:</strong> ${stickers_used || 0}</p>
            <p><strong>Fast felt skjult:</strong> ${hideFixed === 'true' ? 'Ja' : 'Nei'}</p>
            <p><strong>Bestilling ID:</strong> #${result.lastInsertRowid}</p>
            <p><strong>Tidspunkt:</strong> ${new Date().toLocaleString('no-NO')}</p>
            
            <p>Se vedlagt etikett for utskrift.</p>
            
            <hr>
            <p><em>Fra Vestre Borge Gård Etikett-generator</em></p>
          `,
          attachments: [{
            filename: filename,
            path: filePath
          }]
        });
      } catch (emailError) {
        console.error('E-post feil:', emailError);
        // Ikke stopp prosessen hvis e-post feiler
      }
    }

    res.json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: 'Etikett mottatt! Vi tar kontakt for utskrift.',
      filename: filename
    });

  } catch (error) {
    console.error('Server feil:', error);
    res.status(500).json({ 
      error: 'Intern server feil', 
      message: error.message 
    });
  }
});

// API for å liste bestillinger (for admin)
app.get('/api/submissions', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const submissions = db.prepare(`
      SELECT id, created_at, title, name, phone, hide_fixed, stickers_used, template_used, template_name, status, notes
      FROM submissions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
    
    res.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API for å oppdatere bestillingsstatus
app.put('/api/submissions/:id', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['pending', 'processing', 'printed', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ugyldig status' });
    }
    
    const stmt = db.prepare('UPDATE submissions SET status = ?, notes = ? WHERE id = ?');
    const result = stmt.run(status || null, notes || null, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bestilling ikke funnet' });
    }
    
    res.json({ success: true, message: 'Bestilling oppdatert' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servér opplastede filer (kun for admin)
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Fil ikke funnet' });
  }
});

// Helsesjekk
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Feilhåndtering
app.use((error, req, res, next) => {
  console.error('Uventet feil:', error);
  res.status(500).json({ 
    error: 'Intern server feil',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Noe gikk galt'
  });
});

// 404 håndtering
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint ikke funnet' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Vestre Borge Etikett-generator kjører på http://localhost:${PORT}`);
  console.log(`📧 E-post varsling: ${transporter ? 'Aktivert' : 'Deaktivert'}`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server stopper...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server stopper...');
  db.close();
  process.exit(0);
});

module.exports = app;