// Run: node check.js
// Checks that all required env vars are set and MongoDB + Anthropic are reachable

import dotenv from 'dotenv';
dotenv.config();

console.log('\n=== SamarthaaEdu Environment Check ===\n');

const required = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

let ok = true;
for (const [key, val] of Object.entries(required)) {
  if (!val) {
    console.log('MISSING  ' + key);
    ok = false;
  } else {
    const display = key === 'ANTHROPIC_API_KEY'
      ? val.slice(0, 20) + '...'
      : key === 'JWT_SECRET' ? val.slice(0, 8) + '...' : val;
    console.log('OK       ' + key + ' = ' + display);
  }
}

if (!ok) {
  console.log('\nFix: Copy server/.env.example to server/.env and fill in the missing values.\n');
  process.exit(1);
}

// Test MongoDB
console.log('\nTesting MongoDB connection...');
import mongoose from 'mongoose';
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('OK       MongoDB connected to: ' + process.env.MONGODB_URI);
  await mongoose.disconnect();
} catch (e) {
  console.log('FAIL     MongoDB: ' + e.message);
  console.log('         Make sure MongoDB is running (mongod)');
}

// Test Anthropic
console.log('\nTesting Anthropic API key...');
import Anthropic from '@anthropic-ai/sdk';
try {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Say hi' }],
  });
  console.log('OK       Anthropic API key is valid! Response: ' + res.content[0].text);
} catch (e) {
  console.log('FAIL     Anthropic: ' + e.message);
  if (e.status === 401) console.log('         Your API key is invalid or expired. Get one at https://console.anthropic.com');
  if (e.status === 429) console.log('         Rate limited - but key is valid!');
}

console.log('\n=== Done ===\n');
