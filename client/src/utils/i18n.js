/**
 * SamarthaaEdu — Internationalisation (i18n)
 * Top 10 world languages + major Indian languages
 * ─────────────────────────────────────────────
 * Languages:
 *   en  — English
 *   hi  — Hindi (हिन्दी)
 *   zh  — Mandarin Chinese (中文)
 *   es  — Spanish (Español)
 *   ar  — Arabic (العربية)  [RTL]
 *   fr  — French (Français)
 *   bn  — Bengali (বাংলা)
 *   pt  — Portuguese (Português)
 *   ru  — Russian (Русский)
 *   ja  — Japanese (日本語)
 *   de  — German (Deutsch)
 *   kn  — Kannada (ಕನ್ನಡ)
 *   te  — Telugu (తెలుగు)
 *   ta  — Tamil (தமிழ்)
 *   mr  — Marathi (मराठी)
 */

export const SUPPORTED_LANGUAGES = [
  { code:'en', label:'English',    native:'English',    flag:'🇬🇧', rtl:false, font:'Nunito' },
  { code:'hi', label:'Hindi',      native:'हिन्दी',       flag:'🇮🇳', rtl:false, font:''      },
  { code:'zh', label:'Chinese',    native:'中文',         flag:'🇨🇳', rtl:false, font:''      },
  { code:'es', label:'Spanish',    native:'Español',    flag:'🇪🇸', rtl:false, font:'Nunito' },
  { code:'ar', label:'Arabic',     native:'العربية',    flag:'🇸🇦', rtl:true,  font:''      },
  { code:'fr', label:'French',     native:'Français',   flag:'🇫🇷', rtl:false, font:'Nunito' },
  { code:'bn', label:'Bengali',    native:'বাংলা',       flag:'🇧🇩', rtl:false, font:''      },
  { code:'pt', label:'Portuguese', native:'Português',  flag:'🇧🇷', rtl:false, font:'Nunito' },
  { code:'ru', label:'Russian',    native:'Русский',    flag:'🇷🇺', rtl:false, font:''      },
  { code:'ja', label:'Japanese',   native:'日本語',       flag:'🇯🇵', rtl:false, font:''      },
  { code:'de', label:'German',     native:'Deutsch',    flag:'🇩🇪', rtl:false, font:'Nunito' },
  { code:'kn', label:'Kannada',    native:'ಕನ್ನಡ',       flag:'🇮🇳', rtl:false, font:''      },
  { code:'te', label:'Telugu',     native:'తెలుగు',      flag:'🇮🇳', rtl:false, font:''      },
  { code:'ta', label:'Tamil',      native:'தமிழ்',       flag:'🇮🇳', rtl:false, font:''      },
  { code:'mr', label:'Marathi',    native:'मराठी',       flag:'🇮🇳', rtl:false, font:''      },
];

export const RTL_LANGUAGES = ['ar'];

export const LANG_TO_TTS = {
  en:'en-IN', hi:'hi-IN', zh:'zh-CN', es:'es-ES', ar:'ar-SA',
  fr:'fr-FR', bn:'bn-IN', pt:'pt-BR', ru:'ru-RU', ja:'ja-JP',
  de:'de-DE', kn:'kn-IN', te:'te-IN', ta:'ta-IN', mr:'mr-IN',
};

