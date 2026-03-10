import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  question: String,
  options: [String],
  selectedOption: Number,
  correctOption: Number,
  isCorrect: Boolean,
  explanation: String,
});

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  syllabus: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, default: '' },
  topic: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  score: { type: Number, required: true }, // percentage
  timeTaken: { type: Number }, // seconds
  answers: [answerSchema],
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

quizAttemptSchema.index({ userId: 1, subject: 1, chapter: 1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
