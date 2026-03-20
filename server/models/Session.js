// server/models/Session.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenId:     { type: String, required: true, unique: true }, // jti claim in JWT
  deviceName:  { type: String, default: 'Unknown device' },   // e.g. "Chrome on Windows"
  deviceType:  { type: String, default: 'web' },              // 'web' | 'mobile' | 'tablet'
  ipAddress:   { type: String, default: '' },
  userAgent:   { type: String, default: '' },
  lastSeen:    { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Auto-expire sessions after 30 days of inactivity
sessionSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Helper: parse a UA string into a readable device name
sessionSchema.statics.parseDevice = function(userAgent = '', ip = '') {
  const ua = userAgent.toLowerCase();

  // Device type
  let deviceType = 'web';
  if (/mobile|android|iphone/.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/.test(ua)) deviceType = 'tablet';

  // Browser
  let browser = 'Browser';
  if (ua.includes('edg/'))        browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';

  // OS
  let os = 'Unknown OS';
  if (ua.includes('windows'))      os = 'Windows';
  else if (ua.includes('mac os'))  os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux'))   os = 'Linux';

  return {
    deviceName: `${browser} on ${os}`,
    deviceType,
  };
};

export default mongoose.model('Session', sessionSchema);
