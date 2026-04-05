const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text, voice = 'tr-TR-AhmetNeural', rate = 0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Metin bulunamadı' });
    }

    const outputFile = path.join('/tmp', `audio_${Date.now()}.mp3`);

    const tts = new EdgeTTS({
      voice: voice,
      rate: rate >= 0 ? `+${rate}%` : `${rate}%`,
      outputFormat: 'audio-24khz-96kbitrate-mp3'
    });

    await tts.ttsPromise(text, outputFile);

    const audioBuffer = fs.readFileSync(outputFile);
    fs.unlinkSync(outputFile);

    res.setHeader('Content-Type', 'audio/mp3');
    res.setHeader('Content-Disposition', 'attachment; filename="seslendirme.mp3"');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: error.message });
  }
};
