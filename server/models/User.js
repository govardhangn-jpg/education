import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ALL_GRADES = [
  // School
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12',
  // Entrance exams
  'NEET Preparation','KCET Preparation','NEET PG','IIT-JEE',
  // UPSC
  'UPSC Prelims',
  'UPSC Mains – GS','UPSC Mains – Essay',
  'Optional – History','Optional – Geography',
  'Optional – Political Science & IR','Optional – Public Administration',
  'Optional – Sociology','Optional – Philosophy','Optional – Economics',
  'Optional – Anthropology','Optional – Psychology','Optional – Law',
  'Optional – Mathematics',
  // LLB – Bar Council of Karnataka
  'LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5',
  // RGUHS – MBBS
  'MBBS Year 1','MBBS Year 2','MBBS Year 3 Part 1','MBBS Final Year',
  // RGUHS – BDS
  'BDS Year 1','BDS Year 2','BDS Year 3','BDS Final Year',
  // RGUHS – B.Pharm
  'B.Pharm Year 1','B.Pharm Year 2','B.Pharm Year 3','B.Pharm Year 4',
  // RGUHS – B.Sc Nursing
  'BSc Nursing Year 1','BSc Nursing Year 2','BSc Nursing Year 3','BSc Nursing Year 4',
  // RGUHS – BMLT
  'BMLT Year 1','BMLT Year 2','BMLT Year 3',
  // RGUHS – BPT
  'BPT Year 1','BPT Year 2','BPT Year 3','BPT Year 4 & Internship',
  // RGUHS – BOT
  'BOT Year 1','BOT Year 2 & 3',
];

const ALL_SYLLABI = ['CBSE','ICSE','Karnataka State','NEET','KCET','NEET PG','IIT-JEE','UPSC','LLB','RGUHS'];

const userSchema = new mongoose.Schema({
  username:          { type:String, required:true, unique:true, lowercase:true, trim:true, minlength:3, maxlength:30 },
  password:          { type:String, required:true, minlength:6 },
  name:              { type:String, required:true, trim:true },
  email:             { type:String, lowercase:true, trim:true, sparse:true },
  role:              { type:String, enum:['student','teacher','admin'], default:'student' },
  grade:             { type:String, enum:ALL_GRADES, required:true },
  syllabus:          { type:String, enum:ALL_SYLLABI, required:true },
  avatar:            { type:String, default:'🧑‍🎓' },
  preferredLanguage: { type:String, enum:['English','Kannada','Hindi','Telugu','Tamil'], default:'English' },
  isActive:          { type:Boolean, default:true },
  lastLogin:         { type:Date },
  loginCount:        { type:Number, default:0 },
  subjectsStudied:   [{ type:String }],
  totalChatMessages: { type:Number, default:0 },
  totalQuizzesTaken: { type:Number, default:0 },
  totalQuizScore:    { type:Number, default:0 },
  streakDays:        { type:Number, default:0 },
  lastActiveDate:    { type:Date },
  achievements:      [{ name:String, icon:String, earnedAt:Date }],
}, { timestamps:true });

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
