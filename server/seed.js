import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const DEMO_STUDENTS = [
  { username: 'arjun_k', password: 'learn123', name: 'Arjun Kumar', grade: 'Class 7', syllabus: 'CBSE', avatar: '🧑‍🎓', email: 'arjun@demo.com', preferredLanguage: 'English' },
  { username: 'priya_s', password: 'study456', name: 'Priya Sharma', grade: 'Class 5', syllabus: 'ICSE', avatar: '👧', email: 'priya@demo.com', preferredLanguage: 'English' },
  { username: 'ravi_m', password: 'learn789', name: 'Ravi Murthy', grade: 'Class 9', syllabus: 'Karnataka State', avatar: '🧒', email: 'ravi@demo.com', preferredLanguage: 'Kannada' },
  { username: 'ananya_r', password: 'study123', name: 'Ananya Rao', grade: 'Class 6', syllabus: 'CBSE', avatar: '👩‍🎓', email: 'ananya@demo.com', preferredLanguage: 'English' },
  { username: 'kiran_b', password: 'learn456', name: 'Kiran Babu', grade: 'Class 10', syllabus: 'CBSE', avatar: '🎓', email: 'kiran@demo.com', preferredLanguage: 'English' },
  { username: 'deepa_n', password: 'study789', name: 'Deepa Nair', grade: 'Class 3', syllabus: 'ICSE', avatar: '🌸', email: 'deepa@demo.com', preferredLanguage: 'Hindi' },
  { username: 'suresh_g', password: 'learn000', name: 'Suresh Gowda', grade: 'Class 8', syllabus: 'Karnataka State', avatar: '📚', email: 'suresh@demo.com', preferredLanguage: 'Kannada' },
  { username: 'meera_v', password: 'study000', name: 'Meera Venkat', grade: 'Class 4', syllabus: 'CBSE', avatar: '🌟', email: 'meera@demo.com', preferredLanguage: 'Telugu' },
  { username: 'admin', password: 'admin@samarthaa', name: 'Admin User', grade: 'Class 10', syllabus: 'CBSE', avatar: '🛡️', role: 'admin' },
  { username: 'teacher1', password: 'teacher@123', name: 'Smt. Kavitha Reddy', grade: 'Class 7', syllabus: 'CBSE', avatar: '👩‍🏫', role: 'teacher' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samarthaa');
    console.log('Connected to MongoDB');

    // Drop users collection entirely to clear any stale indexes from old schemas
    const cols = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    if (cols.length > 0) {
      await mongoose.connection.db.dropCollection('users');
      console.log('Dropped existing users collection (cleared stale indexes)');
    }

    for (const student of DEMO_STUDENTS) {
      await User.create(student);
      console.log('Created: ' + student.username + ' (' + student.name + ')');
    }

    console.log('\nSeed complete! Demo credentials:');
    DEMO_STUDENTS.forEach(s =>
      console.log((s.role || 'student').padEnd(8) + ' | ' + s.username + ' / ' + s.password)
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