// ── UI Translations ─────────────────────────────────────────────────────────
// Keys cover: navigation, common UI, chat, life skills, dashboard
export const UI = {

  // ── Navigation ─────────────────────────────────────────────────────────
  nav_home:       { en:'Home',      hi:'होम',     zh:'主页',   es:'Inicio',  ar:'الرئيسية', fr:'Accueil',  bn:'হোম',    pt:'Início', ru:'Главная', ja:'ホーム',   de:'Startseite', kn:'ಮನೆ',    te:'హోమ్',   ta:'முகப்பு', mr:'मुख्यपृष्ठ' },
  nav_chat:       { en:'Chat',      hi:'चैट',     zh:'聊天',   es:'Chat',    ar:'محادثة',   fr:'Chat',     bn:'চ্যাট',   pt:'Chat',   ru:'Чат',     ja:'チャット', de:'Chat',       kn:'ಚಾಟ್',   te:'చాట్',   ta:'உரையாடல்', mr:'चॅट' },
  nav_quiz:       { en:'Quiz',      hi:'क्विज़',  zh:'测验',   es:'Quiz',    ar:'اختبار',   fr:'Quiz',     bn:'কুইজ',   pt:'Quiz',   ru:'Тест',    ja:'クイズ',   de:'Quiz',       kn:'ರಸಪ್ರಶ್ನೆ', te:'క్విజ్', ta:'வினாடி வினா', mr:'प्रश्नमंजुषा' },
  nav_life:       { en:'Life',      hi:'जीवन',   zh:'生活',   es:'Vida',    ar:'الحياة',   fr:'Vie',      bn:'জীবন',   pt:'Vida',   ru:'Жизнь',   ja:'生活',     de:'Leben',      kn:'ಜೀವನ',  te:'జీవితం', ta:'வாழ்க்கை', mr:'जीवन' },
  nav_progress:   { en:'Progress',  hi:'प्रगति',  zh:'进度',   es:'Progreso',ar:'التقدم',   fr:'Progrès',  bn:'অগ্রগতি', pt:'Progresso', ru:'Прогресс', ja:'進捗',   de:'Fortschritt',kn:'ಪ್ರಗತಿ',te:'పురోగతి',ta:'முன்னேற்றம்', mr:'प्रगती' },
  nav_lab:        { en:'Lab',       hi:'लैब',     zh:'实验室', es:'Lab',     ar:'المختبر',  fr:'Labo',     bn:'ল্যাব',   pt:'Lab',    ru:'Лаб',     ja:'ラボ',     de:'Labor',      kn:'ಲ್ಯಾಬ್', te:'లాబ్',  ta:'ஆய்வகம்', mr:'लॅब' },
  nav_ar:         { en:'AR',        hi:'AR',      zh:'AR',     es:'AR',      ar:'الواقع المعزز', fr:'RA', bn:'AR',    pt:'RA',     ru:'AR',      ja:'AR',       de:'AR',         kn:'AR',     te:'AR',    ta:'AR',     mr:'AR' },
  nav_legacy:     { en:'Legacy',    hi:'विरासत',  zh:'遗产',   es:'Legado',  ar:'الإرث',    fr:'Héritage', bn:'উত্তরাধিকার', pt:'Legado', ru:'Наследие', ja:'レガシー', de:'Vermächtnis', kn:'ಪಾರಂಪರ್ಯ', te:'వారసత్వం', ta:'மரபு', mr:'वारसा' },
  nav_admin:      { en:'Admin',     hi:'एडमिन',  zh:'管理',   es:'Admin',   ar:'المشرف',   fr:'Admin',    bn:'অ্যাডমিন',pt:'Admin', ru:'Админ',   ja:'管理',     de:'Admin',      kn:'ಅಡ್ಮಿನ್',te:'అడ్మిన్',ta:'நிர்வாகி', mr:'अ‍ॅडमिन' },

  // ── Common ──────────────────────────────────────────────────────────────
  logout:         { en:'Logout',    hi:'लॉगआउट', zh:'退出',   es:'Cerrar sesión', ar:'تسجيل الخروج', fr:'Déconnexion', bn:'লগআউট', pt:'Sair', ru:'Выйти', ja:'ログアウト', de:'Abmelden', kn:'ಲಾಗ್ ಔಟ್', te:'లాగ్ అవుట్', ta:'வெளியேறு', mr:'लॉगआउट' },
  loading:        { en:'Loading…',  hi:'लोड हो रहा है…', zh:'加载中…', es:'Cargando…', ar:'جارٍ التحميل…', fr:'Chargement…', bn:'লোড হচ্ছে…', pt:'Carregando…', ru:'Загрузка…', ja:'読み込み中…', de:'Wird geladen…', kn:'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', te:'లోడ్ అవుతోంది…', ta:'ஏற்றுகிறது…', mr:'लोड होत आहे…' },
  save:           { en:'Save',      hi:'सहेजें', zh:'保存',   es:'Guardar', ar:'حفظ',      fr:'Enregistrer', bn:'সংরক্ষণ', pt:'Salvar', ru:'Сохранить', ja:'保存',   de:'Speichern', kn:'ಉಳಿಸು', te:'సేవ్',   ta:'சேமி',   mr:'जतन करा' },
  cancel:         { en:'Cancel',    hi:'रद्द करें', zh:'取消', es:'Cancelar', ar:'إلغاء',  fr:'Annuler',  bn:'বাতিল', pt:'Cancelar', ru:'Отмена', ja:'キャンセル', de:'Abbrechen', kn:'ರದ್ದು', te:'రద్దు', ta:'ரத்து', mr:'रद्द करा' },
  send:           { en:'Send',      hi:'भेजें',  zh:'发送',   es:'Enviar',  ar:'إرسال',   fr:'Envoyer',  bn:'পাঠান', pt:'Enviar', ru:'Отправить', ja:'送信', de:'Senden', kn:'ಕಳುಹಿಸು', te:'పంపు', ta:'அனுப்பு', mr:'पाठवा' },
  search:         { en:'Search',    hi:'खोजें',  zh:'搜索',   es:'Buscar',  ar:'بحث',     fr:'Rechercher',bn:'অনুসন্ধান', pt:'Pesquisar', ru:'Поиск', ja:'検索', de:'Suchen', kn:'ಹುಡುಕಿ', te:'శోధించు', ta:'தேடு', mr:'शोधा' },
  back:           { en:'Back',      hi:'वापस',   zh:'返回',   es:'Atrás',   ar:'رجوع',    fr:'Retour',   bn:'পিছে', pt:'Voltar', ru:'Назад', ja:'戻る', de:'Zurück', kn:'ಹಿಂದೆ', te:'వెనక్కి', ta:'பின்செல்', mr:'मागे' },
  language:       { en:'Language',  hi:'भाषा',   zh:'语言',   es:'Idioma',  ar:'اللغة',   fr:'Langue',   bn:'ভাষা', pt:'Idioma', ru:'Язык', ja:'言語', de:'Sprache', kn:'ಭಾಷೆ', te:'భాష', ta:'மொழி', mr:'भाषा' },
  settings:       { en:'Settings',  hi:'सेटिंग्स', zh:'设置', es:'Ajustes', ar:'الإعدادات', fr:'Paramètres', bn:'সেটিংস', pt:'Configurações', ru:'Настройки', ja:'設定', de:'Einstellungen', kn:'ಸೆಟ್ಟಿಂಗ್', te:'సెట్టింగ్లు', ta:'அமைப்புகள்', mr:'सेटिंग्ज' },
  profile:        { en:'Profile',   hi:'प्रोफ़ाइल', zh:'个人资料', es:'Perfil', ar:'الملف الشخصي', fr:'Profil', bn:'প্রোফাইল', pt:'Perfil', ru:'Профиль', ja:'プロフィール', de:'Profil', kn:'ಪ್ರೊಫೈಲ್', te:'ప్రొఫైల్', ta:'சுயவிவரம்', mr:'प्रोफाईल' },

  // ── Chat page ───────────────────────────────────────────────────────────
  chat_placeholder: { en:'Ask me anything…', hi:'कुछ भी पूछें…', zh:'随便问我…', es:'Pregúntame lo que quieras…', ar:'اسألني أي شيء…', fr:'Posez-moi n\'importe quelle question…', bn:'যেকোনো কিছু জিজ্ঞেস করুন…', pt:'Pergunte-me qualquer coisa…', ru:'Спросите меня о чём угодно…', ja:'何でも聞いてください…', de:'Frag mich alles…', kn:'ಏನಾದರೂ ಕೇಳಿ…', te:'ఏదైనా అడగండి…', ta:'எதையும் கேளுங்கள்…', mr:'काहीही विचारा…' },
  chat_thinking:  { en:'Thinking…', hi:'सोच रहा हूँ…', zh:'思考中…', es:'Pensando…', ar:'أفكر…', fr:'Je réfléchis…', bn:'ভাবছি…', pt:'Pensando…', ru:'Думаю…', ja:'考え中…', de:'Ich denke…', kn:'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…', te:'ఆలోచిస్తున్నాను…', ta:'சிந்திக்கிறேன்…', mr:'विचार करतोय…' },
  chat_new:       { en:'New Chat',  hi:'नई चैट',  zh:'新对话',  es:'Nuevo chat', ar:'محادثة جديدة', fr:'Nouveau chat', bn:'নতুন চ্যাট', pt:'Novo chat', ru:'Новый чат', ja:'新しいチャット', de:'Neuer Chat', kn:'ಹೊಸ ಚಾಟ್', te:'కొత్త చాట్', ta:'புதிய உரையாடல்', mr:'नवीन चॅट' },
  chat_history:   { en:'History',   hi:'इतिहास',  zh:'历史',   es:'Historial', ar:'السجل',  fr:'Historique', bn:'ইতিহাস', pt:'Histórico', ru:'История', ja:'履歴', de:'Verlauf', kn:'ಇತಿಹಾಸ', te:'చరిత్ర', ta:'வரலாறு', mr:'इतिहास' },
  chat_subject:   { en:'Subject',   hi:'विषय',    zh:'科目',   es:'Asignatura', ar:'المادة', fr:'Matière', bn:'বিষয়', pt:'Matéria', ru:'Предмет', ja:'科目', de:'Fach', kn:'ವಿಷಯ', te:'సబ్జెక్ట్', ta:'பாடம்', mr:'विषय' },
  chat_language:  { en:'Answer in:', hi:'उत्तर दें:', zh:'用语言回答:', es:'Responder en:', ar:'أجب بـ:', fr:'Répondre en:', bn:'উত্তর দিন:', pt:'Responder em:', ru:'Ответить на:', ja:'言語で答える:', de:'Antworten auf:', kn:'ಭಾಷೆಯಲ್ಲಿ:', te:'భాషలో:', ta:'மொழியில்:', mr:'भाषेत:' },
  chat_speak:     { en:'Speak',     hi:'बोलें',   zh:'朗读',   es:'Hablar',  ar:'تحدث',   fr:'Parler',  bn:'বলুন', pt:'Falar', ru:'Говорить', ja:'話す', de:'Sprechen', kn:'ಮಾತಾಡು', te:'మాట్లాడు', ta:'பேசு', mr:'बोला' },
  chat_listen:    { en:'Listening…',hi:'सुन रहा हूँ…', zh:'正在听…', es:'Escuchando…', ar:'جارٍ الاستماع…', fr:'J\'écoute…', bn:'শুনছি…', pt:'Ouvindo…', ru:'Слушаю…', ja:'聞いています…', de:'Höre zu…', kn:'ಕೇಳುತ್ತಿದ್ದೇನೆ…', te:'వింటున్నాను…', ta:'கேட்கிறேன்…', mr:'ऐकतोय…' },
  chat_copy:      { en:'Copy',      hi:'कॉपी',   zh:'复制',   es:'Copiar',  ar:'نسخ',    fr:'Copier',  bn:'কপি', pt:'Copiar', ru:'Копировать', ja:'コピー', de:'Kopieren', kn:'ಕಾಪಿ', te:'కాపీ', ta:'நகல்', mr:'कॉपी' },
  chat_copied:    { en:'Copied!',   hi:'कॉपी हुआ!', zh:'已复制!', es:'¡Copiado!', ar:'تم النسخ!', fr:'Copié!', bn:'কপি হয়েছে!', pt:'Copiado!', ru:'Скопировано!', ja:'コピーしました!', de:'Kopiert!', kn:'ನಕಲಾಯಿತು!', te:'కాపీ అయింది!', ta:'நகல் எடுக்கப்பட்டது!', mr:'कॉपी झाले!' },

  // ── Dashboard ───────────────────────────────────────────────────────────
  dash_welcome:   { en:'Welcome back', hi:'वापसी पर स्वागत है', zh:'欢迎回来', es:'Bienvenido de nuevo', ar:'مرحبًا بعودتك', fr:'Bon retour', bn:'স্বাগতম', pt:'Bem-vindo de volta', ru:'С возвращением', ja:'おかえりなさい', de:'Willkommen zurück', kn:'ಮರಳಿ ಸ್ವಾಗತ', te:'తిరిగి స్వాగతం', ta:'மீண்டும் வரவேற்கிறோம்', mr:'परत स्वागत आहे' },
  dash_streak:    { en:'Day Streak',  hi:'दिन की लकीर', zh:'连续天数', es:'Racha de días', ar:'التتابع اليومي', fr:'Jours consécutifs', bn:'দিনের ধারা', pt:'Sequência de dias', ru:'Серия дней', ja:'連続日数', de:'Tagessträhne', kn:'ದಿನ ಸ್ಟ್ರೀಕ್', te:'రోజుల స్ట్రీక్', ta:'நாள் தொடர்', mr:'दिवस स्ट्रीक' },
  dash_quizzes:   { en:'Quizzes',     hi:'क्विज़',     zh:'测验',    es:'Cuestionarios', ar:'الاختبارات', fr:'Quiz',    bn:'কুইজ', pt:'Questionários', ru:'Тесты', ja:'クイズ', de:'Quizze', kn:'ರಸಪ್ರಶ್ನೆಗಳು', te:'క్విజ్లు', ta:'வினாடி வினா', mr:'प्रश्नमंजुषा' },
  dash_start:     { en:'Start Learning', hi:'सीखना शुरू करें', zh:'开始学习', es:'Comenzar a aprender', ar:'ابدأ التعلم', fr:'Commencer à apprendre', bn:'শেখা শুরু করুন', pt:'Começar a aprender', ru:'Начать обучение', ja:'学習を始める', de:'Mit dem Lernen beginnen', kn:'ಕಲಿಕೆ ಪ್ರಾರಂಭಿಸಿ', te:'నేర్చుకోవడం ప్రారంభించండి', ta:'கற்றல் தொடங்கு', mr:'शिकणे सुरू करा' },
  dash_continue:  { en:'Continue',    hi:'जारी रखें',  zh:'继续',    es:'Continuar',    ar:'استمر',     fr:'Continuer',  bn:'চালিয়ে যান', pt:'Continuar', ru:'Продолжить', ja:'続ける', de:'Weiter', kn:'ಮುಂದುವರಿಸು', te:'కొనసాగించు', ta:'தொடர்', mr:'सुरू ठेवा' },
  dash_score:     { en:'Avg Score',   hi:'औसत स्कोर', zh:'平均分',  es:'Puntuación media', ar:'متوسط الدرجات', fr:'Score moyen', bn:'গড় স্কোর', pt:'Pontuação média', ru:'Средний балл', ja:'平均スコア', de:'Durchschnittswert', kn:'ಸರಾಸರಿ ಸ್ಕೋರ್', te:'సగటు స్కోర్', ta:'சராசரி மதிப்பெண்', mr:'सरासरी गुण' },

  // ── Life Skills ─────────────────────────────────────────────────────────
  ls_title:       { en:'Life Skills', hi:'जीवन कौशल', zh:'生活技能', es:'Habilidades de vida', ar:'مهارات الحياة', fr:'Compétences de vie', bn:'জীবন দক্ষতা', pt:'Habilidades de vida', ru:'Жизненные навыки', ja:'ライフスキル', de:'Lebenskompetenzen', kn:'ಜೀವನ ಕೌಶಲ್ಯ', te:'జీవిత నైపుణ్యాలు', ta:'வாழ்க்கை திறன்கள்', mr:'जीवन कौशल्ये' },
  ls_journey:     { en:'Begin your journey today', hi:'आज अपनी यात्रा शुरू करें', zh:'从今天开始你的旅程', es:'Comienza tu viaje hoy', ar:'ابدأ رحلتك اليوم', fr:'Commencez votre voyage aujourd\'hui', bn:'আজ আপনার যাত্রা শুরু করুন', pt:'Comece sua jornada hoje', ru:'Начните своё путешествие сегодня', ja:'今日から旅を始めよう', de:'Beginne deine Reise heute', kn:'ಇಂದು ನಿಮ್ಮ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ', te:'నేడు మీ ప్రయాణం ప్రారంభించండి', ta:'இன்று உங்கள் பயணத்தை தொடங்குங்கள்', mr:'आजच आपला प्रवास सुरू करा' },
  ls_day:         { en:'Day',         hi:'दिन',        zh:'第',      es:'Día',           ar:'اليوم',      fr:'Jour',        bn:'দিন', pt:'Dia', ru:'День', ja:'日', de:'Tag', kn:'ದಿನ', te:'రోజు', ta:'நாள்', mr:'दिवस' },
  ls_streak:      { en:'day streak',  hi:'दिन की लकीर', zh:'天连续', es:'días de racha',  ar:'أيام متتالية', fr:'jours consécutifs', bn:'দিনের ধারা', pt:'dias de sequência', ru:'дней подряд', ja:'日連続', de:'Tage in Folge', kn:'ದಿನ ಸ್ಟ್ರೀಕ್', te:'రోజుల స్ట్రీక్', ta:'நாள் தொடர்', mr:'दिवस सलग' },
  ls_coach:       { en:'AI Coach',    hi:'AI कोच',     zh:'AI教练',  es:'Entrenador IA', ar:'مدرب الذكاء الاصطناعي', fr:'Coach IA', bn:'এআই কোচ', pt:'Treinador de IA', ru:'ИИ-тренер', ja:'AIコーチ', de:'KI-Coach', kn:'AI ಕೋಚ್', te:'AI కోచ్', ta:'AI பயிற்சியாளர்', mr:'AI कोच' },
  ls_habits:      { en:'Daily Habits',hi:'दैनिक आदतें', zh:'每日习惯', es:'Hábitos diarios', ar:'العادات اليومية', fr:'Habitudes quotidiennes', bn:'দৈনিক অভ্যাস', pt:'Hábitos diários', ru:'Ежедневные привычки', ja:'毎日の習慣', de:'Tägliche Gewohnheiten', kn:'ದಿನನಿತ್ಯದ ಅಭ್ಯಾಸ', te:'రోజువారీ అలవాట్లు', ta:'தினசரி பழக்கங்கள்', mr:'दैनंदिन सवयी' },
  ls_reflect:     { en:'Reflect',     hi:'चिंतन',      zh:'反思',    es:'Reflexionar',   ar:'تأمل',        fr:'Réfléchir',  bn:'প্রতিফলন', pt:'Refletir', ru:'Размышлять', ja:'振り返る', de:'Reflektieren', kn:'ಪ್ರತಿಫಲಿಸಿ', te:'ప్రతిబింబించు', ta:'சிந்தி', mr:'विचार करा' },
  ls_journal:     { en:'Journal',     hi:'डायरी',      zh:'日记',    es:'Diario',        ar:'مذكرات',      fr:'Journal',    bn:'জার্নাল', pt:'Diário', ru:'Дневник', ja:'ジャーナル', de:'Tagebuch', kn:'ಡೈರಿ', te:'జర్నల్', ta:'குறிப்பேடு', mr:'डायरी' },
  ls_wellness:    { en:'Wellness Score', hi:'वेलनेस स्कोर', zh:'健康分数', es:'Puntuación de bienestar', ar:'نقاط العافية', fr:'Score de bien-être', bn:'সুস্থতার স্কোর', pt:'Pontuação de bem-estar', ru:'Оценка здоровья', ja:'ウェルネススコア', de:'Wellness-Wert', kn:'ಆರೋಗ್ಯ ಸ್ಕೋರ್', te:'వెల్నెస్ స్కోర్', ta:'நலன் மதிப்பெண்', mr:'वेलनेस गुण' },
  ls_ask_coach:   { en:'Ask your coach anything…', hi:'अपने कोच से कुछ भी पूछें…', zh:'随便问问你的教练…', es:'Pregúntale lo que quieras a tu entrenador…', ar:'اسأل مدربك أي شيء…', fr:'Posez n\'importe quelle question à votre coach…', bn:'আপনার কোচকে যেকোনো কিছু জিজ্ঞেস করুন…', pt:'Pergunte ao seu treinador qualquer coisa…', ru:'Спросите своего тренера о чём угодно…', ja:'コーチに何でも聞いてください…', de:'Frag deinen Coach alles…', kn:'ನಿಮ್ಮ ಕೋಚ್‌ಗೆ ಏನಾದರೂ ಕೇಳಿ…', te:'మీ కోచ్‌ను ఏదైనా అడగండి…', ta:'உங்கள் பயிற்சியாளரிடம் எதையும் கேளுங்கள்…', mr:'तुमच्या कोचला काहीही विचारा…' },
  ls_today_done:  { en:'Done today', hi:'आज पूरा किया', zh:'今天完成', es:'Hecho hoy', ar:'أنجز اليوم', fr:'Fait aujourd\'hui', bn:'আজ সম্পন্ন', pt:'Feito hoje', ru:'Сделано сегодня', ja:'今日達成', de:'Heute erledigt', kn:'ಇಂದು ಮಾಡಲಾಗಿದೆ', te:'నేడు పూర్తయింది', ta:'இன்று முடிந்தது', mr:'आज पूर्ण' },
  ls_offline:     { en:'Offline',    hi:'ऑफलाइन',    zh:'离线',   es:'Sin conexión', ar:'غير متصل', fr:'Hors ligne', bn:'অফলাইন', pt:'Offline', ru:'Не в сети', ja:'オフライン', de:'Offline', kn:'ಆಫ್‌ಲೈನ್', te:'ఆఫ్‌లైన్', ta:'இணையமின்றி', mr:'ऑफलाईन' },

  // ── Quiz ────────────────────────────────────────────────────────────────
  quiz_start:     { en:'Start Quiz',  hi:'क्विज़ शुरू करें', zh:'开始测验', es:'Iniciar quiz', ar:'ابدأ الاختبار', fr:'Démarrer le quiz', bn:'কুইজ শুরু করুন', pt:'Iniciar quiz', ru:'Начать тест', ja:'クイズを始める', de:'Quiz starten', kn:'ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭಿಸಿ', te:'క్విజ్ ప్రారంభించు', ta:'வினாடி வினா தொடங்கு', mr:'क्विझ सुरू करा' },
  quiz_next:      { en:'Next',        hi:'अगला',     zh:'下一题',  es:'Siguiente',   ar:'التالي',    fr:'Suivant',    bn:'পরবর্তী', pt:'Próximo', ru:'Далее', ja:'次へ', de:'Weiter', kn:'ಮುಂದೆ', te:'తర్వాత', ta:'அடுத்து', mr:'पुढे' },
  quiz_submit:    { en:'Submit',      hi:'जमा करें',  zh:'提交',   es:'Enviar',      ar:'إرسال',     fr:'Soumettre',  bn:'জমা দিন', pt:'Enviar', ru:'Отправить', ja:'提出', de:'Einreichen', kn:'ಸಲ್ಲಿಸು', te:'సమర్పించు', ta:'சமர்ப்பி', mr:'सबमिट करा' },
  quiz_score:     { en:'Your score',  hi:'आपका स्कोर', zh:'你的分数', es:'Tu puntuación', ar:'درجتك', fr:'Votre score', bn:'আপনার স্কোর', pt:'Sua pontuação', ru:'Ваш результат', ja:'あなたのスコア', de:'Dein Ergebnis', kn:'ನಿಮ್ಮ ಸ್ಕೋರ್', te:'మీ స్కోర్', ta:'உங்கள் மதிப்பெண்', mr:'तुमचे गुण' },
  quiz_correct:   { en:'Correct!',    hi:'सही!',      zh:'正确！',  es:'¡Correcto!',  ar:'صحيح!',     fr:'Correct!',   bn:'সঠিক!', pt:'Correto!', ru:'Правильно!', ja:'正解！', de:'Richtig!', kn:'ಸರಿಯಾಗಿದೆ!', te:'సరైనది!', ta:'சரி!', mr:'बरोबर!' },
  quiz_wrong:     { en:'Incorrect',   hi:'गलत',       zh:'错误',   es:'Incorrecto',  ar:'خطأ',       fr:'Incorrect',  bn:'ভুল', pt:'Incorreto', ru:'Неверно', ja:'不正解', de:'Falsch', kn:'ತಪ್ಪು', te:'తప్పు', ta:'தவறு', mr:'चुकीचे' },
  quiz_result:    { en:'Quiz Results',hi:'क्विज़ परिणाम', zh:'测验结果', es:'Resultados del quiz', ar:'نتائج الاختبار', fr:'Résultats du quiz', bn:'কুইজ ফলাফল', pt:'Resultados do quiz', ru:'Результаты теста', ja:'クイズ結果', de:'Quiz-Ergebnisse', kn:'ರಸಪ್ರಶ್ನೆ ಫಲಿತಾಂಶ', te:'క్విజ్ ఫలితాలు', ta:'வினாடி வினா முடிவுகள்', mr:'क्विझ निकाल' },

  // ── Login ───────────────────────────────────────────────────────────────
  login_welcome:  { en:'Welcome to SamarthaaEdu', hi:'SamarthaaEdu में स्वागत है', zh:'欢迎来到SamarthaaEdu', es:'Bienvenido a SamarthaaEdu', ar:'مرحبًا بك في SamarthaaEdu', fr:'Bienvenue sur SamarthaaEdu', bn:'SamarthaaEdu-তে স্বাগতম', pt:'Bem-vindo ao SamarthaaEdu', ru:'Добро пожаловать в SamarthaaEdu', ja:'SamarthaaEduへようこそ', de:'Willkommen bei SamarthaaEdu', kn:'SamarthaaEduಗೆ ಸ್ವಾಗತ', te:'SamarthaaEduకు స్వాగతం', ta:'SamarthaaEduக்கு வரவேற்கிறோம்', mr:'SamarthaaEduमध्ये स्वागत आहे' },
  login_email:    { en:'Email',        hi:'ईमेल',      zh:'邮箱',   es:'Correo electrónico', ar:'البريد الإلكتروني', fr:'Email', bn:'ইমেইল', pt:'Email', ru:'Эл. почта', ja:'メール', de:'E-Mail', kn:'ಇಮೇಲ್', te:'ఇమెయిల్', ta:'மின்னஞ்சல்', mr:'ईमेल' },
  login_password: { en:'Password',     hi:'पासवर्ड',   zh:'密码',   es:'Contraseña', ar:'كلمة المرور', fr:'Mot de passe', bn:'পাসওয়ার্ড', pt:'Senha', ru:'Пароль', ja:'パスワード', de:'Passwort', kn:'ಪಾಸ್‌ವರ್ಡ್', te:'పాస్‌వర్డ్', ta:'கடவுச்சொல்', mr:'पासवर्ड' },
  login_signin:   { en:'Sign In',      hi:'साइन इन',   zh:'登录',   es:'Iniciar sesión', ar:'تسجيل الدخول', fr:'Se connecter', bn:'সাইন ইন', pt:'Entrar', ru:'Войти', ja:'サインイン', de:'Anmelden', kn:'ಸೈನ್ ಇನ್', te:'సైన్ ఇన్', ta:'உள்நுழை', mr:'साइन इन' },
  login_register: { en:'Register',     hi:'रजिस्टर',  zh:'注册',   es:'Registrarse', ar:'التسجيل',    fr:'S\'inscrire', bn:'নিবন্ধন করুন', pt:'Registrar', ru:'Зарегистрироваться', ja:'登録', de:'Registrieren', kn:'ನೋಂದಾಯಿಸಿ', te:'నమోదు చేసుకో', ta:'பதிவு செய்', mr:'नोंदणी करा' },

  // ── AI Coach / Life Skills Coach ─────────────────────────────────────────
  coach_response_lang: { en:'Respond in:', hi:'जवाब दें:', zh:'回应语言:', es:'Responder en:', ar:'الرد بـ:', fr:'Répondre en:', bn:'উত্তর দিন:', pt:'Responder em:', ru:'Отвечать на:', ja:'返答言語:', de:'Antworten auf:', kn:'ಉತ್ತರ ಭಾಷೆ:', te:'సమాధాన భాష:', ta:'பதில் மொழி:', mr:'उत्तर भाषा:' },
  coach_voice_input:   { en:'Voice input', hi:'आवाज़ इनपुट', zh:'语音输入', es:'Entrada de voz', ar:'الإدخال الصوتي', fr:'Entrée vocale', bn:'ভয়েস ইনপুট', pt:'Entrada de voz', ru:'Голосовой ввод', ja:'音声入力', de:'Spracheingabe', kn:'ಧ್ವನಿ ಇನ್‌ಪುಟ್', te:'వాయిస్ ఇన్‌పుట్', ta:'குரல் உள்ளீடு', mr:'व्हॉइस इनपुट' },
};

// ── Translate helper ────────────────────────────────────────────────────────
/**
 * t(key, langCode) — returns the translation for a UI key
 * Falls back to English if the language/key is not found
 */
export function t(key, lang = 'en') {
  return UI[key]?.[lang] ?? UI[key]?.['en'] ?? key;
}

/**
 * getLangMeta(code) — returns the SUPPORTED_LANGUAGES entry for a code
 */
export function getLangMeta(code) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

/**
 * isRTL(code) — true if the language is right-to-left
 */
export function isRTL(code) {
  return RTL_LANGUAGES.includes(code);
}
