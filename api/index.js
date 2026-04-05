const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/' });

const VOICES = {
  tr: ['tr-TR-AhmetNeural', 'tr-TR-EmelNeural'],
  en: ['en-US-AriaNeural', 'en-US-GuyNeural', 'en-GB-SoniaNeural']
};

module.exports = (req, res) => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.send(200);
    next();
  });

  app.post('/api/extract-text', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'PDF dosyası yüklenmedi' });
      }

      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdf(dataBuffer);

      fs.unlinkSync(req.file.path);

      res.json({ text: data.text });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/voices', (req, res) => {
    res.json(VOICES);
  });

  app(req, res);
};
