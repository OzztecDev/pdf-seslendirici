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
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID gerekli' });
    }

    // Get transcript from transcript.party
    const transcriptUrl = `https://transcript.party/api/videos/${videoId}/transcript`;
    
    const transcriptResult = await new Promise((resolve, reject) => {
      https.get(transcriptUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        });
      }).on('error', reject);
    });

    if (!transcriptResult.transcript || transcriptResult.transcript.length === 0) {
      return res.status(404).json({ error: 'Transcript bulunamadı' });
    }

    const transcript = transcriptResult.transcript.map(item => item.text).join(' ');

    res.json({ transcript });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};