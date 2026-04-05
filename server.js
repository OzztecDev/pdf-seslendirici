const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('.'));

const VOICES = {
  tr: ['tr-TR-AhmetNeural', 'tr-TR-EmelNeural'],
  en: ['en-US-AriaNeural', 'en-US-GuyNeural', 'en-GB-SoniaNeural'],
  default: ['tr-TR-AhmetNeural']
};

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

app.post('/api/synthesize', async (req, res) => {
  try {
    const { text, voice = 'tr-TR-AhmetNeural', rate = 'default', pitch = 'default' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Metin bulunamadı' });
    }

    const outputFile = `public/audio_${Date.now()}.mp3`;
    
    const tts = new EdgeTTS({
      voice: voice,
      rate: rate,
      pitch: pitch,
      outputFormat: 'audio-24khz-96kbitrate-mp3'
    });

    await tts.ttsPromise(text, outputFile);

    res.json({ audioUrl: `/${outputFile}` });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/voices', (req, res) => {
  res.json(VOICES);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
