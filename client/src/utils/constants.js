export const SYLLABI = ['CBSE', 'ICSE', 'Karnataka State'];
export const GRADES  = [
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12',
];
export const EXAM_MODES = ['NEET Preparation', 'KCET Preparation'];
export const LANGUAGES   = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'];
export const TTS_LANG_MAP = { English:'en-IN', Kannada:'kn-IN', Hindi:'hi-IN', Telugu:'te-IN', Tamil:'ta-IN' };

export const SUBJECTS_BY_GRADE = {
  'Class 1':  ['English','Kannada','Mathematics','Environmental Studies'],
  'Class 2':  ['English','Kannada','Mathematics','Environmental Studies'],
  'Class 3':  ['English','Kannada','Mathematics','Environmental Studies'],
  'Class 4':  ['English','Kannada','Mathematics','Environmental Studies'],
  'Class 5':  ['English','Kannada','Mathematics','Environmental Studies'],
  'Class 6':  ['English','Kannada','Mathematics','Science','Social Studies','Computer Science'],
  'Class 7':  ['English','Kannada','Mathematics','Science','Social Studies','Computer Science'],
  'Class 8':  ['English','Kannada','Mathematics','Science','Social Studies','Computer Science'],
  'Class 9':  ['English','Kannada','Mathematics','Science','Social Studies','Computer Science'],
  'Class 10': ['English','Kannada','Mathematics','Science','Social Studies','Computer Science'],
  'Class 11': ['English','Kannada','Mathematics','Physics','Chemistry','Biology','Computer Science','Accountancy','Business Studies','Economics','History','Political Science','Commerce'],
  'Class 12': ['English','Kannada','Mathematics','Physics','Chemistry','Biology','Computer Science','Accountancy','Business Studies','Economics','History','Political Science','Commerce'],
  'NEET Preparation': ['Physics','Chemistry','Biology – Botany','Biology – Zoology'],
  'KCET Preparation': ['Physics','Chemistry','Mathematics','Biology','Kannada (Compulsory)'],
};

export const SUBJECT_META = {
  'English':               { icon:'📖', color:'#4f8ef7', bg:'#4f8ef718' },
  'Kannada':               { icon:'ಕ',  color:'#f76b4f', bg:'#f76b4f18' },
  'Mathematics':           { icon:'∑',  color:'#9b59b6', bg:'#9b59b618' },
  'Science':               { icon:'🔬', color:'#27ae60', bg:'#27ae6018' },
  'Social Studies':        { icon:'🌍', color:'#e67e22', bg:'#e67e2218' },
  'Computer Science':      { icon:'💻', color:'#1abc9c', bg:'#1abc9c18' },
  'Environmental Studies': { icon:'🌿', color:'#2ecc71', bg:'#2ecc7118' },
  // Class 11-12
  'Physics':               { icon:'⚛️', color:'#3498db', bg:'#3498db18' },
  'Chemistry':             { icon:'🧪', color:'#e74c3c', bg:'#e74c3c18' },
  'Biology':               { icon:'🧬', color:'#27ae60', bg:'#27ae6018' },
  'Accountancy':           { icon:'📊', color:'#f39c12', bg:'#f39c1218' },
  'Business Studies':      { icon:'🏢', color:'#8e44ad', bg:'#8e44ad18' },
  'Economics':             { icon:'📈', color:'#16a085', bg:'#16a08518' },
  'History':               { icon:'📜', color:'#d35400', bg:'#d3540018' },
  'Political Science':     { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'Commerce':              { icon:'💼', color:'#7f8c8d', bg:'#7f8c8d18' },
  // ICSE-specific
  'Science - Physics':     { icon:'⚛️', color:'#3498db', bg:'#3498db18' },
  'Science - Chemistry':   { icon:'🧪', color:'#e74c3c', bg:'#e74c3c18' },
  'Science - Biology':     { icon:'🧬', color:'#27ae60', bg:'#27ae6018' },
  // Entrance exams
  'Biology – Botany':      { icon:'🌱', color:'#27ae60', bg:'#27ae6018' },
  'Biology – Zoology':     { icon:'🦎', color:'#16a085', bg:'#16a08518' },
  'Kannada (Compulsory)':  { icon:'ಕ',  color:'#f76b4f', bg:'#f76b4f18' },
};

export const AVATAR_OPTIONS = ['🧑‍🎓','👧','🧒','👩‍🎓','🎓','📚','🌟','🌸','🦁','🐯','🦊','🐘','🦋','🌈','⭐','🚀'];

export const DIFFICULTY_META = {
  easy:   { label:'Easy',   color:'#27ae60', bg:'#27ae6020' },
  medium: { label:'Medium', color:'#f39c12', bg:'#f39c1220' },
  hard:   { label:'Hard',   color:'#e74c3c', bg:'#e74c3c20' },
};

// Exam modes are standalone (no syllabus/grade selector)
export const EXAM_META = {
  'NEET Preparation': {
    icon: '🏥', color: '#e74c3c', bg: '#e74c3c18',
    label: 'NEET', fullLabel: 'NEET UG Preparation',
    description: 'Medical entrance — Physics, Chemistry, Botany, Zoology',
    badge: '🩺 Medical Entrance',
  },
  'KCET Preparation': {
    icon: '🎯', color: '#8e44ad', bg: '#8e44ad18',
    label: 'KCET', fullLabel: 'Karnataka CET Preparation',
    description: 'Karnataka Engineering/Medical entrance — PCM/PCB + Kannada',
    badge: '🏫 Karnataka Entrance',
  },
};
