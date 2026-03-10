export const SYLLABI = ['CBSE', 'ICSE', 'Karnataka State'];
export const GRADES  = [
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12',
];
export const LANGUAGES   = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'];
export const TTS_LANG_MAP = { English:'en-IN', Kannada:'kn-IN', Hindi:'hi-IN', Telugu:'te-IN', Tamil:'ta-IN' };

// ── Entrance Exams (no school syllabus) ──────────────────────────
export const EXAM_MODES = ['NEET Preparation', 'KCET Preparation', 'NEET PG', 'IIT-JEE'];

// ── LLB – Bar Council of Karnataka ──────────────────────────────
export const LLB_MODES = [
  'LLB Year 1','LLB Year 2','LLB Year 3',
  'LLB Year 4','LLB Year 5',
];

// ── RGUHS Professional Courses ───────────────────────────────────
export const RGUHS_MODES = [
  // MBBS
  'MBBS Year 1','MBBS Year 2','MBBS Year 3 Part 1','MBBS Final Year',
  // BDS
  'BDS Year 1','BDS Year 2','BDS Year 3','BDS Final Year',
  // B.Pharm
  'B.Pharm Year 1','B.Pharm Year 2','B.Pharm Year 3','B.Pharm Year 4',
  // B.Sc Nursing
  'BSc Nursing Year 1','BSc Nursing Year 2','BSc Nursing Year 3','BSc Nursing Year 4',
  // BMLT
  'BMLT Year 1','BMLT Year 2','BMLT Year 3',
  // BPT
  'BPT Year 1','BPT Year 2','BPT Year 3','BPT Year 4 & Internship',
  // BOT
  'BOT Year 1','BOT Year 2 & 3',
];

// ── UPSC ─────────────────────────────────────────────────────────
export const UPSC_GRADES = [
  'UPSC Prelims',
  'UPSC Mains – GS',
  'UPSC Mains – Essay',
  'Optional – History',
  'Optional – Geography',
  'Optional – Political Science & IR',
  'Optional – Public Administration',
  'Optional – Sociology',
  'Optional – Philosophy',
  'Optional – Economics',
  'Optional – Anthropology',
  'Optional – Psychology',
  'Optional – Law',
  'Optional – Mathematics',
];

export const ALL_PROFESSIONAL_MODES = [...EXAM_MODES, ...LLB_MODES, ...RGUHS_MODES, ...UPSC_GRADES];

// Syllabus key lookup for any grade/mode
export function getSyllabusKey(grade) {
  if (grade === 'NEET Preparation') return 'NEET';
  if (grade === 'KCET Preparation') return 'KCET';
  if (grade === 'NEET PG')          return 'NEET PG';
  if (grade === 'IIT-JEE')          return 'IIT-JEE';
  if (LLB_MODES.includes(grade))    return 'LLB';
  if (RGUHS_MODES.includes(grade))  return 'RGUHS';
  if (UPSC_GRADES.includes(grade))  return 'UPSC';
  return null; // use user syllabus for school grades
}

