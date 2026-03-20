import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const DEMO_STUDENTS = [
  // Class 1-10 students
  { username: 'arjun_k',  password: 'learn123',   name: 'Arjun Kumar',        grade: 'Class 7',  syllabus: 'CBSE',            avatar: '🧑‍🎓', email: 'arjun@demo.com',   preferredLanguage: 'English' },
  { username: 'priya_s',  password: 'study456',   name: 'Priya Sharma',       grade: 'Class 5',  syllabus: 'ICSE',            avatar: '👧',   email: 'priya@demo.com',   preferredLanguage: 'English' },
  { username: 'ravi_m',   password: 'learn789',   name: 'Ravi Murthy',        grade: 'Class 9',  syllabus: 'Karnataka State', avatar: '🧒',   email: 'ravi@demo.com',    preferredLanguage: 'Kannada' },
  { username: 'ananya_r', password: 'study123',   name: 'Ananya Rao',         grade: 'Class 6',  syllabus: 'CBSE',            avatar: '👩‍🎓', email: 'ananya@demo.com',  preferredLanguage: 'English' },
  { username: 'kiran_b',  password: 'learn456',   name: 'Kiran Babu',         grade: 'Class 10', syllabus: 'CBSE',            avatar: '🎓',   email: 'kiran@demo.com',   preferredLanguage: 'English' },
  { username: 'deepa_n',  password: 'study789',   name: 'Deepa Nair',         grade: 'Class 3',  syllabus: 'ICSE',            avatar: '🌸',   email: 'deepa@demo.com',   preferredLanguage: 'Hindi' },
  { username: 'suresh_g', password: 'learn000',   name: 'Suresh Gowda',       grade: 'Class 8',  syllabus: 'Karnataka State', avatar: '📚',   email: 'suresh@demo.com',  preferredLanguage: 'Kannada' },
  { username: 'meera_v',  password: 'study000',   name: 'Meera Venkat',       grade: 'Class 4',  syllabus: 'CBSE',            avatar: '🌟',   email: 'meera@demo.com',   preferredLanguage: 'Telugu' },
  // Class 11-12 students (Science stream)
  { username: 'rahul_11', password: 'study11cbse', name: 'Rahul Verma',       grade: 'Class 11', syllabus: 'CBSE',            avatar: '⚛️',   email: 'rahul11@demo.com', preferredLanguage: 'English' },
  { username: 'sneha_12', password: 'study12cbse', name: 'Sneha Iyer',        grade: 'Class 12', syllabus: 'CBSE',            avatar: '🧬',   email: 'sneha12@demo.com', preferredLanguage: 'English' },
  { username: 'vijay_11', password: 'study11ks',   name: 'Vijay Patil',       grade: 'Class 11', syllabus: 'Karnataka State', avatar: '🎯',   email: 'vijay11@demo.com', preferredLanguage: 'Kannada' },
  { username: 'divya_12', password: 'study12ks',   name: 'Divya Lakshmi',     grade: 'Class 12', syllabus: 'Karnataka State', avatar: '🌺',   email: 'divya12@demo.com', preferredLanguage: 'Kannada' },
  // NEET aspirants
  { username: 'neet_arya',  password: 'neet2025',  name: 'Arya Krishnan',     grade: 'NEET Preparation', syllabus: 'NEET', avatar: '🩺',   email: 'arya@demo.com',    preferredLanguage: 'English' },
  { username: 'neet_rohit', password: 'neet2026',  name: 'Rohit Hegde',       grade: 'NEET Preparation', syllabus: 'NEET', avatar: '🏥',   email: 'rohit@demo.com',   preferredLanguage: 'Kannada' },
  // KCET aspirants
  { username: 'kcet_kavya', password: 'kcet2025',  name: 'Kavya Gowda',       grade: 'KCET Preparation', syllabus: 'KCET', avatar: '🏫',   email: 'kavya@demo.com',   preferredLanguage: 'Kannada' },
  { username: 'kcet_arun',  password: 'kcet2026',  name: 'Arun Prasad',       grade: 'KCET Preparation', syllabus: 'KCET', avatar: '🎯',   email: 'arun@demo.com',    preferredLanguage: 'English' },
  // IIT-JEE aspirants
  { username: 'jee_aryan',   password: 'jee2025',   name: 'Aryan Mehta',       grade: 'IIT-JEE', syllabus: 'IIT-JEE', avatar: '⚙️',  email: 'aryan@demo.com',   preferredLanguage: 'English' },
  { username: 'jee_pooja',   password: 'jee2026',   name: 'Pooja Iyer',        grade: 'IIT-JEE', syllabus: 'IIT-JEE', avatar: '🔬',  email: 'pooja@demo.com',   preferredLanguage: 'English' },
  // UPSC aspirants
  { username: 'upsc_kaveri', password: 'upsc2025',  name: 'Kaveri Nair',       grade: 'UPSC Prelims',      syllabus: 'UPSC', avatar: '🇮🇳', email: 'kaveri@demo.com',  preferredLanguage: 'English' },
  { username: 'upsc_rajan',  password: 'upsc2026',  name: 'Rajan Pillai',      grade: 'UPSC Mains – GS',   syllabus: 'UPSC', avatar: '📚',  email: 'rajan@demo.com',   preferredLanguage: 'English' },
  { username: 'upsc_shruti', password: 'upsc2027',  name: 'Shruti Desai',      grade: 'Optional – History',syllabus: 'UPSC', avatar: '📜',  email: 'shruti@demo.com',  preferredLanguage: 'English' },
  // NEET PG aspirants
  { username: 'neetpg_sneha',  password: 'neetpg2025', name: 'Dr. Sneha Menon',   grade: 'NEET PG', syllabus: 'NEET PG', avatar: '🩺', email: 'sneha_pg@demo.com', preferredLanguage: 'English' },
  { username: 'neetpg_vivek',  password: 'neetpg2026', name: 'Dr. Vivek Sharma',  grade: 'NEET PG', syllabus: 'NEET PG', avatar: '🎓', email: 'vivek_pg@demo.com',  preferredLanguage: 'English' },
  // LLB students — Bar Council of Karnataka
  { username: 'llb_riya',   password: 'llb2025',   name: 'Riya Shenoy',       grade: 'LLB Year 1', syllabus: 'LLB', avatar: '⚖️',  email: 'riya@demo.com',    preferredLanguage: 'English' },
  { username: 'llb_sanjay', password: 'llb2026',   name: 'Sanjay Kulkarni',   grade: 'LLB Year 3', syllabus: 'LLB', avatar: '🏛️',  email: 'sanjay@demo.com',  preferredLanguage: 'Kannada' },
  // RGUHS — MBBS
  { username: 'mbbs_preethi', password: 'mbbs2025', name: 'Preethi Ramesh',   grade: 'MBBS Year 1', syllabus: 'RGUHS', avatar: '🩺',  email: 'preethi@demo.com', preferredLanguage: 'English' },
  { username: 'mbbs_rahul',   password: 'mbbs2026', name: 'Rahul Shetty',     grade: 'MBBS Year 3 Part 1', syllabus: 'RGUHS', avatar: '🏥', email: 'rahulm@demo.com', preferredLanguage: 'Kannada' },
  // RGUHS — BDS
  { username: 'bds_swathi',  password: 'bds2025',  name: 'Swathi Kamath',     grade: 'BDS Year 2', syllabus: 'RGUHS', avatar: '🦷',  email: 'swathi@demo.com',  preferredLanguage: 'Kannada' },
  // RGUHS — B.Pharm
  { username: 'pharm_sunil', password: 'pharm2025', name: 'Sunil Babu',       grade: 'B.Pharm Year 2', syllabus: 'RGUHS', avatar: '💊', email: 'sunil@demo.com',   preferredLanguage: 'English' },
  // RGUHS — B.Sc Nursing
  { username: 'nurse_latha', password: 'nurse2025', name: 'Latha Devi',       grade: 'BSc Nursing Year 2', syllabus: 'RGUHS', avatar: '💉', email: 'latha@demo.com', preferredLanguage: 'Kannada' },
  // RGUHS — BPT
  { username: 'bpt_harish',  password: 'bpt2025',  name: 'Harish Naik',       grade: 'BPT Year 2', syllabus: 'RGUHS', avatar: '💪',  email: 'harish@demo.com',  preferredLanguage: 'English' },
  // Staff
  { username: 'admin',    password: 'admin@samarthaaa', name: 'Admin User',    grade: 'Class 10', syllabus: 'CBSE', avatar: '🛡️', role: 'admin' },
  { username: 'teacher1', password: 'teacher@123',     name: 'Smt. Kavitha Reddy', grade: 'Class 7', syllabus: 'CBSE', avatar: '👩‍🏫', role: 'teacher' },
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
