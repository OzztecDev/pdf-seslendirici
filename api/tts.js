const https = require('https');

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
    const { text, voice = 'tr-TR-AhmetNeural', rate = '+0%' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Metin bulunamadı' });
    }

    const postData = JSON.stringify({
      text: text,
      voice: voice,
      rate: rate,
      pitch: '+0Hz'
    });

    const options = {
      hostname: 'freetts.org',
      path: '/api/tts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (!result.file_id) {
      return res.status(500).json({ error: 'API error' });
    }

    const audioResult = await new Promise((resolve, reject) => {
      https.get(`https://freetts.org/api/audio/${result.file_id}`, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="seslendirme.mp3"');
    res.send(audioResult);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
