export const SYLLABI = ['CBSE', 'ICSE', 'Karnataka State'];
export const GRADES = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
export const LANGUAGES = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'];
export const TTS_LANG_MAP = { English: 'en-IN', Kannada: 'kn-IN', Hindi: 'hi-IN', Telugu: 'te-IN', Tamil: 'ta-IN' };

export const SUBJECTS_BY_GRADE = {
  'Class 1': ['English', 'Kannada', 'Mathematics', 'Environmental Studies'],
  'Class 2': ['English', 'Kannada', 'Mathematics', 'Environmental Studies'],
  'Class 3': ['English', 'Kannada', 'Mathematics', 'Environmental Studies'],
  'Class 4': ['English', 'Kannada', 'Mathematics', 'Environmental Studies'],
  'Class 5': ['English', 'Kannada', 'Mathematics', 'Environmental Studies'],
  'Class 6': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'],
  'Class 7': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'],
  'Class 8': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'],
  'Class 9': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'],
  'Class 10': ['English', 'Kannada', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'],
};

export const SUBJECT_META = {
  English:    { icon: '📖', color: '#4f8ef7', bg: '#4f8ef718' },
  Kannada:    { icon: 'ಕ',  color: '#f76b4f', bg: '#f76b4f18' },
  Mathematics:{ icon: '∑',  color: '#9b59b6', bg: '#9b59b618' },
  Science:    { icon: '🔬', color: '#27ae60', bg: '#27ae6018' },
  'Social Studies': { icon: '🌍', color: '#e67e22', bg: '#e67e2218' },
  'Computer Science': { icon: '💻', color: '#1abc9c', bg: '#1abc9c18' },
  'Environmental Studies': { icon: '🌿', color: '#2ecc71', bg: '#2ecc7118' },
};

export const AVATAR_OPTIONS = ['🧑‍🎓','👧','🧒','👩‍🎓','🎓','📚','🌟','🌸','🦁','🐯','🦊','🐘','🦋','🌈','⭐','🚀'];

export const DIFFICULTY_META = {
  easy:   { label: 'Easy',   color: '#27ae60', bg: '#27ae6020' },
  medium: { label: 'Medium', color: '#f39c12', bg: '#f39c1220' },
  hard:   { label: 'Hard',   color: '#e74c3c', bg: '#e74c3c20' },
};