export const SUBJECTS_BY_GRADE = {
  // ── School ───────────────────────────────────────────────────
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
  // ── Entrance Exams ───────────────────────────────────────────
  'NEET Preparation': ['Physics','Chemistry','Biology – Botany','Biology – Zoology'],
  'KCET Preparation': ['Physics','Chemistry','Mathematics','Biology','Kannada (Compulsory)'],
  'NEET PG': [
    'General Medicine','General Surgery','Obstetrics & Gynaecology','Paediatrics',
    'Pathology','Pharmacology','Microbiology','Biochemistry','Anatomy','Physiology',
    'Forensic Medicine & Toxicology','Community Medicine (Preventive & Social Medicine)',
    'Ophthalmology','ENT (Otorhinolaryngology)','Dermatology','Psychiatry',
    'Orthopaedics','Anaesthesia','Radiology',
  ],
  // ── LLB ──────────────────────────────────────────────────────
  'LLB Year 1': ['Jurisprudence & Legal Theory','Law of Contract','Constitutional Law I','Law of Torts','Legal Methods & Research'],
  'LLB Year 2': ['Constitutional Law II','Criminal Law I – IPC','Criminal Law II – CrPC','Property Law','Administrative Law'],
  'LLB Year 3': ['Civil Procedure Code','Law of Evidence','Company Law','Labour & Industrial Law','Intellectual Property Law','Moot Court & Clinical Legal Education'],
  'LLB Year 4': ['Family Law I – Hindu Law','Family Law II – Muslim & Other Laws','Environmental Law','International Law','Taxation Law'],
  'LLB Year 5': ['Banking & Finance Law','Human Rights Law','Cyber Law & Technology','Competition Law','Dissertation & Moot Court Finals'],
  // ── MBBS ─────────────────────────────────────────────────────
  'MBBS Year 1':       ['Anatomy','Physiology','Biochemistry'],
  'MBBS Year 2':       ['Pathology','Microbiology','Pharmacology','Forensic Medicine'],
  'MBBS Year 3 Part 1':['General Medicine','General Surgery','Obstetrics & Gynaecology','Paediatrics'],
  'MBBS Final Year':   ['Community Medicine (PSM)','Ophthalmology','ENT','Dermatology'],
  // ── BDS ──────────────────────────────────────────────────────
  'BDS Year 1':   ['Dental Anatomy & Histology','General Human Anatomy (BDS)','Dental Materials'],
  'BDS Year 2':   ['Oral Pathology & Microbiology','Conservative Dentistry Preclinical','Oral Medicine & Radiology'],
  'BDS Year 3':   ['Oral & Maxillofacial Surgery','Periodontics','Orthodontics'],
  'BDS Final Year':['Prosthodontics','Pedodontics (Paediatric Dentistry)','Public Health Dentistry'],
  // ── B.Pharm ───────────────────────────────────────────────────
  'B.Pharm Year 1': ['Pharmaceutics I','Pharmaceutical Chemistry I','Pharmacognosy I','Human Anatomy Physiology (B.Pharm)'],
  'B.Pharm Year 2': ['Pharmacology I','Medicinal Chemistry I','Pharmaceutics II','Pharmacognosy II'],
  'B.Pharm Year 3': ['Pharmacology II','Pharmaceutical Analysis','Industrial Pharmacy'],
  'B.Pharm Year 4': ['Pharmacy Practice','Pharmacotherapeutics','Pharmaceutical Biotechnology','Project Work & Clinical Training'],
  // ── B.Sc Nursing ──────────────────────────────────────────────
  'BSc Nursing Year 1': ['Anatomy & Physiology (Nursing)','Nutrition and Dietetics','Nursing Foundations','Psychology (Nursing)'],
  'BSc Nursing Year 2': ['Medical Surgical Nursing I','Child Health Nursing','Mental Health Nursing','Midwifery & OBG Nursing'],
  'BSc Nursing Year 3': ['Medical Surgical Nursing II','Community Health Nursing','Nursing Research & Statistics'],
  'BSc Nursing Year 4': ['Community Health Nursing II & Internship','Nursing Management & Education'],
  // ── BMLT ──────────────────────────────────────────────────────
  'BMLT Year 1': ['Basic Sciences for BMLT','Haematology','Clinical Biochemistry I'],
  'BMLT Year 2': ['Microbiology (BMLT)','Immunology & Serology','Histopathology & Cytology'],
  'BMLT Year 3': ['Clinical Biochemistry II & Instrumentation','Blood Banking & Transfusion Medicine','Research Methodology & Internship (BMLT)'],
  // ── BPT ──────────────────────────────────────────────────────
  'BPT Year 1': ['Anatomy for Physiotherapy','Physiology for Physiotherapy','Fundamentals of Physiotherapy'],
  'BPT Year 2': ['Electrotherapy','Therapeutic Exercise','Biomechanics'],
  'BPT Year 3': ['Musculoskeletal Physiotherapy','Neurological Physiotherapy','Cardiopulmonary Physiotherapy'],
  'BPT Year 4 & Internship': ['Sports Physiotherapy & Community Rehab','Research and Professional Practice (BPT)'],
  // ── BOT ──────────────────────────────────────────────────────
  'BOT Year 1':    ['Foundations of Occupational Therapy','Anatomy & Kinesiology (OT)'],
  'BOT Year 2 & 3':['Physical Dysfunction OT','Paediatric & Mental Health OT'],
  // ── IIT-JEE ──────────────────────────────────────────────────
  'IIT-JEE': ['Physics','Chemistry','Mathematics'],
  // ── UPSC Prelims ─────────────────────────────────────────────
  'UPSC Prelims': ['GS Paper 1 – General Studies','CSAT Paper 2 – Aptitude'],
  // ── UPSC Mains GS ────────────────────────────────────────────
  'UPSC Mains – GS': [
    'GS Paper I – History Culture Society',
    'GS Paper II – Governance Polity IR',
    'GS Paper III – Economy Technology Environment',
    'GS Paper IV – Ethics Integrity Aptitude',
  ],
  // ── UPSC Mains Essay ─────────────────────────────────────────
  'UPSC Mains – Essay': ['Essay Paper'],
  // ── UPSC Optionals ───────────────────────────────────────────
  'Optional – History':                  ['Indian History Paper I (Ancient Medieval)','Indian History Paper II (Modern)'],
  'Optional – Geography':                ['Geography Paper I (Physical Human Economic)','Geography Paper II (India)'],
  'Optional – Political Science & IR':   ['Political Theory','Indian Government and Politics & Comparative IR'],
  'Optional – Public Administration':    ['Administrative Theory','Indian Administration'],
  'Optional – Sociology':                ['Sociology Paper I (Fundamentals)','Sociology Paper II (Indian Society)'],
  'Optional – Philosophy':               ['Western Philosophy','Indian Philosophy'],
  'Optional – Economics':                ['Economics Paper I (Theory)','Economics Paper II (Indian Economy)'],
  'Optional – Anthropology':             ['Anthropology Paper I (Theory)','Anthropology Paper II (Applied Indian)'],
  'Optional – Psychology':               ['Psychology Paper I (Theory)','Psychology Paper II (Applied)'],
  'Optional – Law':                      ['Law Paper I (Theory and Constitutional)','Law Paper II (International and Administrative)'],
  'Optional – Mathematics':              ['Mathematics Paper I','Mathematics Paper II'],
};

