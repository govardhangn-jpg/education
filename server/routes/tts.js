import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { protect } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

function getConfig() {
  // Strip any accidental quotes or whitespace from .env values
  const apiKey  = (process.env.ELEVENLABS_API_KEY  || '').trim().replace(/^["']|["']$/g, '');
  const voiceId = (process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL').trim().replace(/^["']|["']$/g, '');
  console.log('[tts/config] apiKey prefix:', apiKey ? apiKey.slice(0,8)+'...' : 'MISSING', '| voiceId:', voiceId);
  return {
    apiKey,
    voiceIds: {
      English: process.env.ELEVENLABS_VOICE_ID         || voiceId,
      Kannada: process.env.ELEVENLABS_VOICE_ID_KANNADA || voiceId,
      Hindi:   process.env.ELEVENLABS_VOICE_ID_HINDI   || voiceId,
      Telugu:  process.env.ELEVENLABS_VOICE_ID_TELUGU  || voiceId,
      Tamil:   process.env.ELEVENLABS_VOICE_ID_TAMIL   || voiceId,
    },
  };
}

// GET /api/tts/status — NO auth required, just returns whether ElevenLabs is configured
router.get('/status', (req, res) => {
  const { apiKey, voiceIds } = getConfig();
  console.log('[tts/status] available:', !!apiKey, '| voiceId:', voiceIds.English);
  res.json({ available: !!apiKey, voiceId: voiceIds.English });
});

// GET /api/tts/debug — NO auth, useful for checking config
router.get('/debug', (req, res) => {
  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  res.json({
    ELEVENLABS_API_KEY:  apiKey  ? apiKey.slice(0, 16)  + '...' : 'NOT SET ❌',
    ELEVENLABS_VOICE_ID: voiceId ? voiceId               : 'NOT SET (using default EXAVITQu4vr4xnSDxMaL)',
    available: !!apiKey,
  });
});

// POST /api/tts/speak — requires auth to prevent abuse
router.post('/speak', protect, async (req, res) => {
  const { apiKey, voiceIds } = getConfig();

  if (!apiKey) {
    console.error('[tts/speak] ELEVENLABS_API_KEY not set in server/.env');
    return res.status(503).json({ error: 'ElevenLabs API key not configured in server/.env' });
  }

  const { text, language = 'English', voiceId: clientVoiceId } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const clean = text
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4800);  // Client chunks at ≤2400 chars, so each call arrives well under limit

  const selectedVoiceId = clientVoiceId || voiceIds[language] || voiceIds.English;
  console.log('[tts/speak] lang:', language, '| voiceId:', selectedVoiceId, '| chars:', clean.length);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: clean,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[tts/speak] ElevenLabs error:', response.status, errText);
      if (response.status === 401) return res.status(401).json({ error: 'Invalid ElevenLabs API key' });
      if (response.status === 404) return res.status(404).json({ error: `Voice ID "${selectedVoiceId}" not found` });
      if (response.status === 429) return res.status(429).json({ error: 'ElevenLabs rate limit reached' });
      return res.status(500).json({ error: 'ElevenLabs error: ' + errText.slice(0, 200) });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log('[tts/speak] Success — audio size:', buffer.length, 'bytes');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);

  } catch (err) {
    console.error('[tts/speak] fetch error:', err.message);
    res.status(500).json({ error: 'TTS request failed: ' + err.message });
  }
});

export default router;
