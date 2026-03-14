import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Use explicit path so dotenv works regardless of spaces in directory name
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Debug: confirm key loaded at startup
const keyStatus = process.env.ANTHROPIC_API_KEY
  ? 'YES (' + process.env.ANTHROPIC_API_KEY.slice(0, 16) + '...)'
  : 'NOT FOUND - chat will not work!';
console.log('ANTHROPIC_API_KEY loaded:', keyStatus);

const elevenStatus = process.env.ELEVENLABS_API_KEY
  ? 'YES (' + process.env.ELEVENLABS_API_KEY.slice(0, 16) + '...)'
  : 'NOT SET - TTS will use browser voice';
const voiceStatus = process.env.ELEVENLABS_VOICE_ID || 'NOT SET (using default)';
console.log('ELEVENLABS_API_KEY loaded:', elevenStatus);
console.log('ELEVENLABS_VOICE_ID loaded:', voiceStatus);

import authRoutes from './routes/auth.js';
import ttsRoutes from './routes/tts.js';
import chatRoutes from './routes/chat.js';
import quizRoutes from './routes/quiz.js';
import curriculumRoutes from './routes/curriculum.js';
import adminRoutes from './routes/admin.js';
import arRoutes from './routes/ar.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Render's reverse proxy so req.protocol returns 'https' correctly
app.set('trust proxy', 1);

// Helmet with CSP configured to allow model-viewer CDN on AR pages
// The /ar/* routes serve HTML pages that load the model-viewer script from Google CDN
// model-viewer uses fetch() internally to load src — so data: must be in connect-src
app.use((req, res, next) => {
  if (req.path.startsWith('/ar/')) {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'data:', 'blob:'],
          scriptSrc:  ["'self'", 'https://ajax.googleapis.com', "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          imgSrc:     ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'https:', 'data:', 'blob:'],
          workerSrc:  ["'self'", 'blob:', 'data:'],
          frameSrc:   ["'none'"],
          mediaSrc:   ["'self'", 'data:', 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })(req, res, next);
  } else {
    helmet()(req, res, next);
  }
});

const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
  validate: { xForwardedForHeader: false }, // disable x-forwarded-for validation for local dev
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many messages, slow down' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);
app.use('/api/chat/', chatLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/ar', arRoutes);
app.use('/ar', arRoutes);

app.get('/health', (req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
  elevenLabsKeySet: !!process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'NOT SET',
  port: PORT,
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samarthaa')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('SamarthaaEdu server on port ' + PORT));
  })
  .catch(err => { console.error('MongoDB connection failed:', err); process.exit(1); });

export default app;
