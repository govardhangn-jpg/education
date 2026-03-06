import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  syllabus: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String },
  language: { type: String, default: 'English' },
  messages: [messageSchema],
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  title: { type: String }, // auto-generated from first message
}, { timestamps: true });

chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, subject: 1 });

export default mongoose.model('ChatSession', chatSessionSchema);
