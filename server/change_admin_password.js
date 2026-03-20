/**
 * change_admin_password.js
 * ─────────────────────────
 * Run ONCE on the server to update admin password.
 * 
 * Usage (from server/ directory):
 *   node change_admin_password.js
 * 
 * Delete this file after running.
 */
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI    = process.env.MONGODB_URI;
const NEW_PASSWORD = 'ownerdemo@!2345';
const USERNAME     = 'admin';

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // Import User model after connection
  const { default: User } = await import('./models/User.js');

  const user = await User.findOne({ username: USERNAME });
  if (!user) {
    console.error(`❌ User '${USERNAME}' not found`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
  await User.updateOne({ username: USERNAME }, { password: hashed });

  console.log(`✅ Password for '${USERNAME}' changed successfully`);
  console.log(`   New password: ${NEW_PASSWORD}`);
  console.log('\n⚠️  Delete this file now — it contains the password in plain text.');

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