export const SUBJECT_META = {
  // School
  'English':               { icon:'📖', color:'#4f8ef7', bg:'#4f8ef718' },
  'Kannada':               { icon:'ಕ',  color:'#f76b4f', bg:'#f76b4f18' },
  'Mathematics':           { icon:'∑',  color:'#9b59b6', bg:'#9b59b618' },
  'Science':               { icon:'🔬', color:'#27ae60', bg:'#27ae6018' },
  'Social Studies':        { icon:'🌍', color:'#e67e22', bg:'#e67e2218' },
  'Computer Science':      { icon:'💻', color:'#1abc9c', bg:'#1abc9c18' },
  'Environmental Studies': { icon:'🌿', color:'#2ecc71', bg:'#2ecc7118' },
  'Physics':               { icon:'⚛️', color:'#3498db', bg:'#3498db18' },
  'Chemistry':             { icon:'🧪', color:'#e74c3c', bg:'#e74c3c18' },
  'Biology':               { icon:'🧬', color:'#27ae60', bg:'#27ae6018' },
  'Accountancy':           { icon:'📊', color:'#f39c12', bg:'#f39c1218' },
  'Business Studies':      { icon:'🏢', color:'#8e44ad', bg:'#8e44ad18' },
  'Economics':             { icon:'📈', color:'#16a085', bg:'#16a08518' },
  'History':               { icon:'📜', color:'#d35400', bg:'#d3540018' },
  'Political Science':     { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'Commerce':              { icon:'💼', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Science - Physics':     { icon:'⚛️', color:'#3498db', bg:'#3498db18' },
  'Science - Chemistry':   { icon:'🧪', color:'#e74c3c', bg:'#e74c3c18' },
  'Science - Biology':     { icon:'🧬', color:'#27ae60', bg:'#27ae6018' },
  'Biology – Botany':      { icon:'🌱', color:'#27ae60', bg:'#27ae6018' },
  'Biology – Zoology':     { icon:'🦎', color:'#16a085', bg:'#16a08518' },
  'Kannada (Compulsory)':  { icon:'ಕ',  color:'#f76b4f', bg:'#f76b4f18' },
  // LLB
  'Jurisprudence & Legal Theory':         { icon:'⚖️', color:'#c0392b', bg:'#c0392b18' },
  'Law of Contract':                      { icon:'📝', color:'#8e44ad', bg:'#8e44ad18' },
  'Constitutional Law I':                 { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'Constitutional Law II':                { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'Law of Torts':                         { icon:'⚖️', color:'#c0392b', bg:'#c0392b18' },
  'Legal Methods & Research':             { icon:'🔍', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Criminal Law I – IPC':                 { icon:'🔒', color:'#e74c3c', bg:'#e74c3c18' },
  'Criminal Law II – CrPC':              { icon:'🔒', color:'#e74c3c', bg:'#e74c3c18' },
  'Property Law':                         { icon:'🏠', color:'#e67e22', bg:'#e67e2218' },
  'Administrative Law':                   { icon:'🏢', color:'#16a085', bg:'#16a08518' },
  'Civil Procedure Code':                 { icon:'📋', color:'#2980b9', bg:'#2980b918' },
  'Law of Evidence':                      { icon:'🔍', color:'#8e44ad', bg:'#8e44ad18' },
  'Company Law':                          { icon:'🏦', color:'#27ae60', bg:'#27ae6018' },
  'Labour & Industrial Law':              { icon:'👷', color:'#e67e22', bg:'#e67e2218' },
  'Intellectual Property Law':            { icon:'💡', color:'#f39c12', bg:'#f39c1218' },
  'Moot Court & Clinical Legal Education':{ icon:'🎤', color:'#9b59b6', bg:'#9b59b618' },
  'Family Law I – Hindu Law':             { icon:'🕉️', color:'#e67e22', bg:'#e67e2218' },
  'Family Law II – Muslim & Other Laws':  { icon:'☪️', color:'#27ae60', bg:'#27ae6018' },
  'Environmental Law':                    { icon:'🌿', color:'#27ae60', bg:'#27ae6018' },
  'International Law':                    { icon:'🌐', color:'#3498db', bg:'#3498db18' },
  'Taxation Law':                         { icon:'💰', color:'#f39c12', bg:'#f39c1218' },
  'Banking & Finance Law':                { icon:'🏦', color:'#16a085', bg:'#16a08518' },
  'Human Rights Law':                     { icon:'✊', color:'#e74c3c', bg:'#e74c3c18' },
  'Cyber Law & Technology':               { icon:'🌐', color:'#1abc9c', bg:'#1abc9c18' },
  'Competition Law':                      { icon:'📊', color:'#8e44ad', bg:'#8e44ad18' },
  'Dissertation & Moot Court Finals':     { icon:'🏆', color:'#f39c12', bg:'#f39c1218' },
  // MBBS
  'Anatomy':                    { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Physiology':                 { icon:'💓', color:'#e74c3c', bg:'#e74c3c18' },
  'Biochemistry':               { icon:'🧬', color:'#27ae60', bg:'#27ae6018' },
  'Pathology':                  { icon:'🔬', color:'#8e44ad', bg:'#8e44ad18' },
  'Microbiology':               { icon:'🦠', color:'#16a085', bg:'#16a08518' },
  'Pharmacology':               { icon:'💊', color:'#2980b9', bg:'#2980b918' },
  'Forensic Medicine':          { icon:'🔍', color:'#7f8c8d', bg:'#7f8c8d18' },
  'General Medicine':           { icon:'🩺', color:'#e74c3c', bg:'#e74c3c18' },
  'General Surgery':            { icon:'🔪', color:'#c0392b', bg:'#c0392b18' },
  'Obstetrics & Gynaecology':   { icon:'🤱', color:'#e91e8c', bg:'#e91e8c18' },
  'Paediatrics':                { icon:'👶', color:'#3498db', bg:'#3498db18' },
  'Community Medicine (PSM)':   { icon:'🌍', color:'#27ae60', bg:'#27ae6018' },
  'Ophthalmology':              { icon:'👁️', color:'#1abc9c', bg:'#1abc9c18' },
  'ENT':                        { icon:'👂', color:'#f39c12', bg:'#f39c1218' },
  'Dermatology':                { icon:'🩹', color:'#e67e22', bg:'#e67e2218' },
  // NEET PG-specific subject keys (longer names used in NEET PG)
  'ENT (Otorhinolaryngology)':  { icon:'👂', color:'#f39c12', bg:'#f39c1218' },
  'Psychiatry':                 { icon:'🧠', color:'#9b59b6', bg:'#9b59b618' },
  'Orthopaedics':               { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Anaesthesia':                { icon:'💉', color:'#2980b9', bg:'#2980b918' },
  'Radiology':                  { icon:'📡', color:'#16a085', bg:'#16a08518' },
  'Forensic Medicine & Toxicology': { icon:'🔍', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Community Medicine (Preventive & Social Medicine)': { icon:'🌍', color:'#27ae60', bg:'#27ae6018' },
  // BDS
  'Dental Anatomy & Histology':          { icon:'🦷', color:'#3498db', bg:'#3498db18' },
  'General Human Anatomy (BDS)':         { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Dental Materials':                    { icon:'🔩', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Oral Pathology & Microbiology':       { icon:'🔬', color:'#8e44ad', bg:'#8e44ad18' },
  'Conservative Dentistry Preclinical':  { icon:'🦷', color:'#27ae60', bg:'#27ae6018' },
  'Oral Medicine & Radiology':           { icon:'📷', color:'#2980b9', bg:'#2980b918' },
  'Oral & Maxillofacial Surgery':        { icon:'🔪', color:'#c0392b', bg:'#c0392b18' },
  'Periodontics':                        { icon:'🦷', color:'#e67e22', bg:'#e67e2218' },
  'Orthodontics':                        { icon:'😁', color:'#1abc9c', bg:'#1abc9c18' },
  'Prosthodontics':                      { icon:'🦷', color:'#f39c12', bg:'#f39c1218' },
  'Pedodontics (Paediatric Dentistry)':  { icon:'👶', color:'#3498db', bg:'#3498db18' },
  'Public Health Dentistry':             { icon:'🌍', color:'#27ae60', bg:'#27ae6018' },
  // B.Pharm
  'Pharmaceutics I':                  { icon:'💊', color:'#2980b9', bg:'#2980b918' },
  'Pharmaceutical Chemistry I':       { icon:'🧪', color:'#e74c3c', bg:'#e74c3c18' },
  'Pharmacognosy I':                  { icon:'🌿', color:'#27ae60', bg:'#27ae6018' },
  'Human Anatomy Physiology (B.Pharm)':{ icon:'💓', color:'#e74c3c', bg:'#e74c3c18' },
  'Pharmacology I':                   { icon:'💊', color:'#8e44ad', bg:'#8e44ad18' },
  'Medicinal Chemistry I':            { icon:'⚗️', color:'#e74c3c', bg:'#e74c3c18' },
  'Pharmaceutics II':                 { icon:'💉', color:'#2980b9', bg:'#2980b918' },
  'Pharmacognosy II':                 { icon:'🌱', color:'#27ae60', bg:'#27ae6018' },
  'Pharmacology II':                  { icon:'🧬', color:'#9b59b6', bg:'#9b59b618' },
  'Pharmaceutical Analysis':          { icon:'📊', color:'#16a085', bg:'#16a08518' },
  'Industrial Pharmacy':              { icon:'🏭', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Pharmacy Practice':                { icon:'🏥', color:'#e74c3c', bg:'#e74c3c18' },
  'Pharmacotherapeutics':             { icon:'💊', color:'#f39c12', bg:'#f39c1218' },
  'Pharmaceutical Biotechnology':     { icon:'🔬', color:'#1abc9c', bg:'#1abc9c18' },
  'Project Work & Clinical Training': { icon:'📋', color:'#95a5a6', bg:'#95a5a618' },
  // Nursing
  'Anatomy & Physiology (Nursing)':           { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Nutrition and Dietetics':                  { icon:'🥗', color:'#27ae60', bg:'#27ae6018' },
  'Nursing Foundations':                      { icon:'🩺', color:'#e74c3c', bg:'#e74c3c18' },
  'Psychology (Nursing)':                     { icon:'🧠', color:'#8e44ad', bg:'#8e44ad18' },
  'Medical Surgical Nursing I':               { icon:'🏥', color:'#e74c3c', bg:'#e74c3c18' },
  'Child Health Nursing':                     { icon:'👶', color:'#3498db', bg:'#3498db18' },
  'Mental Health Nursing':                    { icon:'🧠', color:'#9b59b6', bg:'#9b59b618' },
  'Midwifery & OBG Nursing':                  { icon:'🤱', color:'#e91e8c', bg:'#e91e8c18' },
  'Medical Surgical Nursing II':              { icon:'💉', color:'#c0392b', bg:'#c0392b18' },
  'Community Health Nursing':                 { icon:'🌍', color:'#27ae60', bg:'#27ae6018' },
  'Nursing Research & Statistics':            { icon:'📊', color:'#2980b9', bg:'#2980b918' },
  'Community Health Nursing II & Internship': { icon:'🏘️', color:'#16a085', bg:'#16a08518' },
  'Nursing Management & Education':           { icon:'📋', color:'#7f8c8d', bg:'#7f8c8d18' },
  // BMLT
  'Basic Sciences for BMLT':                       { icon:'🔬', color:'#27ae60', bg:'#27ae6018' },
  'Haematology':                                   { icon:'🩸', color:'#e74c3c', bg:'#e74c3c18' },
  'Clinical Biochemistry I':                       { icon:'🧪', color:'#e67e22', bg:'#e67e2218' },
  'Microbiology (BMLT)':                           { icon:'🦠', color:'#16a085', bg:'#16a08518' },
  'Immunology & Serology':                         { icon:'🛡️', color:'#2980b9', bg:'#2980b918' },
  'Histopathology & Cytology':                     { icon:'🔬', color:'#8e44ad', bg:'#8e44ad18' },
  'Clinical Biochemistry II & Instrumentation':    { icon:'⚗️', color:'#f39c12', bg:'#f39c1218' },
  'Blood Banking & Transfusion Medicine':          { icon:'🩸', color:'#c0392b', bg:'#c0392b18' },
  'Research Methodology & Internship (BMLT)':      { icon:'📋', color:'#7f8c8d', bg:'#7f8c8d18' },
  // BPT
  'Anatomy for Physiotherapy':              { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Physiology for Physiotherapy':           { icon:'💪', color:'#e74c3c', bg:'#e74c3c18' },
  'Fundamentals of Physiotherapy':          { icon:'🏥', color:'#3498db', bg:'#3498db18' },
  'Electrotherapy':                         { icon:'⚡', color:'#f39c12', bg:'#f39c1218' },
  'Therapeutic Exercise':                   { icon:'🏋️', color:'#27ae60', bg:'#27ae6018' },
  'Biomechanics':                           { icon:'⚙️', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Musculoskeletal Physiotherapy':          { icon:'🦴', color:'#e67e22', bg:'#e67e2218' },
  'Neurological Physiotherapy':             { icon:'🧠', color:'#8e44ad', bg:'#8e44ad18' },
  'Cardiopulmonary Physiotherapy':          { icon:'💓', color:'#e74c3c', bg:'#e74c3c18' },
  'Sports Physiotherapy & Community Rehab': { icon:'⚽', color:'#27ae60', bg:'#27ae6018' },
  'Research and Professional Practice (BPT)':{ icon:'📋', color:'#95a5a6', bg:'#95a5a618' },
  // BOT
  'Foundations of Occupational Therapy':  { icon:'🖐️', color:'#e67e22', bg:'#e67e2218' },
  'Anatomy & Kinesiology (OT)':           { icon:'🦾', color:'#3498db', bg:'#3498db18' },
  'Physical Dysfunction OT':              { icon:'♿', color:'#e74c3c', bg:'#e74c3c18' },
  'Paediatric & Mental Health OT':        { icon:'🧩', color:'#9b59b6', bg:'#9b59b618' },
  // IIT-JEE (Physics/Chemistry/Mathematics already covered above)
  // UPSC subjects
  'GS Paper 1 – General Studies':                  { icon:'🇮🇳', color:'#e67e22', bg:'#e67e2218' },
  'CSAT Paper 2 – Aptitude':                       { icon:'🧮', color:'#2980b9', bg:'#2980b918' },
  'GS Paper I – History Culture Society':           { icon:'📜', color:'#d35400', bg:'#d3540018' },
  'GS Paper II – Governance Polity IR':             { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'GS Paper III – Economy Technology Environment':  { icon:'📈', color:'#27ae60', bg:'#27ae6018' },
  'GS Paper IV – Ethics Integrity Aptitude':        { icon:'⚖️', color:'#9b59b6', bg:'#9b59b618' },
  'Essay Paper':                                    { icon:'✍️', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Indian History Paper I (Ancient Medieval)':      { icon:'🏺', color:'#d35400', bg:'#d3540018' },
  'Indian History Paper II (Modern)':               { icon:'📜', color:'#c0392b', bg:'#c0392b18' },
  'Geography Paper I (Physical Human Economic)':    { icon:'🌍', color:'#27ae60', bg:'#27ae6018' },
  'Geography Paper II (India)':                     { icon:'🗺️', color:'#16a085', bg:'#16a08518' },
  'Political Theory':                               { icon:'🏛️', color:'#2980b9', bg:'#2980b918' },
  'Indian Government and Politics & Comparative IR':{ icon:'🌐', color:'#3498db', bg:'#3498db18' },
  'Administrative Theory':                          { icon:'🏢', color:'#8e44ad', bg:'#8e44ad18' },
  'Indian Administration':                          { icon:'📋', color:'#7f8c8d', bg:'#7f8c8d18' },
  'Sociology Paper I (Fundamentals)':               { icon:'👥', color:'#e67e22', bg:'#e67e2218' },
  'Sociology Paper II (Indian Society)':            { icon:'🤝', color:'#f39c12', bg:'#f39c1218' },
  'Western Philosophy':                             { icon:'🧠', color:'#9b59b6', bg:'#9b59b618' },
  'Indian Philosophy':                              { icon:'🕉️', color:'#e67e22', bg:'#e67e2218' },
  'Economics Paper I (Theory)':                     { icon:'📊', color:'#16a085', bg:'#16a08518' },
  'Economics Paper II (Indian Economy)':            { icon:'💹', color:'#27ae60', bg:'#27ae6018' },
  'Anthropology Paper I (Theory)':                  { icon:'🦴', color:'#d35400', bg:'#d3540018' },
  'Anthropology Paper II (Applied Indian)':         { icon:'🧬', color:'#e67e22', bg:'#e67e2218' },
  'Psychology Paper I (Theory)':                    { icon:'🧠', color:'#8e44ad', bg:'#8e44ad18' },
  'Psychology Paper II (Applied)':                  { icon:'💭', color:'#9b59b6', bg:'#9b59b618' },
  'Law Paper I (Theory and Constitutional)':        { icon:'⚖️', color:'#c0392b', bg:'#c0392b18' },
  'Law Paper II (International and Administrative)':{ icon:'🌐', color:'#2980b9', bg:'#2980b918' },
  'Mathematics Paper I':                            { icon:'∑',  color:'#9b59b6', bg:'#9b59b618' },
  'Mathematics Paper II':                           { icon:'∫',  color:'#8e44ad', bg:'#8e44ad18' },
};

export const AVATAR_OPTIONS = ['🧑‍🎓','👧','🧒','👩‍🎓','🎓','📚','🌟','🌸','🦁','🐯','🦊','🐘','🦋','🌈','⭐','🚀','⚖️','🩺','🦷','💊','💉','🔬','🏥','📋'];

export const DIFFICULTY_META = {
  easy:   { label:'Easy',   color:'#27ae60', bg:'#27ae6020' },
  medium: { label:'Medium', color:'#f39c12', bg:'#f39c1220' },
  hard:   { label:'Hard',   color:'#e74c3c', bg:'#e74c3c20' },
};

export const EXAM_META = {
  'NEET Preparation': {
    icon:'🏥', color:'#e74c3c', bg:'#e74c3c18',
    label:'NEET', fullLabel:'NEET UG Preparation',
    description:'Medical entrance — Physics, Chemistry, Botany, Zoology',
    badge:'🩺 Medical Entrance',
  },
  'KCET Preparation': {
    icon:'🎯', color:'#8e44ad', bg:'#8e44ad18',
    label:'KCET', fullLabel:'Karnataka CET Preparation',
    description:'Karnataka Engineering/Medical entrance — PCM/PCB + Kannada',
    badge:'🏫 Karnataka Entrance',
  },
  'NEET PG': {
    icon:'🩺', color:'#c0392b', bg:'#c0392b18',
    label:'NEET PG', fullLabel:'NEET PG — MD/MS Entrance',
    description:'All 19 subjects: Medicine Surgery OBG Paediatrics Pathology Pharmacology + more',
    badge:'🎓 Postgraduate Medical',
  },
  'IIT-JEE': {
    icon:'⚙️', color:'#f39c12', bg:'#f39c1218',
    label:'IIT-JEE', fullLabel:'IIT-JEE Mains & Advanced',
    description:'Physics · Chemistry · Mathematics — JEE Mains + Advanced pattern',
    badge:'🏗️ IIT Entrance',
  },
};

export const IIT_JEE_META = {
  icon:'⚙️', color:'#f39c12', bg:'#f39c1218',
  label:'IIT-JEE', fullLabel:'IIT-JEE Mains & Advanced',
  description:'Physics · Chemistry · Mathematics',
  badge:'🏗️ IIT Entrance',
};

export const UPSC_META = {
  icon:'🇮🇳', color:'#e67e22', bg:'#e67e2218',
  label:'UPSC', fullLabel:'UPSC Civil Services',
  description:'Prelims · Mains GS I–IV · Essay · 10 Optionals',
  badge:'🏛️ Civil Services',
  stages: {
    prelims: {
      icon:'📝', color:'#3498db', label:'Prelims',
      grades: ['UPSC Prelims'],
    },
    mains: {
      icon:'📚', color:'#e67e22', label:'Mains GS + Essay',
      grades: ['UPSC Mains – GS','UPSC Mains – Essay'],
    },
    optional: {
      icon:'🎯', color:'#9b59b6', label:'Optional Subject',
      grades: [
        'Optional – History',
        'Optional – Geography',
        'Optional – Political Science & IR',
        'Optional – Public Administration',
        'Optional – Sociology',
        'Optional – Philosophy',
        'Optional – Economics',
        'Optional – Anthropology',
        'Optional – Psychology',
        'Optional – Law',
        'Optional – Mathematics',
      ],
      labels: {
        'Optional – History':                 '📜 History',
        'Optional – Geography':               '🗺️ Geography',
        'Optional – Political Science & IR':  '🏛️ Political Science',
        'Optional – Public Administration':   '🏢 Public Admin',
        'Optional – Sociology':               '👥 Sociology',
        'Optional – Philosophy':              '🧠 Philosophy',
        'Optional – Economics':               '📊 Economics',
        'Optional – Anthropology':            '🦴 Anthropology',
        'Optional – Psychology':              '💭 Psychology',
        'Optional – Law':                     '⚖️ Law',
        'Optional – Mathematics':             '∑ Mathematics',
      },
    },
  },
};

export const LLB_META = {
  icon:'⚖️', color:'#c0392b', bg:'#c0392b18',
  label:'LLB', fullLabel:'Bachelor of Laws (LLB)',
  description:'Bar Council of Karnataka — 3-Year & 5-Year Integrated LLB',
  badge:'⚖️ Bar Council Karnataka',
  years: LLB_MODES,
  yearLabels: {
    'LLB Year 1':'Year 1 – Foundations',
    'LLB Year 2':'Year 2 – Core Law',
    'LLB Year 3':'Year 3 – Procedure & Practice',
    'LLB Year 4':'Year 4 – Specialisations',
    'LLB Year 5':'Year 5 – Advanced & Dissertation',
  },
};

export const RGUHS_META = {
  icon:'🏥', color:'#16a085', bg:'#16a08518',
  label:'RGUHS', fullLabel:'Rajiv Gandhi University of Health Sciences',
  description:'MBBS · BDS · B.Pharm · B.Sc Nursing · BMLT · BPT · BOT',
  badge:'🎓 RGUHS Karnataka',
  programs: {
    MBBS:  { icon:'🩺', color:'#e74c3c', label:'MBBS',         years:['MBBS Year 1','MBBS Year 2','MBBS Year 3 Part 1','MBBS Final Year'] },
    BDS:   { icon:'🦷', color:'#3498db', label:'BDS',          years:['BDS Year 1','BDS Year 2','BDS Year 3','BDS Final Year'] },
    BPharm:{ icon:'💊', color:'#8e44ad', label:'B.Pharm',      years:['B.Pharm Year 1','B.Pharm Year 2','B.Pharm Year 3','B.Pharm Year 4'] },
    Nursing:{ icon:'💉',color:'#e91e8c', label:'B.Sc Nursing', years:['BSc Nursing Year 1','BSc Nursing Year 2','BSc Nursing Year 3','BSc Nursing Year 4'] },
    BMLT:  { icon:'🔬', color:'#27ae60', label:'BMLT',         years:['BMLT Year 1','BMLT Year 2','BMLT Year 3'] },
    BPT:   { icon:'💪', color:'#e67e22', label:'BPT',          years:['BPT Year 1','BPT Year 2','BPT Year 3','BPT Year 4 & Internship'] },
    BOT:   { icon:'🖐️', color:'#f39c12', label:'BOT',          years:['BOT Year 1','BOT Year 2 & 3'] },
  },
};
