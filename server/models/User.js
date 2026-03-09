import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  grade: { type: String, enum: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','NEET Preparation','KCET Preparation'], required: true },
  syllabus: { type: String, enum: ['CBSE', 'ICSE', 'Karnataka State', 'NEET', 'KCET'], required: true },
  avatar: { type: String, default: '🧑‍🎓' },
  preferredLanguage: { type: String, enum: ['English','Kannada','Hindi','Telugu','Tamil'], default: 'English' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  // Progress tracking
  subjectsStudied: [{ type: String }],
  totalChatMessages: { type: Number, default: 0 },
  totalQuizzesTaken: { type: Number, default: 0 },
  totalQuizScore: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  achievements: [{ name: String, icon: String, earnedAt: Date }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
