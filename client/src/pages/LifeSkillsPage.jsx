import { useState, useRef, useEffect } from 'react';
import { useLifeProgress } from '../hooks/useLifeProgress';
import { useSensors } from '../hooks/useSensors';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

import { VoiceButton, SedentaryBanner, FitnessStats, ScreenTimeWidget, NotificationSettings, FoodCamera } from '../components/SensorsPanel';
import SensorsPanel from '../components/SensorsPanel';

// ── Colour system ──────────────────────────────────────────────────────────
const MODULES = {
  finance: {
    id: 'finance', icon: '💰', label: 'Financial Literacy',
    accent: '#f4a261', accentDim: 'rgba(244,162,97,0.12)', accentBorder: 'rgba(244,162,97,0.3)',
    tagline: 'Build wealth slowly, build character first.',
  },
  ethics: {
    id: 'ethics', icon: '🌿', label: 'Ethics & Values',
    accent: '#52b788', accentDim: 'rgba(82,183,136,0.12)', accentBorder: 'rgba(82,183,136,0.3)',
    tagline: 'Who you are in the dark defines who you become in the light.',
  },
  relationships: {
    id: 'relationships', icon: '🤝', label: 'Relationships',
    accent: '#e07a5f', accentDim: 'rgba(224,122,95,0.12)', accentBorder: 'rgba(224,122,95,0.3)',
    tagline: 'Every relationship is a mirror. Look carefully.',
  },
  fitness: {
    id: 'fitness', icon: '💪', label: 'Fitness',
    accent: '#4cc9f0', accentDim: 'rgba(76,201,240,0.12)', accentBorder: 'rgba(76,201,240,0.3)',
    tagline: 'Your body is the only place you will live forever. Treat it accordingly.',
  },
  grooming: {
    id: 'grooming', icon: '✨', label: 'Grooming',
    accent: '#c77dff', accentDim: 'rgba(199,125,255,0.12)', accentBorder: 'rgba(199,125,255,0.3)',
    tagline: 'How you present yourself is how the world perceives you.',
  },
  lifestyle: {
    id: 'lifestyle', icon: '🌅', label: 'Lifestyle',
    accent: '#ffd166', accentDim: 'rgba(255,209,102,0.12)', accentBorder: 'rgba(255,209,102,0.3)',
    tagline: 'Design your life deliberately, or life will design it for you.',
  },
  etiquette: {
    id: 'etiquette', icon: '🎩', label: 'Etiquette',
    accent: '#b5e48c', accentDim: 'rgba(181,228,140,0.12)', accentBorder: 'rgba(181,228,140,0.3)',
    tagline: 'Good manners cost nothing but open every door.',
  },
  criticalthinking: {
    id: 'criticalthinking', icon: '🧠', label: 'Critical Thinking',
    accent: '#a8dadc', accentDim: 'rgba(168,218,220,0.12)', accentBorder: 'rgba(168,218,220,0.3)',
    tagline: 'The mind is not a vessel to be filled, but a fire to be kindled.',
  },
  publicspeaking: {
    id: 'publicspeaking', icon: '🎤', label: 'Public Speaking',
    accent: '#ff6b6b', accentDim: 'rgba(255,107,107,0.12)', accentBorder: 'rgba(255,107,107,0.3)',
    tagline: 'There are two types of speakers: those who are nervous and those who are liars.',
  },
  legalliteracy: {
    id: 'legalliteracy', icon: '⚖️', label: 'Legal Literacy',
    accent: '#f9c74f', accentDim: 'rgba(249,199,79,0.12)', accentBorder: 'rgba(249,199,79,0.3)',
    tagline: 'Ignorance of the law is no excuse — and no protection.',
  },
  emotionalintelligence: {
    id: 'emotionalintelligence', icon: '❤️', label: 'Emotional Intelligence',
    accent: '#f72585', accentDim: 'rgba(247,37,133,0.12)', accentBorder: 'rgba(247,37,133,0.3)',
    tagline: 'Anyone can be angry. But to be angry with the right person, to the right degree — that is not easy.',
  },
  firstaid: {
    id: 'firstaid', icon: '🩺', label: 'First Aid & Safety',
    accent: '#90e0ef', accentDim: 'rgba(144,224,239,0.12)', accentBorder: 'rgba(144,224,239,0.3)',
    tagline: 'In the first minutes of an emergency, you are the help until help arrives.',
  },
  sleep: {
    id: 'sleep', icon: '💤', label: 'Sleep Science',
    accent: '#7b68ee', accentDim: 'rgba(123,104,238,0.12)', accentBorder: 'rgba(123,104,238,0.3)',
    tagline: 'Sleep is the golden chain that ties health and our bodies together.',
  },
  cooking: {
    id: 'cooking', icon: '🍳', label: 'Cooking & Nutrition',
    accent: '#ff9f43', accentDim: 'rgba(255,159,67,0.12)', accentBorder: 'rgba(255,159,67,0.3)',
    tagline: 'Let food be thy medicine and medicine be thy food.',
  },
  timemanagement: {
    id: 'timemanagement', icon: '⏰', label: 'Time Management',
    accent: '#26de81', accentDim: 'rgba(38,222,129,0.12)', accentBorder: 'rgba(38,222,129,0.3)',
    tagline: 'It is not enough to be busy. The question is: what are we busy about?',
  },
  careerplanning: {
    id: 'careerplanning', icon: '💼', label: 'Career Planning',
    accent: '#fd9644', accentDim: 'rgba(253,150,68,0.12)', accentBorder: 'rgba(253,150,68,0.3)',
    tagline: 'Choose a job you love and you will never have to work a day in your life.',
  },
  digitalliteracy: {
    id: 'digitalliteracy', icon: '🌐', label: 'Digital Literacy',
    accent: '#48cae4', accentDim: 'rgba(72,202,228,0.12)', accentBorder: 'rgba(72,202,228,0.3)',
    tagline: 'On the internet, if you are not paying for the product, you are the product.',
  },
  environment: {
    id: 'environment', icon: '🌱', label: 'Environmental Awareness',
    accent: '#74c69d', accentDim: 'rgba(116,198,157,0.12)', accentBorder: 'rgba(116,198,157,0.3)',
    tagline: 'We do not inherit the earth from our ancestors — we borrow it from our children.',
  },
  mindfulness: {
    id: 'mindfulness', icon: '🧘', label: 'Mindfulness & Inner Life',
    accent: '#c8b6ff', accentDim: 'rgba(200,182,255,0.12)', accentBorder: 'rgba(200,182,255,0.3)',
    tagline: 'The present moment is the only moment available to us, and it is the door to all moments.',
  },
  civic: {
    id: 'civic', icon: '🏛️', label: 'Civic Responsibility',
    accent: '#f8961e', accentDim: 'rgba(248,150,30,0.12)', accentBorder: 'rgba(248,150,30,0.3)',
    tagline: 'The price of liberty is eternal vigilance.',
  },
  homemanagement: {
    id: 'homemanagement', icon: '🏡', label: 'Home Management',
    accent: '#80b918', accentDim: 'rgba(128,185,24,0.12)', accentBorder: 'rgba(128,185,24,0.3)',
    tagline: 'Home is not a place — it is a feeling you build deliberately.',
  },
  lifestages: {
    id: 'lifestages', icon: '👶', label: 'Life Stages',
    accent: '#ee9b00', accentDim: 'rgba(238,155,0,0.12)', accentBorder: 'rgba(238,155,0,0.3)',
    tagline: 'Every age has its own wisdom — and its own work to do.',
  },
};

// ── Wisdom quotes ──────────────────────────────────────────────────────────
const QUOTES = {
  finance: [
    { text: 'Do not save what is left after spending, but spend what is left after saving.', by: 'Warren Buffett' },
    { text: 'Financial freedom is available to those who learn about it and work for it.', by: 'Robert Kiyosaki' },
    { text: 'A budget is telling your money where to go instead of wondering where it went.', by: 'Dave Ramsey' },
    { text: 'The goal is not to be rich. The goal is to be free.', by: 'T. Harv Eker' },
    { text: 'It is not your salary that makes you rich; it is your spending habits.', by: 'Charles Jaffe' },
  ],
  ethics: [
    { text: 'The true measure of a man is how he treats someone who can do him absolutely no good.', by: 'Samuel Johnson' },
    { text: 'Character is doing the right thing when nobody is looking.', by: 'J.C. Watts' },
    { text: 'In matters of style, swim with the current. In matters of principle, stand like a rock.', by: 'Mahatma Gandhi' },
    { text: 'Integrity is doing the right thing, even when no one is watching.', by: 'C.S. Lewis' },
    { text: 'Your reputation is what others think of you; your character is what God knows of you.', by: 'Thomas Paine' },
  ],
  relationships: [
    { text: 'The quality of your life is the quality of your relationships.', by: 'Tony Robbins' },
    { text: 'You are the average of the five people you spend the most time with.', by: 'Jim Rohn' },
    { text: 'Speak when you are angry and you will make the best speech you will ever regret.', by: 'Ambrose Bierce' },
    { text: 'Attention is the rarest and purest form of generosity.', by: 'Simone Weil' },
    { text: 'The most important thing in the world is family and love.', by: 'John Wooden' },
  ],
  fitness: [
    { text: 'Take care of your body. It is the only place you have to live.', by: 'Jim Rohn' },
    { text: 'Exercise is a celebration of what your body can do, not a punishment for what you ate.', by: 'Unknown' },
    { text: 'The groundwork for all happiness is good health.', by: 'Leigh Hunt' },
    { text: 'Motivation gets you started. Habit keeps you going.', by: 'Jim Ryun' },
    { text: 'A man too busy to take care of his health is like a mechanic too busy to take care of his tools.', by: 'Spanish Proverb' },
  ],
  grooming: [
    { text: 'You never get a second chance to make a first impression.', by: 'Will Rogers' },
    { text: 'Dress shabbily and they remember the dress. Dress impeccably and they remember the person.', by: 'Coco Chanel' },
    { text: 'The secret to looking great is feeling great.', by: 'Unknown' },
    { text: 'Elegance is not about being noticed, it is about being remembered.', by: 'Giorgio Armani' },
    { text: 'Style is knowing who you are and what you want to say.', by: 'Quentin Crisp' },
  ],
  lifestyle: [
    { text: 'Your lifestyle is your brand.', by: 'Unknown' },
    { text: 'The way you live your days is the way you live your life.', by: 'Annie Dillard' },
    { text: 'Simplicity is the ultimate sophistication.', by: 'Leonardo da Vinci' },
    { text: 'You can have anything you want, but not everything you want.', by: 'Peter McWilliams' },
    { text: 'Beware the barrenness of a busy life.', by: 'Socrates' },
  ],
  etiquette: [
    { text: 'Politeness is the art of choosing among one\'s real thoughts.', by: 'Abel Stevens' },
    { text: 'Rudeness is the weak person\'s imitation of strength.', by: 'Eric Hoffer' },
    { text: 'The measure of a person\'s greatness is what it takes to upset them.', by: 'Unknown' },
    { text: 'A person who has good thoughts cannot ever be ugly.', by: 'Roald Dahl' },
    { text: 'Treat everyone with politeness, even those who are rude to you.', by: 'Unknown' },
  ],
  criticalthinking: [
    { text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.', by: 'Richard Feynman' },
    { text: 'It is the mark of an educated mind to be able to entertain a thought without accepting it.', by: 'Aristotle' },
    { text: 'Question everything. Learn something. Answer nothing.', by: 'Euripides' },
    { text: 'The trouble with the world is that the stupid are cocksure and the intelligent are full of doubt.', by: 'Bertrand Russell' },
    { text: 'Think for yourself and let others enjoy the privilege of doing so too.', by: 'Voltaire' },
  ],
  publicspeaking: [
    { text: 'All the great speakers were bad speakers at first.', by: 'Ralph Waldo Emerson' },
    { text: 'Speak clearly, if you speak at all; carve every word before you let it fall.', by: 'Oliver Wendell Holmes' },
    { text: 'It usually takes me more than three weeks to prepare a good impromptu speech.', by: 'Mark Twain' },
    { text: 'The right word may be effective, but no word was ever as effective as a rightly timed pause.', by: 'Mark Twain' },
    { text: 'If you cannot explain it simply, you do not understand it well enough.', by: 'Albert Einstein' },
  ],
  legalliteracy: [
    { text: 'Knowledge of our rights is the first condition of our liberty.', by: 'Unknown' },
    { text: 'Law is not justice, and a trial is not a scientific inquiry into truth.', by: 'Franz Kafka' },
    { text: 'Where law ends, tyranny begins.', by: 'William Pitt' },
    { text: 'An unjust law is no law at all.', by: 'St. Augustine' },
    { text: 'The life of the law has not been logic; it has been experience.', by: 'Oliver Wendell Holmes Jr.' },
  ],
  emotionalintelligence: [
    { text: 'Between stimulus and response there is a space. In that space is our power to choose.', by: 'Viktor Frankl' },
    { text: 'Feelings are not supposed to be logical. Dangerous is the man who has rationalised his emotions.', by: 'David Borenstein' },
    { text: 'The emotionally intelligent person is skilled in four areas: identifying emotions, using emotions, understanding emotions, and regulating emotions.', by: 'John Mayer' },
    { text: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.', by: 'Carl Jung' },
    { text: 'You don\'t have to control your thoughts. You just have to stop letting them control you.', by: 'Dan Millman' },
  ],
  firstaid: [
    { text: 'The best preparation for tomorrow is doing your best today.', by: 'H. Jackson Brown Jr.' },
    { text: 'One person with the right knowledge at the right time can save a life.', by: 'Unknown' },
    { text: 'Safety is not a gadget but a state of mind.', by: 'Eleanor Everet' },
    { text: 'First aid is not just about bandages. It is about being present when someone needs you most.', by: 'Unknown' },
    { text: 'The time to prepare is before the emergency, not during it.', by: 'Unknown' },
  ],
  sleep: [
    { text: 'Sleep is the best meditation.', by: 'Dalai Lama' },
    { text: 'A good laugh and a long sleep are the best cures in the doctor\'s book.', by: 'Irish Proverb' },
    { text: 'The shorter you sleep, the shorter your life.', by: 'Matthew Walker' },
    { text: 'Sleep is not a waste of time. It is the most productive thing you can do for tomorrow.', by: 'Unknown' },
    { text: 'Each night, when I go to sleep, I die. And the next morning, when I wake up, I am reborn.', by: 'Mahatma Gandhi' },
  ],
  cooking: [
    { text: 'Cooking is not just about food. It is about taking care of people.', by: 'Unknown' },
    { text: 'The secret ingredient is always love. But a close second is butter.', by: 'Unknown' },
    { text: 'Tell me what you eat, and I will tell you who you are.', by: 'Jean Anthelme Brillat-Savarin' },
    { text: 'Cooking is like painting or writing a song — with practice and creativity, it becomes art.', by: 'Unknown' },
    { text: 'You don\'t have to cook fancy or complicated masterpieces — just good food from fresh ingredients.', by: 'Julia Child' },
  ],
  timemanagement: [
    { text: 'You cannot manage time. You can only manage yourself.', by: 'Peter Drucker' },
    { text: 'The key is not to prioritise what is on your schedule, but to schedule your priorities.', by: 'Stephen Covey' },
    { text: 'Either you run the day, or the day runs you.', by: 'Jim Rohn' },
    { text: 'Lack of time is actually lack of priorities.', by: 'Tim Ferriss' },
    { text: 'Busy is a decision. So is rest. So is depth.', by: 'Debbie Millman' },
  ],
  careerplanning: [
    { text: 'The only way to do great work is to love what you do.', by: 'Steve Jobs' },
    { text: 'Your career is a garden — you reap exactly what you plant and tend.', by: 'Unknown' },
    { text: 'Do not follow your passion. Follow your contribution.', by: 'Mike Rowe' },
    { text: 'Success usually comes to those who are too busy to be looking for it.', by: 'Henry David Thoreau' },
    { text: 'Opportunities are not offered. They are seized, created, and worked for.', by: 'Sheryl Sandberg' },
  ],
  digitalliteracy: [
    { text: 'Privacy is not something that I am merely entitled to, it is an absolute prerequisite.', by: 'Marlon Brando' },
    { text: 'The internet is the first thing that humanity has built that humanity does not understand.', by: 'Eric Schmidt' },
    { text: 'It takes 20 years to build a reputation and five minutes to ruin it online.', by: 'Warren Buffett' },
    { text: 'Think before you post — the internet never forgets.', by: 'Unknown' },
    { text: 'Digital literacy is not about technology. It is about being a thoughtful citizen of the world.', by: 'Unknown' },
  ],
  environment: [
    { text: 'The earth does not belong to us. We belong to the earth.', by: 'Chief Seattle' },
    { text: 'In every walk with nature, one receives far more than one seeks.', by: 'John Muir' },
    { text: 'What we are doing to the forests of the world is but a mirror reflection of what we are doing to ourselves.', by: 'Mahatma Gandhi' },
    { text: 'The environment is where we all meet, where all have a mutual interest — it is the one thing all of us share.', by: 'Lady Bird Johnson' },
    { text: 'Small acts, when multiplied by millions of people, can transform the world.', by: 'Howard Zinn' },
  ],
  mindfulness: [
    { text: 'You cannot stop the waves, but you can learn to surf.', by: 'Jon Kabat-Zinn' },
    { text: 'The present moment is the only moment available to us, and it is the door to all moments.', by: 'Thich Nhat Hanh' },
    { text: 'Wherever you are, be all there.', by: 'Jim Elliot' },
    { text: 'If you want to conquer the anxiety of life, live in the moment, live in the breath.', by: 'Amit Ray' },
    { text: 'Meditation is not about feeling a certain way. It is about feeling the way you feel.', by: 'Dan Harris' },
  ],
  civic: [
    { text: 'The world is not dangerous because of those who do harm but because of those who look at it without doing anything.', by: 'Albert Einstein' },
    { text: 'Ask not what your country can do for you — ask what you can do for your country.', by: 'John F. Kennedy' },
    { text: 'Democracy is not something that happens only at election time. It is an everyday practice.', by: 'Unknown' },
    { text: 'The most common way people give up their power is by thinking they don\'t have any.', by: 'Alice Walker' },
    { text: 'Bad officials are elected by good citizens who don\'t vote.', by: 'George Jean Nathan' },
  ],
  homemanagement: [
    { text: 'A place for everything, and everything in its place.', by: 'Benjamin Franklin' },
    { text: 'Your home should tell the story of who you are and be a collection of what you love.', by: 'Nate Berkus' },
    { text: 'The objective of cleaning is not just to clean, but to feel happiness living within that environment.', by: 'Marie Kondo' },
    { text: 'Owning less is better than organising more.', by: 'Joshua Becker' },
    { text: 'A clean home is a clean mind.', by: 'Unknown' },
  ],
  lifestages: [
    { text: 'Life is not a problem to be solved but a reality to be experienced.', by: 'Søren Kierkegaard' },
    { text: 'You are not the same person you were a year ago, a month ago, or a week ago. You are always growing.', by: 'Unknown' },
    { text: 'The privilege of a lifetime is being who you are.', by: 'Joseph Campbell' },
    { text: 'It is not how old you are but how you are old.', by: 'Jules Renard' },
    { text: 'Life must be lived forward but it can only be understood backward.', by: 'Søren Kierkegaard' },
  ],
};

// ── Daily habits ───────────────────────────────────────────────────────────
const HABITS = {
  finance: [
    { id:'f1', text:'Logged every rupee I spent today' },
    { id:'f2', text:'Said no to one unnecessary purchase' },
    { id:'f3', text:'Transferred money to savings first' },
    { id:'f4', text:'Checked my net worth / account balance' },
    { id:'f5', text:'Read or listened to something about finance' },
    { id:'f6', text:'Planned tomorrow\'s spending in advance' },
  ],
  ethics: [
    { id:'e1', text:'Told the truth even when it was uncomfortable' },
    { id:'e2', text:'Kept a promise I made to someone' },
    { id:'e3', text:'Did something kind without expecting anything back' },
    { id:'e4', text:'Admitted a mistake and took responsibility' },
    { id:'e5', text:'Paused before reacting in a difficult situation' },
    { id:'e6', text:'Asked myself: "Is this the right thing to do?"' },
  ],
  relationships: [
    { id:'r1', text:'Put my phone away during a conversation' },
    { id:'r2', text:'Expressed genuine appreciation to someone' },
    { id:'r3', text:'Listened without interrupting or advising' },
    { id:'r4', text:'Reached out to someone I haven\'t spoken to in a while' },
    { id:'r5', text:'Resolved or addressed a tension rather than avoiding it' },
    { id:'r6', text:'Spent meaningful time with family' },
  ],
  fitness: [
    { id:'fit1', text:'Got at least 30 minutes of movement today' },
    { id:'fit2', text:'Drank at least 2 litres of water' },
    { id:'fit3', text:'Slept 7–8 hours last night' },
    { id:'fit4', text:'Ate at least 2 proper meals with vegetables' },
    { id:'fit5', text:'Took stairs or walked instead of using a vehicle' },
    { id:'fit6', text:'Did stretching or mobility work' },
  ],
  grooming: [
    { id:'g1', text:'Showered and used deodorant / antiperspirant' },
    { id:'g2', text:'Brushed teeth morning and night' },
    { id:'g3', text:'Clothes are clean, ironed, and appropriate' },
    { id:'g4', text:'Hair is clean and styled intentionally' },
    { id:'g5', text:'Nails are trimmed and clean' },
    { id:'g6', text:'Moisturised face / applied sunscreen (SPF 30+)' },
  ],
  lifestyle: [
    { id:'l1', text:'Woke up without hitting snooze' },
    { id:'l2', text:'Spent at least 20 minutes on something I love' },
    { id:'l3', text:'Had no screens for the first 30 minutes of my day' },
    { id:'l4', text:'Read or listened to something that grew my mind' },
    { id:'l5', text:'Planned tomorrow before bed' },
    { id:'l6', text:'Spent time in nature or fresh air' },
  ],
  etiquette: [
    { id:'et1', text:'Greeted everyone I met with eye contact and a smile' },
    { id:'et2', text:'Said please, thank you, and excuse me as needed' },
    { id:'et3', text:'Was on time for every commitment' },
    { id:'et4', text:'Kept my phone silent in social/professional settings' },
    { id:'et5', text:'Listened without interrupting in conversations' },
    { id:'et6', text:'Replied to messages and emails within a reasonable time' },
  ],
  criticalthinking: [
    { id:'ct1', text:'Questioned at least one assumption I held today' },
    { id:'ct2', text:'Verified a piece of news or information before sharing it' },
    { id:'ct3', text:'Considered the opposite of my own view on something' },
    { id:'ct4', text:'Identified one logical fallacy in something I read or heard' },
    { id:'ct5', text:'Made a decision using evidence rather than gut feeling alone' },
    { id:'ct6', text:'Asked "why?" or "how do we know?" at least once today' },
  ],
  publicspeaking: [
    { id:'ps1', text:'Spoke clearly and confidently in at least one interaction' },
    { id:'ps2', text:'Practised speaking for 5 minutes — aloud, not in my head' },
    { id:'ps3', text:'Made eye contact instead of looking away when speaking' },
    { id:'ps4', text:'Paused before answering instead of rushing my words' },
    { id:'ps5', text:'Eliminated filler words (um, like, basically) in one conversation' },
    { id:'ps6', text:'Volunteered to speak up in a group setting' },
  ],
  legalliteracy: [
    { id:'ll1', text:'Read or learned something about my legal rights today' },
    { id:'ll2', text:'Read a document or agreement before signing or accepting it' },
    { id:'ll3', text:'Checked if a deal, offer, or situation seemed legally sound' },
    { id:'ll4', text:'Kept a record or receipt of an important transaction' },
    { id:'ll5', text:'Asked a question rather than assuming something was legal/okay' },
    { id:'ll6', text:'Knew what to do or who to call if a legal issue arose' },
  ],
  emotionalintelligence: [
    { id:'ei1', text:'Named the emotion I was feeling rather than just reacting to it' },
    { id:'ei2', text:'Paused before responding when I felt triggered or upset' },
    { id:'ei3', text:'Asked how someone else was feeling — and genuinely listened' },
    { id:'ei4', text:'Noticed my body signals (tense jaw, tight chest) before they escalated' },
    { id:'ei5', text:'Chose my response rather than just reacting automatically' },
    { id:'ei6', text:'Practised self-compassion instead of harsh self-criticism' },
  ],
  firstaid: [
    { id:'fa1', text:'I know where the first aid kit is at home and work' },
    { id:'fa2', text:'I reviewed or practised one emergency skill today' },
    { id:'fa3', text:'I know the emergency numbers for my city (112, fire, poison)' },
    { id:'fa4', text:'I checked that someone around me knew basic CPR or first aid' },
    { id:'fa5', text:'I identified one safety risk at home and addressed it' },
    { id:'fa6', text:'I shared an emergency skill or safety tip with someone today' },
  ],
  sleep: [
    { id:'sl1', text:'Was in bed by a consistent time (within 30 min of usual)' },
    { id:'sl2', text:'No screens for 30 minutes before bed' },
    { id:'sl3', text:'Kept the room cool, dark, and quiet for sleep' },
    { id:'sl4', text:'Got 7–9 hours of sleep last night' },
    { id:'sl5', text:'Woke up without an alarm or with only one alarm' },
    { id:'sl6', text:'No caffeine after 2 PM today' },
  ],
  cooking: [
    { id:'ck1', text:'Cooked at least one meal from scratch today' },
    { id:'ck2', text:'Ate at least one serving of vegetables with a meal' },
    { id:'ck3', text:'Drank at least 8 glasses of water' },
    { id:'ck4', text:'Avoided ultra-processed food for at least one meal' },
    { id:'ck5', text:'Read the nutrition label of something I bought or ate' },
    { id:'ck6', text:'Planned or prepped food for tomorrow' },
  ],
  timemanagement: [
    { id:'tm1', text:'Identified my single most important task before starting the day' },
    { id:'tm2', text:'Completed at least one deep work block without interruption' },
    { id:'tm3', text:'Said no to or deferred one low-priority request' },
    { id:'tm4', text:'Did not check phone or social media in the first hour of my day' },
    { id:'tm5', text:'Planned tomorrow\'s schedule before ending today' },
    { id:'tm6', text:'Finished what I started before moving to the next task' },
  ],
  careerplanning: [
    { id:'cp1', text:'Took one concrete step toward a career goal today' },
    { id:'cp2', text:'Learned one new skill or piece of knowledge relevant to my field' },
    { id:'cp3', text:'Connected with or followed up with someone in my professional network' },
    { id:'cp4', text:'Updated or reflected on my career goals and direction' },
    { id:'cp5', text:'Did something that built my portfolio, reputation, or visibility' },
    { id:'cp6', text:'Read or listened to something about my industry or area of interest' },
  ],
  digitalliteracy: [
    { id:'dl1', text:'Used a strong, unique password or password manager today' },
    { id:'dl2', text:'Verified a piece of information before sharing or believing it' },
    { id:'dl3', text:'Checked privacy settings on at least one app or account' },
    { id:'dl4', text:'Did not click any suspicious link or attachment today' },
    { id:'dl5', text:'Was mindful of what personal information I shared online' },
    { id:'dl6', text:'Took a deliberate break from social media for at least 1 hour' },
  ],
  environment: [
    { id:'en1', text:'Chose not to use single-use plastic today' },
    { id:'en2', text:'Walked, cycled, or used public transport instead of a private vehicle' },
    { id:'en3', text:'Turned off lights, fans, or devices when not in use' },
    { id:'en4', text:'Avoided food waste — finished what was on my plate' },
    { id:'en5', text:'Made a purchase decision considering its environmental impact' },
    { id:'en6', text:'Learned something new about environmental issues in India' },
  ],
  mindfulness: [
    { id:'mn1', text:'Spent at least 5 minutes in silent, focused breathing or meditation' },
    { id:'mn2', text:'Noticed my thoughts without being swept away by them' },
    { id:'mn3', text:'Put the phone down and was fully present with a person or activity' },
    { id:'mn4', text:'Wrote in a journal or spent time in quiet self-reflection' },
    { id:'mn5', text:'Paused and took 3 conscious breaths before reacting to stress' },
    { id:'mn6', text:'Named one thing I am genuinely grateful for today' },
  ],
  civic: [
    { id:'cv1', text:'Read or watched something about what is happening in my city or country' },
    { id:'cv2', text:'Engaged thoughtfully with a civic or social issue — online or offline' },
    { id:'cv3', text:'Paid taxes, followed a law, or fulfilled a civic duty today' },
    { id:'cv4', text:'Spoke up or took action on something that was wrong rather than staying silent' },
    { id:'cv5', text:'Was kind and respectful to a public servant, worker, or stranger' },
    { id:'cv6', text:'Thought about or discussed the kind of society I want to help build' },
  ],
  homemanagement: [
    { id:'hm1', text:'Made my bed and tidied my immediate space in the morning' },
    { id:'hm2', text:'Cleaned or organised at least one area of my home' },
    { id:'hm3', text:'Dealt with a home maintenance or administrative task I had been deferring' },
    { id:'hm4', text:'Tracked or reviewed a household expense today' },
    { id:'hm5', text:'Prepared or planned at least one meal at home' },
    { id:'hm6', text:'Did something that made my living space feel more like home' },
  ],
  lifestages: [
    { id:'ls1', text:'Reflected on where I am in life and what this stage requires of me' },
    { id:'ls2', text:'Had a meaningful conversation with someone at a different life stage' },
    { id:'ls3', text:'Did something that aligned with my values and long-term self' },
    { id:'ls4', text:'Took care of a relationship that matters for my future' },
    { id:'ls5', text:'Learned something about the next life stage I am approaching' },
    { id:'ls6', text:'Made a decision I will be proud of in 10 years' },
  ],
};

// ── Reflection prompts ─────────────────────────────────────────────────────
const REFLECTIONS = {
  finance: [
    'What is one money habit from your childhood that still affects you today?',
    'If your salary doubled tomorrow, what would you do differently?',
    'What does financial freedom mean to you — and what is your number?',
    'What is one thing you regularly spend money on that doesn\'t actually make you happy?',
    'Who taught you about money? What did they get right? What did they get wrong?',
  ],
  ethics: [
    'Describe a time you did the right thing when it cost you something.',
    'What is one value you hold that most people around you don\'t share?',
    'When have you compromised your values? What did you learn?',
    'If everyone could see your private thoughts for one day, what would they see?',
    'What does it mean to live with integrity in your specific life and context?',
  ],
  relationships: [
    'Who in your life deserves more of your time and attention than they get?',
    'What is one relationship pattern you keep repeating that no longer serves you?',
    'How do you show love? Is that how the people you love best receive it?',
    'What is one conversation you have been avoiding that you know you need to have?',
    'How do you show up for people when they are suffering, and is that enough?',
  ],
  fitness: [
    'What is the single biggest reason you do not exercise consistently — and is that really true?',
    'If you treated your sleep like a business meeting, what would change?',
    'What does your body feel like right now — and what is it telling you?',
    'Who in your life is physically healthier than you, and what do they do differently?',
    'If you knew you would live to 90, what would you start doing differently today?',
  ],
  grooming: [
    'How do you feel when you are well-groomed versus when you are not? What does that tell you?',
    'What does your wardrobe say about who you are — and who you want to be?',
    'Is there one grooming habit you have been neglecting that you know matters?',
    'How do others experience your physical presence — and are you happy with that?',
    'What would you change about your appearance if money and time were not obstacles?',
  ],
  lifestyle: [
    'If you could design your perfect day, what would it look like — and how far is your current life from that?',
    'What are you filling your time with that does not actually make you happy?',
    'What does rest mean to you — and do you get enough of it?',
    'What one lifestyle change would have the biggest positive ripple effect on everything else?',
    'Whose lifestyle do you admire, and what specifically about it do you want to adopt?',
  ],
  etiquette: [
    'In what situation do you feel most uncomfortable with social expectations — and why?',
    'Think of someone with exceptional social grace. What exactly do they do differently?',
    'Is there a setting (work, social, family) where your behaviour does not reflect your best self?',
    'What is one social habit of yours that you know puts people off, even slightly?',
    'How do you behave toward service staff — and what does that say about your character?',
  ],
  criticalthinking: [
    'What is a belief you hold strongly — and what would it take to change your mind?',
    'When did you last realise you were completely wrong about something? What did that feel like?',
    'What is one thing most people around you believe that you think might not be true?',
    'How do you decide what sources to trust? Is your current method actually reliable?',
    'What is a decision you made recently that you now question — and what would you do differently?',
  ],
  publicspeaking: [
    'What specifically makes you nervous about speaking in front of others? Is that fear rational?',
    'Think of the best speaker you have ever heard. What made them extraordinary?',
    'When have you had something important to say but stayed silent? What held you back?',
    'How do you come across when you speak — and does that match how you want to be perceived?',
    'What is one conversation you keep having in your head but never out loud — and why?',
  ],
  legalliteracy: [
    'Have you ever signed something without reading it fully? What were the consequences?',
    'Do you know your rights if you are stopped by police in India? What would you do?',
    'Is there a legal situation you are in right now that you do not fully understand?',
    'What is one area of law that affects your daily life that you know almost nothing about?',
    'Has anyone ever taken advantage of your legal ignorance? What did you learn?',
  ],
  emotionalintelligence: [
    'What emotion do you find hardest to feel and sit with — and why do you think that is?',
    'Think of your last significant argument. What were you actually feeling underneath the anger?',
    'Whose emotional reactions trigger you the most — and what does that tell you about yourself?',
    'When was the last time you felt genuine empathy for someone very different from you?',
    'What does your body feel like when you are anxious versus when you are calm? Can you tell the difference early enough?',
  ],
  firstaid: [
    'If someone near you collapsed right now, what would you actually do in the first 60 seconds?',
    'What is the biggest safety risk in your home that you have been ignoring?',
    'Have you ever been in an emergency and not known what to do? How did that feel?',
    'Who in your life is most vulnerable — elderly parent, young sibling — and are you prepared to help them?',
    'What is one first aid skill you have always meant to learn but never prioritised?',
  ],
  sleep: [
    'What does your sleep actually look like right now — and how is it affecting your days?',
    'What are the three biggest things stealing your sleep, and which one could you fix tonight?',
    'Have you ever experienced what it felt like to be fully rested? When was that, and what was different?',
    'How do you use your phone at night — and if you are honest, is it helping or hurting you?',
    'If better sleep gave you one extra hour of peak productivity daily, what would you do with it?',
  ],
  cooking: [
    'What is your relationship with food — is it mostly fuel, comfort, social, or something else?',
    'When did you last cook something from scratch, and how did it feel compared to ordering in?',
    'What is one food habit you know is bad for you that you keep returning to — and why?',
    'If you had to eat only home-cooked food for one month, how would your life change?',
    'What did food mean in your family growing up — and how does that show up in your eating now?',
  ],
  timemanagement: [
    'If you had to honestly account for where every hour of yesterday went, what would the breakdown look like?',
    'What is the one thing that, if you did it consistently, would have the biggest impact on your life?',
    'When do you feel most alive and focused — and are you scheduling enough of that time deliberately?',
    'What is something important to you that you keep saying you will do "when you have time"?',
    'What would you do differently if you genuinely believed you had exactly enough time for what matters?',
  ],
  careerplanning: [
    'In five years, what does success look like for you — specifically, not vaguely?',
    'What skill gap is most holding you back right now, and what is your plan to close it?',
    'If money and approval were not factors, what work would you choose to do?',
    'Who is one person doing work you admire, and what specifically can you learn from their path?',
    'What story are you telling yourself about why your ideal career is not possible — and is that story true?',
  ],
  digitalliteracy: [
    'How would your life change if everything you posted online became permanently public? How does that make you feel about what you share?',
    'When did you last fall for misinformation — and what made it convincing?',
    'How many apps on your phone have access to your location, contacts, or camera that you never explicitly approved?',
    'What is your relationship with social media — does it serve you, or do you serve it?',
    'If you lost your phone and all your accounts today, what would the actual impact be on your life?',
  ],
  environment: [
    'What does your personal carbon footprint look like — food, transport, electricity? Where is it highest?',
    'When did you last feel genuinely connected to nature — and how long ago was that?',
    'What environmental habit would you most want to adopt but have not started yet — and what is the real reason?',
    'How do the environmental choices available to you differ based on your income or location — and is that fair?',
    'What will the city or town you grew up in look like in 40 years if current trends continue?',
  ],
  mindfulness: [
    'When was the last time you sat completely still and did nothing — no phone, no music, no distraction? How did that feel?',
    'What thought pattern keeps showing up in your mind that you know is not serving you?',
    'What are you most afraid to face when you sit quietly with yourself?',
    'If you could observe your mind like a scientist for one day, what patterns would you notice?',
    'What does "being present" mean to you in practical terms — and how often does your life actually feel that way?',
  ],
  civic: [
    'What does being a good citizen mean to you — beyond just voting and paying taxes?',
    'Is there a problem in your neighbourhood, city, or country that you feel personally responsible for helping fix?',
    'Have you ever used your rights as a citizen — RTI, consumer complaint, grievance portal? Why or why not?',
    'What kind of India do you want to live in at age 60 — and what does that require from you now?',
    'Who has shaped your political and civic beliefs most — and have you ever seriously questioned those influences?',
  ],
  homemanagement: [
    'Does your home feel like a sanctuary or a source of stress — and what is the main thing driving that?',
    'What is one home management task you keep avoiding that, if you handled it, would give you the most relief?',
    'How did the home you grew up in shape what "home" means to you — good or bad?',
    'If a stranger walked into your home right now, what would it tell them about who you are?',
    'What would your ideal home life look like in 5 years — and what would need to change to get there?',
  ],
  lifestages: [
    'What is the most important thing this stage of your life is asking you to grow through?',
    'What unfinished business from your last life stage are you still carrying with you?',
    'If your 70-year-old self could send you a message right now, what would they most want you to know?',
    'What relationships do you need to invest in now that will matter most to you in 20 years?',
    'Are you living this stage of life fully — or waiting for the next stage to really begin living?',
  ],
};

// ── Budget tool data ───────────────────────────────────────────────────────
const BUDGET_CATEGORIES = [
  { id:'needs',    label:'Needs (50%)',    desc:'Rent, food, bills, transport', target:50, color:'#f4a261' },
  { id:'wants',    label:'Wants (30%)',    desc:'Entertainment, dining, shopping', target:30, color:'#e9c46a' },
  { id:'savings',  label:'Savings (20%)', desc:'Emergency fund, investments, goals', target:20, color:'#52b788' },
];

const VALUES_LIST = [
  'Honesty','Courage','Compassion','Discipline','Humility','Loyalty',
  'Justice','Gratitude','Wisdom','Creativity','Service','Perseverance',
  'Kindness','Integrity','Respect','Curiosity','Generosity','Patience',
];

const RELATIONSHIP_CIRCLES = [
  { id:'inner', label:'Inner Circle', desc:'Family & closest friends — people you\'d call at 2am', max:5, color:'#e07a5f' },
  { id:'close', label:'Close Circle', desc:'Good friends & trusted colleagues', max:15, color:'#f4a261' },
  { id:'social', label:'Social Circle', desc:'Acquaintances, community, network', max:50, color:'rgba(255,255,255,0.3)' },
];

// ── AI Coach ───────────────────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

const COACH_PROMPTS = {
  finance: `You are a warm, wise personal finance coach. You help people develop healthy relationships with money — not just tactics, but mindset. You draw on Indian context when relevant (rupees, SIPs, gold, joint families, etc.). Keep responses concise, personal and actionable. Ask one follow-up question at the end.`,
  ethics: `You are a thoughtful ethics mentor — not preachy, but deeply honest. You help people examine their values, navigate moral dilemmas, and live with more integrity. You draw on philosophy, psychology, and real life. Keep responses warm but unflinching. Ask one probing question at the end.`,
  relationships: `You are a compassionate relationship coach who helps people build deeper, healthier connections — with family, friends, colleagues, and themselves. You are practical, not theoretical. Keep responses human and specific. Ask one reflective question at the end.`,
  fitness: `You are a knowledgeable fitness and health coach. You give practical, science-based advice on exercise, nutrition, sleep, and recovery — tailored to the user's age, gender, and lifestyle. You are encouraging but honest about what actually works. Use Indian context (dal-chawal, roti, chai culture, office jobs, heat) when relevant. Give specific, actionable recommendations. Ask one motivating question at the end.`,
  grooming: `You are a sophisticated personal style and grooming advisor. You give honest, practical advice on skincare, haircare, clothing, and personal presentation — always tailored to the user's gender, age, climate, and budget. You are direct and specific, never vague. You reference Indian climate, skin tones, and cultural context where relevant. Ask one question at the end to give better advice.`,
  lifestyle: `You are a thoughtful life design coach. You help people build intentional, balanced lifestyles — sleep, habits, routines, work-life balance, hobbies, environment, digital wellness. You consider the user's age, income, gender, and life stage. You give concrete recommendations, not platitudes. Draw on Indian urban/semi-urban context when relevant. Ask one clarifying question at the end.`,
  etiquette: `You are a gracious etiquette and social intelligence coach. You teach practical social skills — dining etiquette, professional conduct, digital etiquette, conversation skills, body language, cultural sensitivity, and how to make people feel at ease. You are warm, not stuffy. Give specific, actionable tips. Ask one question at the end.`,
  criticalthinking: `You are a sharp, Socratic critical thinking coach. You help people think more clearly — identify logical fallacies, question assumptions, evaluate sources, make better decisions, and resist manipulation and misinformation. You are intellectually rigorous but never condescending. Use Indian examples where relevant (WhatsApp forwards, political rhetoric, exam myths). Ask one probing question at the end that challenges the user to think harder.`,
  publicspeaking: `You are an experienced public speaking coach who has trained professionals, students, and leaders. You help people with structure, voice, confidence, body language, storytelling, and managing nerves. You are practical and encouraging — you know that great speakers are made, not born. Give specific exercises or techniques. Ask one question at the end to understand what they need most.`,
  legalliteracy: `You are a plain-language legal educator focused on Indian law and everyday legal literacy. You explain legal concepts clearly — consumer rights, tenant rights, employment law, FIR procedures, contracts, digital rights, and more — without jargon. You are not a practising lawyer and always clarify that for specific legal problems they should consult one. Focus on empowering people to understand their rights and protect themselves. Ask one question at the end.`,
  emotionalintelligence: `You are a warm, psychologically-informed emotional intelligence coach. You help people understand and regulate their emotions, build empathy, improve self-awareness, and develop healthier emotional responses. You draw on evidence-based approaches (CBT, ACT, attachment theory, neuroscience) but explain everything in plain language. You are compassionate and never judgmental. Indian cultural context (joint family dynamics, academic pressure, gender expectations) is important. Ask one reflective question at the end.`,
  firstaid: `You are a certified first aid trainer and safety educator. You teach practical, life-saving skills — CPR, choking response, burns, bleeding, fractures, anaphylaxis, stroke recognition, and emergency preparedness — in clear, step-by-step language anyone can follow. You always emphasise calling emergency services (112 in India) as a priority. You are calm, clear, and never alarmist. Adapt advice to Indian home and workplace settings. Ask one practical question at the end.`,
  sleep: `You are a sleep science coach grounded in the research of Matthew Walker, Huberman Lab, and sleep medicine. You help people understand the science of sleep, identify what is destroying their sleep quality, and build sustainable sleep habits. You are practical and specific — no vague advice. Indian context matters: exam stress, late-night WhatsApp, chai culture, share accommodation. Give one concrete change they can make tonight. Ask one question at the end.`,
  cooking: `You are a friendly nutrition educator and home cooking coach with a deep understanding of Indian food. You help people learn to cook simple, healthy meals; understand nutrition without calorie obsession; eat better on a budget; and develop a healthier relationship with food. You reference Indian ingredients, cooking methods, and dietary patterns. You are encouraging and never judgmental about eating habits. Ask one practical question at the end.`,
  timemanagement: `You are a productivity and time management coach who cuts through the noise. You draw on Cal Newport (Deep Work), James Clear (Atomic Habits), and David Allen (GTD) but translate everything into specific, actionable advice. You help people identify their highest-leverage activities, eliminate time waste, build focus habits, and protect energy. Indian workplace and study context is important — exams, joint family distractions, boss culture, WhatsApp overload. Ask one question at the end.`,
  careerplanning: `You are a career strategist and mentor who has helped people across education, technology, healthcare, law, government, and entrepreneurship. You help people think clearly about what they want from a career, how to build skills deliberately, how to navigate the Indian job market, and how to make bold career moves with confidence. You are honest about hard realities while being genuinely encouraging. Ask one probing question at the end.`,
  digitalliteracy: `You are a digital safety and literacy educator with deep knowledge of cybersecurity, online privacy, social media, misinformation, and India's digital landscape. You help people protect themselves online, think critically about what they consume and share, manage their digital reputation, and use technology as a tool rather than being used by it. You are practical and specific — never preachy. Reference Indian context (UPI fraud, WhatsApp forwards, DPDP Act, cybercrime helpline 1930). Ask one question at the end.`,
  environment: `You are a passionate but pragmatic environmental educator focused on India. You help people understand climate change, India's specific environmental challenges (air quality, water scarcity, plastic, deforestation), and what individuals can actually do — practical, budget-conscious, India-specific actions. You avoid guilt and doom. You connect environment to health, economy, and daily life. You are inspiring and solutions-focused. Ask one question at the end.`,
  mindfulness: `You are a warm, experienced mindfulness and meditation teacher rooted in both ancient wisdom (Vipassana, yoga, Zen) and modern neuroscience (MBSR, Huberman Lab). You help people build a sustainable meditation practice, work with difficult thoughts and emotions, find stillness in a distracted world, and develop a richer inner life. You are gentle, non-dogmatic, and deeply human. Indian context matters — family pressure, spirituality, noise, heat. Ask one reflective question at the end.`,
  civic: `You are a civic educator and community leadership coach passionate about Indian democracy and active citizenship. You help people understand how government works at every level (Panchayat to Parliament), how to use their rights (RTI, consumer law, grievance redressal), how to vote responsibly, and how to lead within their communities. You are inspiring but grounded — you connect civic participation to the everyday life of ordinary Indians. Ask one question at the end.`,
  homemanagement: `You are a practical home management and life organisation coach. You help people set up their first home, manage household finances, deal with landlords and maintenance, build good domestic routines, and create a living environment that supports their wellbeing and goals. You are specific and India-aware — PG accommodation, joint families, Bangalore vs Delhi costs, domestic workers, BBMP, society maintenance. Ask one practical question at the end.`,
  lifestages: `You are a life-stage counsellor and developmental coach who understands the psychological, social, and practical challenges at every age — adolescence, early adulthood, the twenties, thirties, middle age, and beyond. You help people understand what each life stage is asking of them, navigate major transitions (education, work, marriage, parenthood, loss), and approach each chapter with intention rather than default. Indian cultural context (arranged marriage, joint families, career expectations, filial duty) is essential. Ask one question at the end.`,
};

function AICoach({ moduleId, accent, accentDim, accentBorder, userProfile, sensors }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const endRef = useRef(null);
  const mod = MODULES[moduleId];
  const { lang, langMeta, t } = useLanguage();
  const langName = langMeta?.label || 'English';

  const BACKEND_TTS = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000';

  // ── TTS pipeline — iOS-safe via HTMLAudioElement ────────────────────────
  const audioRef       = useRef(null);
  const blobUrlsRef    = useRef([]);
  const isSpeakingRef  = useRef(false);
  const abortRef       = useRef(null);

  const stopAll = () => {
    isSpeakingRef.current = false;
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (audioRef.current) {
      const a = audioRef.current;
      a.oncanplaythrough = a.onended = a.onerror = null;
      try { a.pause(); } catch(_) {}
      try { a.src = ''; } catch(_) {}
      try { a.load(); } catch(_) {}
      audioRef.current = null;
    }
    blobUrlsRef.current.forEach(u => { try { URL.revokeObjectURL(u); } catch(_) {} });
    blobUrlsRef.current = [];
    setSpeakingIdx(null);
  };

  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Clean markdown so ElevenLabs reads natural prose
  const chunkText = (raw) => {
    const clean = raw
      .replace(/\*\*/g, '').replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const MAX = 2400;
    if (clean.length <= MAX) return [clean];
    const sentences = clean.match(/[^.!?]+[.!?]+["'\u2019]?\s*/g) || [clean];
    const chunks = [];
    let cur = '';
    for (const s of sentences) {
      if (cur.length + s.length > MAX) {
        if (cur.trim()) chunks.push(cur.trim());
        cur = s;
      } else { cur += s; }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length ? chunks : [clean.slice(0, MAX)];
  };

  // Fetch one chunk → ArrayBuffer or null
  const fetchChunk = async (text, signal) => {
    try {
      const token = localStorage.getItem('samarthaa_token');
      const r = await fetch(`${BACKEND_TTS}/api/tts/speak`, {
        method: 'POST', signal,
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ text, language: langName }),
      });
      if (!r.ok) { console.warn('[TTS] HTTP', r.status); return null; }
      return await r.arrayBuffer();
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[TTS fetch]', e.message);
      return null;
    }
  };

  // Play one ArrayBuffer via HTMLAudioElement, returns Promise resolving when done
  const playBuf = (arrayBuf) => new Promise((resolve) => {
    const blob = new Blob([arrayBuf], { type: 'audio/mpeg' });
    const url  = URL.createObjectURL(blob);
    blobUrlsRef.current.push(url);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      blobUrlsRef.current = blobUrlsRef.current.filter(u => u !== url);
      resolve();
    };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play().catch(() => resolve());
  });

  // Sequential pipeline: fetch and play each chunk one after another
  const runPipeline = async (chunks) => {
    const abort = new AbortController();
    abortRef.current = abort;

    for (let i = 0; i < chunks.length; i++) {
      if (!isSpeakingRef.current) break;
      const buf = await fetchChunk(chunks[i], abort.signal);
      if (!isSpeakingRef.current || !buf) break;
      await playBuf(buf);
    }

    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setSpeakingIdx(null);
    }
  };

  const speakMessage = (text, idx) => {
    if (speakingIdx === idx) { stopAll(); return; }
    stopAll();
    const chunks = chunkText(text);
    if (!chunks.length) return;

    isSpeakingRef.current = true;
    setSpeakingIdx(idx);

    if (isIOS()) {
      // iOS: prime the first Audio element synchronously inside gesture handler
      // then pipeline takes over for remaining chunks
      const audio = new Audio();
      audio.play().catch(() => {}); // unlocks audio permission on iOS
      audioRef.current = audio;
    }

    runPipeline(chunks);
  };

  const starterQuestions = {
    finance:       ['How do I start investing with a small salary?', "I can't stop impulse spending — help", 'How much emergency fund do I need?'],
    ethics:        ['I feel pressured to lie at work — what do I do?', 'How do I stay honest when it hurts people?', 'I compromised my values — how do I recover?'],
    relationships: ['How do I set boundaries without hurting people?', 'My family relationships feel draining — help', 'How do I rebuild trust after a mistake?'],
    fitness:       ['Build me a beginner workout plan', 'What should I eat to lose weight healthily?', 'How do I fix my terrible sleep?'],
    grooming:      ['What skincare routine should I follow?', 'How do I dress better on a budget?', 'My hair looks bad — what do I do?'],
    lifestyle:     ['How do I build a morning routine that actually works?', 'I feel like I have no time for myself — help', 'How do I reduce screen time?'],
    etiquette:     ['How should I behave at a formal dinner?', 'What are the rules for professional WhatsApp messages?', 'How do I introduce myself confidently?'],
    criticalthinking: ['How do I know if news is fake or real?', 'What are the most common logical fallacies?', 'How do I make better decisions under pressure?'],
    publicspeaking:   ['How do I stop being nervous before speaking?', 'How do I structure a 5-minute speech?', 'How do I speak more confidently in meetings?'],
    legalliteracy:    ['What are my rights if police stop me?', 'How do I file a consumer complaint in India?', 'What should I check before signing a rental agreement?'],
    emotionalintelligence: ['How do I stop reacting and start responding?', 'Why do I get so triggered by certain people?', 'How do I deal with anger without suppressing it?'],
    firstaid:         ['What do I do if someone is choking?', 'How do I perform CPR correctly?', 'What are the signs of a heart attack?'],
    sleep:            ['How do I fix my sleep schedule quickly?', 'Why am I tired even after 8 hours?', 'How do I stop using my phone before bed?'],
    cooking:          ['What are 5 basic dishes every Indian should know?', 'How do I eat healthy on ₹200 a day?', 'What is the easiest high-protein Indian meal?'],
    timemanagement:   ['How do I stop procrastinating on important work?', 'How do I do deep work when I have constant interruptions?', 'How do I plan my week effectively?'],
    careerplanning:   ['How do I figure out what career is right for me?', 'When is the right time to change jobs?', 'How do I get a mentor in my field?'],
    digitalliteracy:  ['How do I know if a WhatsApp forward is fake?', 'What should I do if I get scammed online?', 'How do I protect my privacy on my phone?'],
    environment:      ['What is my carbon footprint and how do I reduce it?', 'What can one person actually do about climate change?', 'How do I live more sustainably on a student budget?'],
    mindfulness:      ['How do I start meditating if I have never done it before?', 'My mind never stops — how do I quiet it?', 'What is the difference between mindfulness and meditation?'],
    civic:            ['How does the Indian government actually work?', 'How do I file an RTI application?', 'What can I do about a civic problem in my area?'],
    homemanagement:   ['What should I check before signing a rental agreement?', 'How do I budget for running a household?', 'How do I deal with a difficult landlord?'],
    lifestages:       ['What should I focus on in my 20s?', 'How do I navigate the pressure to get married?', 'How do I take care of ageing parents while managing my own life?'],
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    stopAll();
    setMessages([]);
  }, [moduleId]); // eslint-disable-line

  const buildSystemPrompt = () => {
    let base = COACH_PROMPTS[moduleId];
    // Always respond in the user's selected language
    base += `\n\nIMPORTANT: The user's interface language is set to ${langName}. You MUST respond entirely in ${langName}. If the user writes in any language, respond in ${langName}.`;
    if (userProfile && (userProfile.gender || userProfile.age || userProfile.income || userProfile.city)) {
      const parts = [];
      if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`);
      if (userProfile.age)    parts.push(`Age: ${userProfile.age}`);
      if (userProfile.income) parts.push(`Monthly income: ${userProfile.income}`);
      if (userProfile.city)   parts.push(`City/location type: ${userProfile.city}`);
      if (userProfile.goals)  parts.push(`Goals: ${userProfile.goals}`);
      base += `\n\nUser profile: ${parts.join(', ')}. Tailor all advice to this person specifically.`;
    }
    return base;
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const newMessages = [...messages, { role:'user', content:q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('samarthaa_token');
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message:      q,
          subject:      mod.label,
          grade:        'Life Skills',
          syllabus:     'General',
          language:     langName,
          systemPrompt: buildSystemPrompt(),
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || data.message || 'Could not get a response. Please try again.';
      const newIdx = newMessages.length;
      setMessages(m => [...m, { role:'assistant', content: reply }]);
      setTimeout(() => speakMessage(reply, newIdx), 200);

    } catch (e) {
      const msg = e.name === 'AbortError' ? 'Response timed out. Please try again.' : e.message;
      console.error('[AICoach] error:', msg);
      setMessages(m => [...m, { role:'assistant', content:`Error: ${msg}. Check your connection and try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {messages.length === 0 && (
        <div style={{ padding:'0 0 16px' }}>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.8px' }}>Quick start</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(starterQuestions[moduleId] || []).map(q => (
              <button key={q} onClick={() => send(q)}
                style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, padding:'8px 14px', color:accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left', lineHeight:1.4 }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, minHeight:0, paddingRight:4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start', gap:6, alignItems:'flex-end' }}>
            {m.role === 'assistant' && (
              <button onClick={() => speakMessage(m.content, i)}
                title={speakingIdx === i ? 'Stop' : 'Read aloud (full response)'}
                style={{ flexShrink:0, width:28, height:28, borderRadius:'50%', background: speakingIdx===i ? `${accent}25` : 'rgba(255,255,255,0.06)', border:`1.5px solid ${speakingIdx===i ? accent : 'rgba(255,255,255,0.1)'}`, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', animation: speakingIdx===i ? 'pulse 1.2s infinite' : 'none', marginBottom:4 }}>
                {speakingIdx === i ? '⏹' : '🔊'}
              </button>
            )}
            <div style={{ maxWidth:'82%', padding:'12px 16px', borderRadius: m.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role==='user' ? accent : 'rgba(255,255,255,0.06)', color: m.role==='user' ? '#0d0d0d' : 'rgba(255,255,255,0.88)', fontSize:13, lineHeight:1.7, fontWeight: m.role==='user' ? 700 : 400, whiteSpace:'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:5, padding:'12px 16px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:accent, opacity:0.7, animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
          </div>
        )}
        {speakingIdx !== null && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, alignSelf:'flex-start' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:3, height:12+i*4, background:accent, borderRadius:2, opacity:0.8, animation:`bounce 1.0s ${i*0.15}s infinite` }} />
            ))}
            <span style={{ color:accent, fontSize:11, fontWeight:700 }}>Reading aloud…</span>
            <button onClick={stopAll} style={{ background:'none', border:'none', color:accent, cursor:'pointer', fontSize:13, padding:'0 4px' }}>⏹</button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)', alignItems:'center' }}>
        {sensors && (
          <div style={{ position:'relative', flexShrink:0 }}>
            <VoiceButton sensors={sensors} accent={accent} size={40}
              onText={(text) => { setInput(''); send(text); }}
              onPartial={(text) => setInput(text)} />
          </div>
        )}
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
          placeholder={t('ls_ask_coach')}
          style={{ flex:1, background:'rgba(255,255,255,0.05)', border:`1px solid ${accentBorder}`, borderRadius:12, padding:'11px 16px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none', minHeight:44 }} />
        <button onClick={() => send()} disabled={loading}
          style={{ background:loading ? 'rgba(255,255,255,0.1)' : accent, border:'none', borderRadius:12, padding:'0 18px', color: loading ? 'rgba(255,255,255,0.3)' : '#0d0d0d', fontWeight:800, fontSize:16, cursor:loading?'wait':'pointer', minHeight:44, minWidth:44 }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ── Finance Module ─────────────────────────────────────────────────────────
function FinanceModule({ accent, accentDim, accentBorder, sensors }) {
  const [income, setIncome]   = useState('');
  const [spent, setSpent]     = useState({ needs:'', wants:'', savings:'' });
  const [tab, setTab]         = useState('budget');

  const inc = parseFloat(income) || 0;
  const totSpent = Object.values(spent).reduce((a,v) => a+(parseFloat(v)||0), 0);
  const remaining = inc - totSpent;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['budget','📊 50/30/20 Budget'],['roadmap','🗺️ Financial Roadmap'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'budget' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {/* Income input */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16, padding:20 }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Monthly Income (₹)</div>
            <input value={income} onChange={e => setIncome(e.target.value)} type="number" placeholder="e.g. 50000"
              style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'12px 16px', color:'white', fontSize:20, fontWeight:800, fontFamily:'inherit', outline:'none' }} />
            {inc > 0 && (
              <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                {BUDGET_CATEGORIES.map(cat => {
                  const target = Math.round(inc * cat.target / 100);
                  const actual = parseFloat(spent[cat.id]) || 0;
                  const pct = inc > 0 ? Math.min(100, (actual/target)*100) : 0;
                  const over = actual > target;
                  return (
                    <div key={cat.id}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontWeight:700 }}>{cat.label}</span>
                        <span style={{ color: over ? '#e74c3c' : cat.color, fontSize:12, fontWeight:800 }}>₹{target.toLocaleString()}</span>
                      </div>
                      <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background: over ? '#e74c3c' : cat.color, borderRadius:10, transition:'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spending tracker */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16, padding:20 }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>This Month's Actual Spending</div>
            {BUDGET_CATEGORIES.map(cat => (
              <div key={cat.id} style={{ marginBottom:14 }}>
                <div style={{ color:cat.color, fontSize:12, fontWeight:700, marginBottom:6 }}>{cat.desc}</div>
                <input value={spent[cat.id]} onChange={e => setSpent(s => ({...s,[cat.id]:e.target.value}))} type="number" placeholder="₹ 0"
                  style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:15, fontWeight:700, fontFamily:'inherit', outline:'none' }} />
              </div>
            ))}
            {inc > 0 && (
              <div style={{ marginTop:8, padding:'12px 16px', borderRadius:12, background: remaining >= 0 ? 'rgba(82,183,136,0.1)' : 'rgba(231,76,60,0.1)', border:`1px solid ${remaining >= 0 ? 'rgba(82,183,136,0.3)' : 'rgba(231,76,60,0.3)'}` }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700 }}>REMAINING</div>
                <div style={{ color: remaining >= 0 ? '#52b788' : '#e74c3c', fontSize:22, fontWeight:900, marginTop:4 }}>₹{Math.abs(remaining).toLocaleString()} {remaining < 0 ? 'over' : 'left'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'roadmap' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { step:1, title:'Build a ₹10,000 Emergency Cushion', desc:'Before anything else. Keep in a savings account. Touch only for true emergencies.', icon:'🛡️', key:'starter' },
            { step:2, title:'Zero High-Interest Debt', desc:'Credit cards, personal loans. Pay these off before investing. No investment beats 36% interest.', icon:'⚔️', key:'debt' },
            { step:3, title:'3–6 Month Emergency Fund', desc:'Your real safety net. Keep in a liquid fund or FD. Based on your monthly expenses.', icon:'🏦', key:'emergency' },
            { step:4, title:'Start a SIP — Even ₹500/month', desc:'Index funds. Nifty 50. Start now. Time in market > timing the market.', icon:'📈', key:'invest' },
            { step:5, title:'Get Term Insurance', desc:'If anyone depends on your income. Pure term. 10–15x annual income. No ULIPs.', icon:'🔒', key:'insurance' },
            { step:6, title:'Build Long-term Wealth', desc:'PPF, NPS, equity mutual funds. Think 10–20 years. Automate everything.', icon:'🌳', key:'wealth' },
          ].map((item, i) => (
            <div key={item.key} style={{ display:'flex', gap:14, padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, alignItems:'flex-start' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:accentDim, border:`1.5px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>Step {item.step}</div>
                <div style={{ color:'white', fontSize:14, fontWeight:800, margin:'2px 0 5px' }}>{item.title}</div>
                <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="finance" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} />
        </div>
      )}
    </div>
  );
}

// ── Ethics Module ──────────────────────────────────────────────────────────
function EthicsModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab]             = useState('compass');
  const [selectedValues, setSelected] = useState([]);
  const [scenario, setScenario]   = useState(0);

  const toggleValue = v => setSelected(s => s.includes(v) ? s.filter(x=>x!==v) : s.length < 5 ? [...s, v] : s);

  const dilemmas = [
    { title:'The Honest Reference', q:'Your colleague asks you to give them a glowing reference, but you know they struggled significantly in their last role. The hiring company calls you. What do you say?', options:['Give the reference they asked for — they\'re a friend', 'Politely decline to give a reference', 'Be honest about both strengths and weaknesses', 'Tell the company you can\'t give a full picture'] },
    { title:'The Overcharged Bill', q:'A restaurant gives you a bill that is ₹500 less than it should be. You\'re with friends and everyone is ready to leave. Do you say something?', options:['Say nothing — it\'s their mistake', 'Tell the waiter quietly', 'Tell the waiter in front of everyone', 'Depends on how wealthy the restaurant looks'] },
    { title:'The Team Credit', q:'You did most of the work on a project. Your manager praises the whole team equally in front of senior leadership. Your teammates say nothing. Do you speak up?', options:['Stay quiet — teams share credit', 'Mention your contribution professionally', 'Talk to your manager privately afterwards', 'Let your team know you\'re unhappy'] },
    { title:'The Shortcut', q:'You discover that by cutting a corner at work — something technically against policy but that nobody checks — you could save yourself 2 hours a day. Nobody would ever know. Do you do it?', options:['Yes — the policy is outdated anyway', 'No — rules are rules', 'Yes, but only occasionally', 'Report the inefficient policy first, then decide'] },
  ];

  const d = dilemmas[scenario % dilemmas.length];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['compass','🧭 Values Compass'],['dilemma','⚖️ Dilemma Lab'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'compass' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Choose your <strong style={{color:'white'}}>top 5 core values</strong> — the principles you are not willing to compromise, even when it is costly. Be honest, not aspirational.
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {VALUES_LIST.map(v => {
              const sel = selectedValues.includes(v);
              return (
                <button key={v} onClick={() => toggleValue(v)}
                  style={{ padding:'8px 16px', borderRadius:20, border:`1.5px solid ${sel ? accent : 'rgba(255,255,255,0.1)'}`, background: sel ? accentDim : 'transparent', color: sel ? accent : 'rgba(255,255,255,0.55)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
                  {v}
                </button>
              );
            })}
          </div>
          {selectedValues.length === 5 && (
            <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:14 }}>Your Core Values</div>
              {selectedValues.map((v,i) => (
                <div key={v} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:accentDim, border:`1.5px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', color:accent, fontSize:12, fontWeight:900, flexShrink:0 }}>{i+1}</div>
                  <div>
                    <div style={{ color:'white', fontSize:14, fontWeight:800 }}>{v}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>When did you last act on this value?</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, padding:'12px 16px', background:accentDim, borderRadius:12, color:accent, fontSize:12, fontWeight:700, lineHeight:1.6 }}>
                💡 Now ask yourself: in the last 30 days, did your actions reflect these 5 values? Where did you succeed? Where did you fall short?
              </div>
            </div>
          )}
          {selectedValues.length > 0 && selectedValues.length < 5 && (
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>Select {5 - selectedValues.length} more value{5-selectedValues.length!==1?'s':''}</div>
          )}
        </div>
      )}

      {tab === 'dilemma' && (
        <div>
          <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16, marginBottom:16 }}>
            <div style={{ color:accent, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Dilemma {(scenario % dilemmas.length)+1} of {dilemmas.length}</div>
            <div style={{ color:'white', fontSize:16, fontWeight:800, marginBottom:12 }}>{d.title}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8 }}>{d.q}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {d.options.map((opt, i) => (
              <div key={i} style={{ padding:'14px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.5 }}>
                <span style={{ color:accent, fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setScenario(s => s+1)}
              style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${accentBorder}`, background:accentDim, color:accent, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              Next Dilemma →
            </button>
          </div>
          <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:12, color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.7 }}>
            There are no right answers here. The point is to notice <em>why</em> you lean toward a particular option. Discuss this with your AI coach above for deeper reflection.
          </div>
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="ethics" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} />
        </div>
      )}
    </div>
  );
}

// ── Relationships Module ───────────────────────────────────────────────────
function RelationshipsModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab]               = useState('map');
  const [circleData, setCircleData] = useState({ inner:[], close:[], social:[] });
  const [newName, setNewName]       = useState({ inner:'', close:'', social:'' });
  const [loveLang, setLoveLang]     = useState(null);

  const addPerson = (circle) => {
    const name = newName[circle].trim();
    if (!name) return;
    setCircleData(d => ({ ...d, [circle]: [...d[circle], name] }));
    setNewName(n => ({ ...n, [circle]:'' }));
  };

  const LOVE_LANGS = [
    { id:'words',   icon:'💬', label:'Words of Affirmation', desc:'You feel loved through verbal praise, encouragement, and "I love you".' },
    { id:'quality', icon:'⏱️', label:'Quality Time',         desc:'You feel loved through undivided attention and shared experiences.' },
    { id:'gifts',   icon:'🎁', label:'Receiving Gifts',      desc:'You feel loved through thoughtful tokens and symbolic gestures.' },
    { id:'service', icon:'🛠️', label:'Acts of Service',     desc:'You feel loved when someone helps you, does things for you, lightens your load.' },
    { id:'touch',   icon:'🤗', label:'Physical Touch',       desc:'You feel loved through hugs, presence, and physical closeness.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['map','🗺️ Relationship Map'],['love','💝 Love Languages'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'map' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Map your relationships. Research shows people with strong, diverse circles are healthier, happier, and more resilient. Be honest about who is truly in each circle.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {RELATIONSHIP_CIRCLES.map(circle => (
              <div key={circle.id} style={{ padding:18, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ color:circle.color, fontSize:13, fontWeight:800 }}>{circle.label}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2, lineHeight:1.5 }}>{circle.desc}</div>
                  </div>
                  <div style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, padding:'3px 10px', color:accent, fontSize:11, fontWeight:800, flexShrink:0 }}>
                    {circleData[circle.id].length}/{circle.max}
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:32, marginBottom:12 }}>
                  {circleData[circle.id].map((name,i) => (
                    <span key={i} style={{ background:'rgba(255,255,255,0.07)', borderRadius:20, padding:'4px 10px', color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:700 }}>
                      {name}
                      <button onClick={() => setCircleData(d => ({...d,[circle.id]:d[circle.id].filter((_,j)=>j!==i)}))}
                        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', marginLeft:4, fontSize:10, padding:0 }}>✕</button>
                    </span>
                  ))}
                </div>
                {circleData[circle.id].length < circle.max && (
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={newName[circle.id]} onChange={e => setNewName(n=>({...n,[circle.id]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter' && addPerson(circle.id)}
                      placeholder="Add name..."
                      style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                    <button onClick={() => addPerson(circle.id)}
                      style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:8, padding:'0 12px', color:accent, fontSize:16, cursor:'pointer', fontWeight:800 }}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {Object.values(circleData).some(arr => arr.length > 0) && (
            <div style={{ marginTop:16, padding:'14px 18px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, marginBottom:8 }}>REFLECTION</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.8 }}>
                Look at your inner circle. When did you last speak to each person — really speak, not just text?<br/>
                Look at your close circle. Who has drifted that you wish hadn't?<br/>
                Now ask: what kind of friend, child, sibling, or colleague are <em>you</em> being?
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'love' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Gary Chapman's 5 Love Languages explain why people often love each other genuinely but still feel unloved. Knowing yours — and the people close to you — changes everything.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {LOVE_LANGS.map(l => (
              <div key={l.id} onClick={() => setLoveLang(loveLang===l.id ? null : l.id)}
                style={{ padding:'16px 18px', background: loveLang===l.id ? accentDim : 'rgba(255,255,255,0.03)', border:`1.5px solid ${loveLang===l.id ? accent : 'rgba(255,255,255,0.08)'}`, borderRadius:14, cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:24 }}>{l.icon}</span>
                  <div>
                    <div style={{ color: loveLang===l.id ? accent : 'white', fontSize:14, fontWeight:800 }}>{l.label}</div>
                    {loveLang===l.id && <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:6, lineHeight:1.6 }}>{l.desc}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {loveLang && (
            <div style={{ marginTop:16, padding:'16px 18px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:12, fontWeight:800, marginBottom:8 }}>YOUR NEXT STEP</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.8 }}>
                Now ask the 3 people closest to you what <em>their</em> love language is. You may have been showing love the way <em>you</em> want to receive it — not the way they actually feel it.
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="relationships" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} />
        </div>
      )}
    </div>
  );
}

// ── Daily Check-in ─────────────────────────────────────────────────────────
function DailyCheckin({ moduleId, accent, accentDim, accentBorder, todayChecked, onToggle, streak }) {
  const habits = HABITS[moduleId] || [];
  const checked = todayChecked || [];
  const pct = habits.length ? Math.round((checked.length / habits.length) * 100) : 0;
  const { t } = useLanguage();

  return (
    <div style={{ padding:20, background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ color:accent, fontSize:13, fontWeight:800 }}>{t('ls_habits')}</div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {streak > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, padding:'4px 10px' }}>
              <span style={{ fontSize:14 }}>🔥</span>
              <span style={{ color:accent, fontSize:12, fontWeight:800 }}>{streak}d {t('ls_streak')}</span>
            </div>
          )}
          <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700 }}>{checked.length}/{habits.length} {t('ls_today_done')}</div>
        </div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, marginBottom:16, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:accent, borderRadius:4, transition:'width 0.5s' }} />
      </div>
      {habits.map(h => (
        <div key={h.id} onClick={() => onToggle(h.id)}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}>
          <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${checked.includes(h.id) ? accent : 'rgba(255,255,255,0.2)'}`, background:checked.includes(h.id) ? accentDim : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
            {checked.includes(h.id) && <span style={{ color:accent, fontSize:13, fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ color:checked.includes(h.id) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.5, textDecoration:checked.includes(h.id) ? 'line-through' : 'none', transition:'all 0.2s' }}>
            {h.text}
          </span>
        </div>
      ))}
      {pct === 100 && (
        <div style={{ marginTop:14, textAlign:'center', color:accent, fontSize:14, fontWeight:800 }}>
          🌟 You showed up fully today. That is how change happens.
        </div>
      )}
    </div>
  );
}

// ── Quote of the Day ───────────────────────────────────────────────────────
function QuoteCard({ moduleId, accent, accentDim, accentBorder }) {
  const quotes = QUOTES[moduleId];
  const [idx] = useState(() => Math.floor(Date.now() / 86400000) % quotes.length);
  const q = quotes[idx];
  return (
    <div style={{ padding:20, background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Today's Wisdom</div>
      <div style={{ color:'white', fontSize:15, lineHeight:1.8, fontStyle:'italic', marginBottom:10 }}>"{q.text}"</div>
      <div style={{ color:accent, fontSize:12, fontWeight:800 }}>— {q.by}</div>
    </div>
  );
}

// ── Reflection Journal ─────────────────────────────────────────────────────
function ReflectionJournal({ moduleId, accent, accentDim, accentBorder, getJournal, saveJournal, sensors }) {
  const prompts = REFLECTIONS[moduleId] || [];
  const [idx, setIdx] = useState(0);
  const text = getJournal(moduleId, idx);
  const { t } = useLanguage();

  return (
    <div style={{ padding:20, background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ color:accent, fontSize:13, fontWeight:800 }}>{t('ls_reflect')} · {t('ls_journal')}</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setIdx(i => (i-1+prompts.length)%prompts.length)}
            style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>←</button>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:700, alignSelf:'center' }}>{idx+1}/{prompts.length}</span>
          <button onClick={() => setIdx(i => (i+1)%prompts.length)}
            style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>→</button>
        </div>
      </div>
      <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.7, marginBottom:14, fontStyle:'italic' }}>{prompts[idx]}</div>
      <div style={{ position:'relative' }}>
        <textarea data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" value={text} onChange={e => saveJournal(moduleId, idx, e.target.value)}
          placeholder={t('ls_ask_coach')}
          rows={5}
          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 48px 12px 14px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.7 }} />
        {sensors && (
          <div style={{ position:'absolute', bottom:10, right:10 }}>
            <VoiceButton sensors={sensors} accent={accent} size={32}
              onText={(txt) => saveJournal(moduleId, idx, text ? text + ' ' + txt : txt)} />
          </div>
        )}
      </div>
      {text && <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11, marginTop:6, textAlign:'right' }}>✓ {t('save')}</div>}
    </div>
  );
}

// ── User Profile Setup ────────────────────────────────────────────────────
function UserProfileSetup({ profile, onChange, accent, accentDim, accentBorder }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(!profile.gender);
  const set = (k, v) => onChange({ ...profile, [k]: v });

  // Fields derived automatically from registered profile (read-only display)
  const autoFields = [
    user?.name  && { label:'Name',     value: user.name },
    user?.grade && { label:'Course',   value: user.grade },
    user?.email && { label:'Email',    value: user.email },
  ].filter(Boolean);

  // Editable fields — selects with proper options
  const editFields = [
    {
      key:'gender', label:'Gender',
      options:['Male','Female','Non-binary','Prefer not to say'],
    },
    {
      key:'age', label:'Age group',
      options:['Under 18','18–25','26–35','36–45','46–60','60+'],
    },
    {
      key:'income', label:'Monthly income',
      options:['Under ₹15k','₹15k–30k','₹30k–60k','₹60k–1L','₹1L–2L','₹2L+','Not applicable'],
    },
    {
      key:'city', label:'Location',
      options:['Metro city','Tier-2 city','Small town','Rural area','Outside India'],
    },
  ];

  const isComplete = profile.gender && profile.age;

  const selectStyle = {
    width: '100%',
    background: '#1e1e3a',
    border: `1.5px solid ${accentBorder}`,
    borderRadius: 9,
    padding: '10px 12px',
    color: 'white',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16, overflow:'hidden' }}>
      {/* Header toggle */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'14px 18px', background:'none', border:'none', color:'white', fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{user?.avatar || '👤'}</span>
          <div style={{ textAlign:'left' }}>
            <div style={{ color:'white', fontSize:13, fontWeight:800 }}>
              {user?.name || 'Your Profile'}
              {isComplete && <span style={{ color:accent, fontSize:11, fontWeight:700, marginLeft:8 }}>✓ Complete</span>}
            </div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:400 }}>
              {user?.grade ? `${user.grade} · ` : ''}{isComplete ? 'AI advice is personalised to you' : 'Complete profile for personalised AI advice'}
            </div>
          </div>
        </div>
        <span style={{ color:accent, fontSize:11, fontWeight:700, flexShrink:0 }}>{open ? '▲ Close' : '▼ Edit'}</span>
      </button>

      {open && (
        <div style={{ padding:'0 18px 20px' }}>

          {/* Auto-populated fields from registration — read-only */}
          {autoFields.length > 0 && (
            <div style={{ marginBottom:16, padding:'12px 14px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:12 }}>
              <div style={{ color:accent, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:10 }}>
                From your account
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {autoFields.map(f => (
                  <div key={f.label} style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700 }}>{f.label}:</span>
                    <span style={{ color:'white', fontSize:12, fontWeight:700 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable fields */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:12, marginBottom:14 }}>
            {editFields.map(f => (
              <div key={f.key}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.6px' }}>
                  {f.label} {!profile[f.key] && <span style={{ color:'#e74c3c' }}>*</span>}
                </div>
                <div style={{ position:'relative' }}>
                  <select
                    value={profile[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    style={{ ...selectStyle, color: profile[f.key] ? 'white' : 'rgba(255,255,255,0.4)' }}
                  >
                    <option value="" disabled style={{ background:'#1e1e3a', color:'rgba(255,255,255,0.4)' }}>
                      Select {f.label}…
                    </option>
                    {f.options.map(o => (
                      <option key={o} value={o} style={{ background:'#1e1e3a', color:'white', padding:'8px' }}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:accent, fontSize:10, pointerEvents:'none' }}>▼</span>
                </div>
                {/* Show current value as a pill for confirmation */}
                {profile[f.key] && (
                  <div style={{ marginTop:4, display:'inline-flex', alignItems:'center', gap:4, background:`${accent}18`, border:`1px solid ${accent}40`, borderRadius:20, padding:'2px 8px' }}>
                    <span style={{ color:accent, fontSize:10, fontWeight:700 }}>✓ {profile[f.key]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Goals text field */}
          <div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.6px' }}>
              Personal goal (optional)
            </div>
            <input
              value={profile.goals || ''}
              onChange={e => set('goals', e.target.value)}
              placeholder="e.g. Build better sleep, dress professionally, manage money better..."
              style={{ width:'100%', background:'#1e1e3a', border:`1.5px solid ${accentBorder}`, borderRadius:9, padding:'10px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }}
            />
          </div>

          {/* Status */}
          {isComplete ? (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(82,183,136,0.1)', border:'1px solid rgba(82,183,136,0.25)', borderRadius:10, color:'#52b788', fontSize:12, fontWeight:700 }}>
              ✓ Profile complete — the AI coach will personalise all advice specifically for you
            </div>
          ) : (
            <div style={{ marginTop:14, color:'rgba(255,255,255,0.3)', fontSize:11 }}>
              * Select at least Gender and Age group so the AI can personalise its advice
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Fitness Module ─────────────────────────────────────────────────────────
function FitnessModule({ accent, accentDim, accentBorder, userProfile, sensors }) {
  const [tab, setTab] = useState('coach');
  const [bmi, setBmi] = useState({ weight:'', height:'' });

  const bmiVal = bmi.weight && bmi.height ? (parseFloat(bmi.weight) / Math.pow(parseFloat(bmi.height)/100, 2)).toFixed(1) : null;
  const bmiCategory = bmiVal ? bmiVal < 18.5 ? {label:'Underweight', color:'#4cc9f0'} : bmiVal < 25 ? {label:'Healthy', color:'#52b788'} : bmiVal < 30 ? {label:'Overweight', color:'#f4a261'} : {label:'Obese', color:'#e74c3c'} : null;

  const pillars = [
    { icon:'🏃', title:'Movement', points:['150 min/week moderate cardio (walk, cycle, swim)', 'Strength training 2–3x/week', '7,000–10,000 steps daily', 'Take the stairs. Park further away.'] },
    { icon:'🥗', title:'Nutrition', points:['Eat 1.6–2g protein per kg of bodyweight daily', 'Fill half your plate with vegetables', 'Limit ultra-processed food and liquid calories', 'Eat slowly. Stop at 80% full (Hara Hachi Bu).'] },
    { icon:'😴', title:'Sleep', points:['7–9 hours for adults. Non-negotiable.', 'Same sleep/wake time every day — even weekends', 'No screens 30 mins before bed', 'Cool, dark, quiet room (18–20°C ideal)'] },
    { icon:'🧘', title:'Recovery', points:['Stretch or do yoga 2–3x/week', 'One full rest day per week', 'Manage stress — cortisol destroys fitness gains', 'Hydrate: 35ml × bodyweight (kg) = daily ml target'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['tracker','📊 Activity'],['food','📷 Food'],['pillars','🏛️ Pillars'],['bmi','⚖️ BMI']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="fitness" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} sensors={sensors} />
        </div>
      )}

      {tab === 'tracker' && sensors && (
        <FitnessStats sensors={sensors} accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
      )}

      {tab === 'food' && sensors && (
        <FoodCamera sensors={sensors} accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
      )}

      {tab === 'pillars' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {pillars.map(p => (
            <div key={p.title} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{p.icon}</div>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:10 }}>{p.title}</div>
              {p.points.map((pt,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ color:accent, fontSize:11, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6 }}>{pt}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'bmi' && (
        <div style={{ maxWidth:400 }}>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>BMI is a basic screening tool — not a complete measure of health. Use it as one data point, not a verdict.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[['weight','Weight (kg)','e.g. 68'],['height','Height (cm)','e.g. 170']].map(([k,l,p]) => (
              <div key={k}>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>{l}</div>
                <input value={bmi[k]} onChange={e => setBmi(b => ({...b,[k]:e.target.value}))} type="number" placeholder={p}
                  style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:16, fontFamily:'inherit', outline:'none' }} />
              </div>
            ))}
          </div>
          {bmiVal && bmiCategory && (
            <div style={{ padding:'20px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16, textAlign:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, marginBottom:6 }}>YOUR BMI</div>
              <div style={{ fontSize:48, fontWeight:900, color:bmiCategory.color, marginBottom:8 }}>{bmiVal}</div>
              <div style={{ color:bmiCategory.color, fontSize:16, fontWeight:800, marginBottom:12 }}>{bmiCategory.label}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:14 }}>
                {[['<18.5','Underweight','#4cc9f0'],['18.5–24.9','Healthy','#52b788'],['25–29.9','Overweight','#f4a261'],['30+','Obese','#e74c3c']].map(([range, cat, col]) => (
                  <div key={cat} style={{ padding:'4px 8px', borderRadius:8, background:cat===bmiCategory.label?col+'30':'rgba(255,255,255,0.04)', border:`1px solid ${cat===bmiCategory.label?col:'rgba(255,255,255,0.08)'}`, color:cat===bmiCategory.label?col:'rgba(255,255,255,0.3)', fontSize:10, fontWeight:700, textAlign:'center' }}>
                    <div>{range}</div><div>{cat}</div>
                  </div>
                ))}
              </div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.6 }}>Ask your AI coach for a personalised plan based on this result.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grooming Module ────────────────────────────────────────────────────────
function GroomingModule({ accent, accentDim, accentBorder, userProfile, sensors }) {
  const [tab, setTab] = useState('coach');
  const gender = userProfile?.gender?.toLowerCase() || '';
  const isMale = gender.includes('male') && !gender.includes('fe');

  const skinRoutine = isMale ? [
    { step:'AM Step 1', name:'Face Wash', desc:'Use a gentle face wash. Avoid bar soap on face — it strips natural oils.' },
    { step:'AM Step 2', name:'Moisturiser + SPF', desc:'Non-negotiable. SPF 30+ every single morning, even indoors. Choose SPF 50 in Indian summer.' },
    { step:'PM Step 1', name:'Face Wash', desc:'Wash off pollution, sweat, and sunscreen from the day.' },
    { step:'PM Step 2', name:'Moisturiser', desc:'Night cream or a simple moisturiser. Helps skin repair overnight.' },
    { step:'Weekly', name:'Exfoliate', desc:'Once a week. Removes dead skin. Prevents ingrown hairs. Makes shaving easier.' },
  ] : [
    { step:'AM Step 1', name:'Face Wash', desc:'Gentle, sulphate-free cleanser for your skin type.' },
    { step:'AM Step 2', name:'Vitamin C Serum', desc:'Brightens, reduces dark spots. Apply before moisturiser.' },
    { step:'AM Step 3', name:'Moisturiser + SPF 50', desc:'Essential in Indian climate. Reapply every 2 hours in sun.' },
    { step:'PM Step 1', name:'Double Cleanse', desc:'Oil cleanser first, then face wash — removes sunscreen and makeup fully.' },
    { step:'PM Step 2', name:'Retinol / Niacinamide', desc:'Anti-aging, brightening. Start slow — 2x/week, then build up.' },
    { step:'PM Step 3', name:'Night Moisturiser', desc:'Heavier than day cream. Repairs while you sleep.' },
  ];

  const groomingChecklist = [
    { category:'Hair', items: isMale ? ['Wash 2–3x/week (not daily — strips oil)','Use a comb or brush after shower','Get a haircut every 3–4 weeks','Trim neck and ears between cuts'] : ['Trim split ends every 6–8 weeks','Deep condition weekly','Protect hair from heat tools','Oil hair 1–2x/week (coconut or argan)'] },
    { category:'Body', items:['Shower daily — twice in summer','Deodorant every morning (not just perfume)','Trim nails weekly','Moisturise body after shower — especially elbows, knees, heels'] },
    { category:'Oral', items:['Brush 2 minutes — morning and night','Floss daily (most people skip this — don\'t)','Use mouthwash after flossing','Dental check-up every 6 months'] },
    { category:'Clothing', items:['Iron or steam clothes before wearing','Clothes should fit your actual body — not your aspirational body','Clean shoes matter enormously — people notice','Dress one level up from the occasion'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['skin','🧴 Skincare Routine'],['checklist','✅ Full Checklist']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="grooming" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} sensors={sensors} />
        </div>
      )}

      {tab === 'skin' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:14, lineHeight:1.6 }}>
            {userProfile?.gender ? `Routine for: ${userProfile.gender}` : 'Set your profile above for personalised recommendations.'} Indian climate means SPF and hydration are non-negotiable year-round.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {skinRoutine.map((s,i) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:13 }}>
                <div style={{ minWidth:80, color:accent, fontSize:11, fontWeight:800, paddingTop:2 }}>{s.step}</div>
                <div>
                  <div style={{ color:'white', fontSize:14, fontWeight:800, marginBottom:4 }}>{s.name}</div>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'checklist' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {groomingChecklist.map(cat => (
            <div key={cat.category} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:12 }}>{cat.category}</div>
              {cat.items.map((item,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ color:accent, fontSize:11, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lifestyle Module ───────────────────────────────────────────────────────
function LifestyleModule({ accent, accentDim, accentBorder, userProfile, sensors }) {
  const [tab, setTab] = useState('coach');
  const [wakeTime, setWakeTime] = useState('06:00');

  const getMorningRoutine = () => {
    const [h, m] = wakeTime.split(':').map(Number);
    const add = (mins) => {
      const total = h * 60 + m + mins;
      return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
    };
    return [
      { time: wakeTime,   dur:0,  act:'Wake up', note:'No phone for first 30 minutes. This is the most important rule.' },
      { time: add(5),     dur:5,  act:'Hydrate', note:'1 large glass of water before anything else.' },
      { time: add(10),    dur:20, act:'Move',    note:'Walk, stretch, yoga, or workout. Even 20 minutes changes everything.' },
      { time: add(30),    dur:15, act:'Freshen up', note:'Shower, groom, get dressed. How you dress affects how you think.' },
      { time: add(45),    dur:20, act:'Nourish',  note:'Eat something real. Not a biscuit. Protein + complex carbs.' },
      { time: add(65),    dur:20, act:'Mind',     note:'Read, journal, plan your day, meditate. Before the world asks things of you.' },
      { time: add(85),    dur:0,  act:'Begin work', note:"You've already won the morning. The rest follows." },
    ];
  };

  const lifePillars = [
    { icon:'⏰', title:'Routines', desc:'Morning and evening routines are the architecture of a good life. Design them deliberately.', tips:['Same wake time every day — even weekends','No phone first 30 mins after waking or before bed','Plan tomorrow the night before'] },
    { icon:'📵', title:'Digital Wellness', desc:'Your phone is the most addictive device ever created. You need rules or it runs your life.', tips:['Set app limits on social media','No phone at the dining table','Grayscale mode after 9pm','Delete apps you check compulsively but don\'t value'] },
    { icon:'🎯', title:'Deep Work', desc:'2–4 hours of focused work > 8 hours of distracted work.', tips:['Time block your calendar','Work in 90-minute sessions with breaks','One priority task first thing — before email','Notifications off during focus time'] },
    { icon:'🌱', title:'Learning & Growth', desc:'Read. Listen. Study. The people who stop learning stop growing.', tips:['20 pages or 20 minutes of reading daily','Podcasts during commutes and walks','One new skill per quarter','Learn something outside your field'] },
    { icon:'💆', title:'Mental Health', desc:'Your mind is a muscle. It needs rest, exercise, and care.', tips:['Notice when you are burnt out — before it breaks you','Therapy is strength, not weakness','Journaling clears mental clutter','Protect solitude and silence'] },
    { icon:'🏡', title:'Environment', desc:'Your environment shapes your behaviour more than your willpower does.', tips:['Clean, organised spaces reduce stress and increase focus','Keep healthy food at eye level','Put your phone in a drawer when working','Your space reflects your mental state — and vice versa'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['screen','🖥️ Screen Time'],['morning','🌅 Morning Routine'],['pillars','🏛️ Life Pillars']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="lifestyle" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} sensors={sensors} />
        </div>
      )}

      {tab === 'screen' && sensors && (
        <ScreenTimeWidget sensors={sensors} accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
      )}

      {tab === 'morning' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Your wake time:</div>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:9, padding:'8px 12px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {getMorningRoutine().map((r, i, arr) => (
              <div key={i} style={{ display:'flex', gap:14 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:40 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:accent, flexShrink:0, marginTop:16 }} />
                  {i < arr.length-1 && <div style={{ width:2, flex:1, background:`linear-gradient(${accent}60,${accent}20)`, minHeight:20 }} />}
                </div>
                <div style={{ padding:'12px 0 16px', flex:1 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                    <span style={{ color:accent, fontSize:11, fontWeight:800 }}>{r.time}</span>
                    <span style={{ color:'white', fontSize:14, fontWeight:800 }}>{r.act}</span>
                    {r.dur > 0 && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{r.dur} min</span>}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6 }}>{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pillars' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {lifePillars.map(p => (
            <div key={p.title} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{p.icon}</div>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:6 }}>{p.title}</div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6, marginBottom:12 }}>{p.desc}</div>
              {p.tips.map((t,i) => (
                <div key={i} style={{ display:'flex', gap:7, marginBottom:6 }}>
                  <span style={{ color:accent, fontSize:10, marginTop:4, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Etiquette Module ───────────────────────────────────────────────────────
function EtiquetteModule({ accent, accentDim, accentBorder, userProfile, sensors }) {
  const [tab, setTab]     = useState('coach');
  const [scenario, setScenario] = useState(0);

  const etiquetteSections = [
    {
      icon:'🍽️', title:'Dining Etiquette',
      rules:[
        'Wait for everyone to be served before eating — or for the host to invite you to start.',
        'Napkin on your lap the moment you sit. Use it to dab, not wipe.',
        'Chew with your mouth closed. Always. No exceptions.',
        'Elbows off the table while eating. Fine between courses.',
        'Pass food to the right. Never reach across someone.',
        'Phone face-down or away. The person across from you is more important.',
        'When in doubt about cutlery: start from the outside, work inward.',
        'Ask for the bill quietly — never snap fingers or shout.',
        'Compliment the food. Criticise it only if asked, and gently.',
        'Offer to split or pay for the person who invited you.',
      ],
    },
    {
      icon:'💼', title:'Professional Etiquette',
      rules:[
        'Be on time. Being late says "my time matters more than yours."',
        'Firm handshake — 2–3 pumps. Eye contact. Smile.',
        'Remember names. Repeat them back when introduced.',
        'Never interrupt. Wait for a natural pause, then speak.',
        'In meetings: listen more than you talk. Ask good questions.',
        'Reply to emails within 24 hours, even if just to acknowledge.',
        'CC and BCC wisely — not everyone needs to be copied on everything.',
        'Dress one level above the dress code of the occasion.',
        'Thank people — specifically, not generically.',
        'Never badmouth colleagues or your previous employer.',
      ],
    },
    {
      icon:'📱', title:'Digital Etiquette',
      rules:[
        'WhatsApp voice notes: fine for friends, not for professional contacts.',
        'Do not forward unverified news. Ever.',
        'Reply to messages in reasonable time — leaving someone on read is rude.',
        'Do not call without texting first to check if it is a good time.',
        'Your profile photo on professional apps should be professional.',
        'Use punctuation in professional messages. "ok" and "OK." are different things.',
        'Do not add people to groups without asking.',
        'Avoid ALL CAPS — it reads as shouting.',
        'Read before you reply. Do not ask questions that are answered in the message.',
        'LinkedIn is not Instagram. Keep it professional.',
      ],
    },
    {
      icon:'🤝', title:'Social Etiquette',
      rules:[
        'Arrive within 15 minutes of the stated time. Do not arrive early.',
        'Bring something when invited to someone\'s home — mithai, wine, flowers.',
        'Compliment the host on the food and the space.',
        'Do not overstay. Read the room. When energy drops, leave.',
        'Introduce people to each other — never leave someone standing alone.',
        'Ask questions. Be genuinely interested in the people you meet.',
        'Do not dominate the conversation — aim to give, not take.',
        'If you RSVP yes, show up. If you cannot, give as much notice as possible.',
        'Thank the host — in person, and again the next day by message.',
        'Put your phone away. Presence is the greatest gift.',
      ],
    },
    {
      icon:'🗣️', title:'Conversation Skills',
      rules:[
        'Ask open-ended questions — "Tell me about..." beats "Did you...?"',
        'The best conversationalist makes the other person feel interesting — not themselves.',
        'Maintain eye contact 50–60% of the time. More feels aggressive, less feels shifty.',
        'Mirror body language subtly — it builds subconscious rapport.',
        'Avoid the three forbidden topics at mixed company: religion, politics, money.',
        'Never offer unsolicited advice. Wait to be asked.',
        'Disagree with respect: "I see it differently..." not "You\'re wrong."',
        'Silence is okay. You do not need to fill every gap.',
        'Name-drop sparingly. It signals insecurity.',
        'End conversations gracefully: "I have really enjoyed talking with you."',
      ],
    },
  ];

  const scenarios = [
    { title:'The Late Colleague', q:'Your colleague is 20 minutes late to a client meeting and does not acknowledge it. You cover for them. Later they take partial credit for the client winning over. What do you do?', options:['Say nothing — keep the peace','Address it privately and directly','Mention your contribution to your manager','Let it go this time, but set clear expectations going forward'] },
    { title:'The Uncomfortable Guest', q:'At a dinner party, a guest starts telling a clearly racist joke. Everyone goes quiet. What do you do?', options:['Laugh along so it is not awkward','Stay silent but look away','Say "I don\'t find that funny" calmly and change the subject','Walk away without a word'] },
    { title:'The Phone at Dinner', q:'You are having dinner with family. Your boss is texting you about a non-urgent work matter. Do you respond?', options:['Yes — it is the boss, you have to','Tell the boss you\'re unavailable and respond later','Excuse yourself and respond quickly','Respond under the table discreetly'] },
    { title:'The Introduction', q:'You are at a networking event and run into your CEO with an important client. You are not sure if they remember your name. What do you do?', options:['Wait for them to introduce you','Introduce yourself clearly and confidently','Stay quiet and hope they introduce you','Whisper your name to someone nearby first'] },
  ];

  const sc = scenarios[scenario % scenarios.length];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['guide','📚 Etiquette Guide'],['scenarios','🎭 Scenarios']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="etiquette" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} sensors={sensors} />
        </div>
      )}

      {tab === 'guide' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {etiquetteSections.map(s => (
            <details key={s.title} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${accentBorder}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'16px 18px', cursor:'pointer', color:'white', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', gap:10, listStyle:'none' }}>
                <span>{s.icon}</span><span>{s.title}</span><span style={{ marginLeft:'auto', color:accent, fontSize:11, fontWeight:700 }}>▼</span>
              </summary>
              <div style={{ padding:'0 18px 16px' }}>
                {s.rules.map((r,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color:accent, fontWeight:800, fontSize:12, flexShrink:0, marginTop:2 }}>{i+1}.</span>
                    <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {tab === 'scenarios' && (
        <div>
          <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16, marginBottom:14 }}>
            <div style={{ color:accent, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Scenario {(scenario%scenarios.length)+1} of {scenarios.length}</div>
            <div style={{ color:'white', fontSize:15, fontWeight:800, marginBottom:12 }}>{sc.title}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8 }}>{sc.q}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {sc.options.map((opt,i) => (
              <div key={i} style={{ padding:'13px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.5 }}>
                <span style={{ color:accent, fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setScenario(s => s+1)}
              style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${accentBorder}`, background:accentDim, color:accent, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              Next Scenario →
            </button>
          </div>
          <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:12, color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.7 }}>
            Discuss your choice with the AI Coach for a deeper breakdown of what the most gracious response would be and why.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
// ── Critical Thinking Module ───────────────────────────────────────────────
function CriticalThinkingModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const fallacies = [
    { name:'Ad Hominem', desc:'Attacking the person making the argument rather than the argument itself.', example:'"You cannot trust his opinion on climate — he failed science in school."' },
    { name:'Straw Man', desc:'Misrepresenting someone\'s argument to make it easier to attack.', example:'"You want stricter gun laws? So you want to ban all self-defence?"' },
    { name:'False Dilemma', desc:'Presenting only two options when more exist.', example:'"You are either with us or against us."' },
    { name:'Appeal to Authority', desc:'Using someone\'s authority as evidence instead of actual reasoning.', example:'"This celebrity doctor recommends this supplement, so it must work."' },
    { name:'Bandwagon', desc:'Assuming something is true or good because many people believe it.', example:'"Everyone is investing in crypto, so it must be safe."' },
    { name:'Slippery Slope', desc:'Claiming one event will lead to extreme consequences without evidence.', example:'"If we allow this, next they will want to ban everything."' },
    { name:'Confirmation Bias', desc:'Seeking only information that confirms what you already believe.', example:'Reading only news sources that match your political views.' },
    { name:'Post Hoc', desc:'Assuming that because B followed A, A caused B.', example:'"I wore my lucky shirt and we won — the shirt caused the win."' },
  ];
  const checklist = [
    'What is the claim being made?',
    'Who is making it, and do they have something to gain?',
    'What evidence supports it — and is that evidence reliable?',
    'What evidence contradicts it?',
    'Could there be another explanation?',
    'Am I believing this because I want it to be true?',
    'Would I accept this reasoning if the conclusion were different?',
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['fallacies','🚩 Logical Fallacies'],['checklist','✅ Thinking Checklist']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="criticalthinking" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='fallacies' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {fallacies.map(f => (
            <div key={f.name} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:6 }}>{f.name}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6, marginBottom:10 }}>{f.desc}</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12, fontStyle:'italic', lineHeight:1.5, borderLeft:`2px solid ${accentBorder}`, paddingLeft:10 }}>{f.example}</div>
            </div>
          ))}
        </div>
      )}
      {tab==='checklist' && (
        <div style={{ padding:'20px', background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
          <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:14 }}>Before you believe or share anything — ask these:</div>
          {checklist.map((q,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:24, height:24, borderRadius:6, background:accentDim, border:`1px solid ${accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:accent, fontSize:12, fontWeight:900 }}>{i+1}</div>
              <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6, paddingTop:2 }}>{q}</span>
            </div>
          ))}
          <div style={{ marginTop:16, padding:'12px 14px', background:accentDim, borderRadius:10, color:accent, fontSize:13, fontWeight:700 }}>Apply this checklist to every WhatsApp forward, news headline, and product claim you encounter.</div>
        </div>
      )}
    </div>
  );
}

// ── Public Speaking Module ─────────────────────────────────────────────────
function PublicSpeakingModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const techniques = [
    { icon:'⏸️', title:'The Power Pause', desc:'Pause for 2–3 seconds before important points. Silence signals confidence and gives your audience time to absorb what you said.' },
    { icon:'👁️', title:'Eye Contact Triangle', desc:'Move your gaze between three points in the room in a triangle pattern — left, centre, right. Hold each for 3–5 seconds. Never scan.' },
    { icon:'📐', title:'The Rule of Three', desc:'Structure any message in threes. People remember threes. "Tell them what you\'ll say, say it, tell them what you said."' },
    { icon:'📖', title:'Open with a Story', desc:'The brain is wired for narrative. Begin with a specific moment — "Last Tuesday, I was sitting in a traffic jam when..." — not with context or agenda.' },
    { icon:'🎯', title:'One Idea Per Talk', desc:'The best talks have one central idea. Everything else supports it. If you can\'t write your core message in one sentence, you are not ready.' },
    { icon:'🫁', title:'Box Breathing', desc:'Before speaking: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 3x. Activates the parasympathetic system and reduces visible nervousness.' },
  ];
  const structures = [
    { name:'PAS', desc:'Problem → Agitate → Solution. Name the problem, make it real, offer the fix. Best for persuasion.' },
    { name:'STAR', desc:'Situation → Task → Action → Result. Ideal for answering "tell me about a time when..." in interviews.' },
    { name:'What / So What / Now What', desc:'State the fact → explain why it matters → tell them what to do next. Clean and simple.' },
    { name:'5-Minute Structure', desc:'Hook (30s) → Context (1m) → 3 key points (3m) → Call to action (30s).' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['techniques','🎯 Techniques'],['structure','📐 Structure']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="publicspeaking" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='techniques' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
          {techniques.map(t => (
            <div key={t.title} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.icon}</div>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:8 }}>{t.title}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.7 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      )}
      {tab==='structure' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {structures.map(s => (
            <div key={s.name} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ minWidth:80, color:accent, fontSize:14, fontWeight:900, paddingTop:2 }}>{s.name}</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.7 }}>{s.desc}</div>
            </div>
          ))}
          <div style={{ padding:'14px 16px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.7 }}>
            <strong style={{ color:accent }}>Daily practice:</strong> Record yourself speaking for 2 minutes on any topic. Watch it back with the sound off first (body language), then with sound only (pace, filler words, clarity). Do this daily for 30 days.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Legal Literacy Module ──────────────────────────────────────────────────
function LegalLiteracyModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const rights = [
    { area:'🚔 Police & Arrest', items:['You have the right to know the reason for arrest (Article 22)', 'You cannot be detained for more than 24 hours without a magistrate\'s order', 'You have the right to legal representation immediately', 'You do not have to answer questions without a lawyer present', 'A woman cannot be arrested after sunset or before sunrise (Section 46 CrPC)', 'You can file an FIR — police cannot refuse to register it'] },
    { area:'🏠 Tenant Rights', items:['Get every agreement in writing — verbal is unenforceable', 'Landlord must give 1 month notice before eviction in most states', 'Landlord cannot enter your home without prior notice', 'Security deposit must be returned within 30 days of vacating', 'Keep photos of the property condition on move-in', 'Rent cannot be increased mid-tenancy without written agreement'] },
    { area:'🛒 Consumer Rights', items:['Right to safety, information, choice, and redressal (Consumer Protection Act 2019)', 'You can file a complaint online at consumerhelpline.gov.in', 'Companies must honour warranty and replacement commitments', 'E-commerce companies are liable for defective goods sold on their platform', 'You can demand a written receipt for any purchase above ₹200', 'Mental harassment by a company is a valid consumer complaint'] },
    { area:'💼 Employment Rights', items:['Employer must provide an offer letter with all terms in writing', 'Notice period must be stated in your contract — both ways', 'Salary must be paid by the 7th of every month (Payment of Wages Act)', 'Sexual harassment complaints go to the Internal Complaints Committee (ICC)', 'You cannot be fired without due process — show cause notice is mandatory', 'PF deduction must be visible on your payslip'] },
    { area:'📱 Digital Rights', items:['Your personal data is protected under IT Act 2000 and DPDP Act 2023', 'Companies must delete your data on request (Right to Erasure)', 'Cybercrime complaints: cybercrime.gov.in or call 1930', 'Screenshot of a private conversation shared without consent = criminal offence', 'Online fraud: file FIR immediately + report to bank within 3 days for reversal', 'You cannot be arrested for expressing opinion — only for incitement or defamation'] },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['rights','⚖️ Your Rights']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      <div style={{ padding:'12px 14px', background:'rgba(249,199,79,0.08)', border:'1px solid rgba(249,199,79,0.2)', borderRadius:10, color:'rgba(249,199,79,0.9)', fontSize:12, lineHeight:1.6 }}>
        ⚠️ This is general legal education, not legal advice. For specific legal problems, always consult a qualified lawyer.
      </div>
      {tab==='coach' && <div style={{ height:440, display:'flex', flexDirection:'column' }}><AICoach moduleId="legalliteracy" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='rights' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {rights.map(r => (
            <details key={r.area} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${accentBorder}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'14px 16px', cursor:'pointer', color:'white', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'space-between', listStyle:'none' }}>
                <span>{r.area}</span><span style={{ color:accent, fontSize:11 }}>▼</span>
              </summary>
              <div style={{ padding:'4px 16px 16px' }}>
                {r.items.map((item,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color:accent, fontWeight:800, fontSize:12, flexShrink:0, marginTop:2 }}>•</span>
                    <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Emotional Intelligence Module ──────────────────────────────────────────
function EmotionalIntelligenceModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const emotions = [
    { name:'Anger', color:'#e74c3c', triggers:'Injustice, disrespect, unmet expectations', healthy:'Signal that a boundary has been crossed', unhealthy:'Lashing out, saying things you regret, physical aggression', tool:'Name it: "I feel angry because..." — naming reduces intensity by 50%' },
    { name:'Anxiety', color:'#f39c12', triggers:'Uncertainty, loss of control, perceived threat', healthy:'Preparation and alertness signal', unhealthy:'Avoidance, catastrophising, physical symptoms', tool:'Box breathing: inhale 4, hold 4, exhale 4, hold 4. Repeat 4 times.' },
    { name:'Sadness', color:'#3498db', triggers:'Loss, disappointment, loneliness, grief', healthy:'Processing signal — necessary for healing', unhealthy:'Isolation, numbing, prolonged despair', tool:'Name the loss specifically. Allow tears. Avoid isolation for more than 48 hours.' },
    { name:'Shame', color:'#9b59b6', triggers:'Feeling fundamentally flawed or defective', healthy:'None — shame is rarely healthy', unhealthy:'Hiding, people-pleasing, perfectionism, aggression', tool:'Distinguish shame ("I am bad") from guilt ("I did something bad"). Talk to someone you trust.' },
    { name:'Fear', color:'#1abc9c', triggers:'Real or perceived danger, uncertainty', healthy:'Protective signal in genuine danger', unhealthy:'Paralysis, avoidance of growth opportunities', tool:'Ask: is this danger real and present, or imagined and future? Act on real danger; examine imagined fear.' },
  ];
  const eq_skills = [
    { skill:'Self-Awareness', desc:'Knowing what you are feeling and why. The foundation of all emotional intelligence.', practice:'Keep a 5-minute emotion journal every evening. Name 3 emotions you felt today and what triggered them.' },
    { skill:'Self-Regulation', desc:'Managing your emotions rather than being managed by them. Space between trigger and response.', practice:'When triggered, wait 90 seconds before responding. The initial emotional surge physiologically lasts 90 seconds.' },
    { skill:'Motivation', desc:'Using emotions as fuel for goals rather than obstacles to them.', practice:'Connect your daily tasks to your deeper values. Ask: why does this matter to me?' },
    { skill:'Empathy', desc:'Understanding and sharing the feelings of another. The bridge to all relationships.', practice:'In every conversation, ask yourself: what is this person feeling right now? What do they need?' },
    { skill:'Social Skills', desc:'Managing relationships, influencing others, and navigating conflict constructively.', practice:'In your next disagreement, state the other person\'s view accurately before stating your own.' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['emotions','💭 Emotion Guide'],['skills','🎯 EQ Skills']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="emotionalintelligence" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='emotions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {emotions.map(e => (
            <details key={e.name} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.08)`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'14px 16px', cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:e.color, flexShrink:0 }} />
                <span style={{ color:'white', fontSize:14, fontWeight:800, flex:1 }}>{e.name}</span>
                <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>▼</span>
              </summary>
              <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                {[['🔥 Triggers', e.triggers],['✅ When healthy', e.healthy],['⚠️ When unhealthy', e.unhealthy],['🛠️ Tool', e.tool]].map(([lbl,val]) => (
                  <div key={lbl} style={{ display:'flex', gap:10 }}>
                    <span style={{ color:e.color, fontSize:12, fontWeight:800, minWidth:120, flexShrink:0 }}>{lbl}</span>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6 }}>{val}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {tab==='skills' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {eq_skills.map(s => (
            <div key={s.skill} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:6 }}>{s.skill}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6, marginBottom:12 }}>{s.desc}</div>
              <div style={{ padding:'10px 14px', background:accentDim, borderRadius:10 }}>
                <span style={{ color:accent, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px' }}>Practice: </span>
                <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{s.practice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── First Aid Module ───────────────────────────────────────────────────────
function FirstAidModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const emergencies = [
    {
      icon:'❤️', title:'CPR (Adult)',
      steps:['Call 112 immediately — do not delay','Place heel of hand on centre of chest','Lock fingers, arms straight, compress 5–6 cm deep','Rate: 100–120 compressions per minute (beat of "Stayin\' Alive")','If trained: give 2 rescue breaths after every 30 compressions','Continue until ambulance arrives or person revives'],
      warning:'Do NOT stop CPR until professional help takes over — even if you are tired.'
    },
    {
      icon:'🫁', title:'Choking (Adult)',
      steps:['Ask "Are you choking?" — if they cannot speak or cough, act now','Stand behind them, lean them slightly forward','Give 5 firm back blows between shoulder blades','If still choking: give 5 abdominal thrusts (Heimlich manoeuvre)','Clasp fist above navel, pull sharply inward and upward','Alternate back blows and abdominal thrusts until clear or unconscious'],
      warning:'If they lose consciousness, begin CPR and call 112.'
    },
    {
      icon:'🩸', title:'Severe Bleeding',
      steps:['Wear gloves if available — blood-borne disease risk','Apply firm direct pressure with clean cloth or bandage','Do NOT remove the cloth — add more on top if soaking through','Elevate the injured limb above heart level if possible','Apply pressure continuously for at least 10 minutes','For major artery bleed: use a tourniquet 5–7 cm above wound'],
      warning:'Do not use a tourniquet except for life-threatening limb bleeding. Mark time applied.'
    },
    {
      icon:'🔥', title:'Burns',
      steps:['Stop the burning: remove from source, remove jewellery, clothing near area','Cool: run under cool (not cold/ice) water for 20 minutes','Do NOT use butter, toothpaste, or ice — these cause more damage','Cover loosely with clean non-fluffy material','Seek medical help for burns larger than your palm or on face/hands/joints','For chemical burns: brush off dry chemical first, then water 20 mins'],
      warning:'Never pop burn blisters — they are a sterile barrier against infection.'
    },
    {
      icon:'🧠', title:'Stroke (FAST)',
      steps:['F — Face: ask them to smile. Does one side droop?','A — Arms: ask to raise both arms. Does one drift down?','S — Speech: ask to repeat a phrase. Is it slurred or strange?','T — Time: if any sign is present, call 112 immediately','Note the exact time symptoms started — critical for doctors','Keep them calm, do not give food or water'],
      warning:'Every minute without treatment, 1.9 million brain cells die. Time is brain.'
    },
  ];
  const kit = [
    'Sterile gauze pads (multiple sizes)', 'Adhesive bandages (assorted)', 'Medical tape',
    'Antiseptic solution (Betadine or Dettol)', 'Cotton wool', 'Scissors and tweezers',
    'Digital thermometer', 'Disposable gloves (at least 2 pairs)', 'ORS sachets',
    'Paracetamol (500mg)', 'Antacid', 'Antihistamine',
    'Emergency contacts list (printed)', 'Torch / torch app on phone',
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['emergencies','🚨 Emergency Guide'],['kit','🎒 First Aid Kit']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      <div style={{ padding:'12px 14px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:10, color:'rgba(255,160,160,0.9)', fontSize:13, fontWeight:700 }}>
        🚨 India Emergency: Call <strong>112</strong> &nbsp;|&nbsp; Ambulance: <strong>108</strong> &nbsp;|&nbsp; Police: <strong>100</strong> &nbsp;|&nbsp; Fire: <strong>101</strong>
      </div>
      {tab==='coach' && <div style={{ height:440, display:'flex', flexDirection:'column' }}><AICoach moduleId="firstaid" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='emergencies' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {emergencies.map(e => (
            <details key={e.title} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${accentBorder}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'14px 16px', cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>{e.icon}</span>
                <span style={{ color:'white', fontSize:14, fontWeight:800, flex:1 }}>{e.title}</span>
                <span style={{ color:accent, fontSize:11 }}>▼ Show steps</span>
              </summary>
              <div style={{ padding:'0 16px 16px' }}>
                {e.steps.map((s,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:accentDim, border:`1px solid ${accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:accent, fontSize:11, fontWeight:900 }}>{i+1}</div>
                    <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6, paddingTop:2 }}>{s}</span>
                  </div>
                ))}
                <div style={{ marginTop:10, padding:'10px 12px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:8, color:'rgba(255,160,160,0.9)', fontSize:12, lineHeight:1.5 }}>⚠️ {e.warning}</div>
              </div>
            </details>
          ))}
        </div>
      )}
      {tab==='kit' && (
        <div style={{ padding:'20px', background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
          <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:14 }}>Essential Home First Aid Kit</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
            {kit.map((item,i) => (
              <div key={i} style={{ display:'flex', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <span style={{ color:accent, fontSize:12, marginTop:2, flexShrink:0 }}>✓</span>
                <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.7 }}>
            Check expiry dates every 6 months. Keep the kit in a fixed, accessible location — tell everyone in the house where it is.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sleep Science Module ───────────────────────────────────────────────────
function SleepModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const [log, setLog] = useState({ bed:'', wake:'', quality:'' });

  const calcSleep = () => {
    if (!log.bed || !log.wake) return null;
    const [bh,bm] = log.bed.split(':').map(Number);
    const [wh,wm] = log.wake.split(':').map(Number);
    let mins = (wh*60+wm) - (bh*60+bm);
    if (mins < 0) mins += 1440;
    return (mins/60).toFixed(1);
  };
  const hrs = calcSleep();
  const sleepColor = hrs ? hrs>=7&&hrs<=9 ? '#52b788' : hrs>=6 ? '#ffd166' : '#e74c3c' : null;

  const hygiene = [
    { icon:'🌡️', rule:'Keep bedroom cool (18–20°C)', why:'Core body temp must drop 1°C to initiate sleep' },
    { icon:'🌑', rule:'Total darkness — blackout curtains or eye mask', why:'Even dim light suppresses melatonin by 50%' },
    { icon:'📵', rule:'No screens 30–60 min before bed', why:'Blue light delays melatonin onset by 2–3 hours' },
    { icon:'☕', rule:'No caffeine after 2 PM', why:'Caffeine half-life is 5–7 hours — still half active at midnight' },
    { icon:'⏰', rule:'Same wake time every day — including weekends', why:'The most powerful circadian anchor. Consistent beats duration.' },
    { icon:'🧘', rule:'Wind-down routine: 20–30 min of calm before bed', why:'The brain needs a transition — it cannot switch off instantly' },
    { icon:'🏋️', rule:'Exercise — but not within 2 hours of bedtime', why:'Exercise raises core temp and cortisol, delaying sleep onset' },
    { icon:'🍽️', rule:'No heavy meals within 3 hours of sleep', why:'Digestion raises metabolism and disrupts sleep stages' },
  ];

  const stages = [
    { stage:'Stage 1 (N1)', pct:5, color:'#a8dadc', desc:'Light sleep. Easy to wake. Muscle twitches common.' },
    { stage:'Stage 2 (N2)', pct:45, color:'#7b68ee', desc:'True sleep begins. Heart rate slows. Memory consolidation starts.' },
    { stage:'Stage 3 (N3)', pct:25, color:'#5c4db1', desc:'Deep sleep. Hardest to wake. Physical repair, immune function, growth hormone.' },
    { stage:'REM Sleep', pct:25, color:'#f72585', desc:'Emotional processing, creativity, memory integration. Most dreaming occurs here.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['hygiene','🛏️ Sleep Hygiene'],['stages','🧬 Sleep Stages'],['tracker','📊 Sleep Log']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="sleep" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='hygiene' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {hygiene.map(h => (
            <div key={h.rule} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:22 }}>{h.icon}</span>
                <span style={{ color:'white', fontSize:13, fontWeight:800 }}>{h.rule}</span>
              </div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6, fontStyle:'italic' }}>{h.why}</div>
            </div>
          ))}
        </div>
      )}
      {tab==='stages' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', height:32, borderRadius:8, overflow:'hidden', gap:2 }}>
            {stages.map(s => <div key={s.stage} style={{ flex:s.pct, background:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:10, fontWeight:800, color:'white' }}>{s.pct}%</span></div>)}
          </div>
          {stages.map(s => (
            <div key={s.stage} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.08)`, borderRadius:12, display:'flex', gap:12 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:s.color, flexShrink:0, marginTop:3 }} />
              <div>
                <div style={{ color:'white', fontSize:13, fontWeight:800, marginBottom:4 }}>{s.stage} — {s.pct}% of night</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:'12px 16px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.7 }}>
            <strong style={{ color:accent }}>Key insight:</strong> You cycle through all stages every 90 minutes. 7.5 or 9 hours (5 or 6 full cycles) leaves you waking at the end of a cycle — feeling far more rested than 8 hours cut mid-cycle.
          </div>
        </div>
      )}
      {tab==='tracker' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[['bed','Bed time','HH:MM'],['wake','Wake time','HH:MM'],['quality','Quality (1–10)','e.g. 7']].map(([k,lbl,ph]) => (
              <div key={k}>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>{lbl}</div>
                <input type={k==='quality'?'number':'time'} value={log[k]} onChange={e => setLog(l=>({...l,[k]:e.target.value}))}
                  placeholder={ph} min={k==='quality'?1:undefined} max={k==='quality'?10:undefined}
                  style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none' }} />
              </div>
            ))}
          </div>
          {hrs && (
            <div style={{ padding:'20px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16, textAlign:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, marginBottom:8 }}>LAST NIGHT</div>
              <div style={{ fontSize:52, fontWeight:900, color:sleepColor, marginBottom:8 }}>{hrs}h</div>
              <div style={{ color:sleepColor, fontSize:16, fontWeight:800 }}>
                {parseFloat(hrs)>=7&&parseFloat(hrs)<=9 ? 'Excellent — in the optimal range' : parseFloat(hrs)>=6 ? 'Borderline — aim for 7–9 hours' : 'Insufficient — this is affecting everything'}
              </div>
              {log.quality && <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:8 }}>Subjective quality: {log.quality}/10</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cooking & Nutrition Module ─────────────────────────────────────────────
function CookingModule({ accent, accentDim, accentBorder, sensors, userProfile }) {
  const [tab, setTab] = useState('coach');

  const dishes = [
    { name:'Dal Tadka', time:'20 min', protein:'12g/serving', desc:'Soak toor dal 30 min. Pressure cook 3 whistles. Temper with ghee, mustard, cumin, garlic, dried red chilli, tomato, and turmeric. The foundation of Indian eating.' },
    { name:'Egg Bhurji', time:'10 min', protein:'14g/serving', desc:'Beat 2 eggs. Sauté onion, green chilli, tomato in oil. Add eggs, scramble on medium heat. Add salt, turmeric, coriander. Fastest high-protein meal possible.' },
    { name:'Vegetable Pulao', time:'25 min', protein:'8g/serving', desc:'Fry whole spices in oil. Add onion, ginger-garlic paste. Add mixed vegetables. Add soaked rice and water (1:2 ratio). Cook covered on low until done.' },
    { name:'Aloo Sabzi', time:'15 min', protein:'4g/serving', desc:'Boil and cube potatoes. Sauté cumin, onion, tomato, green chilli. Add potatoes, turmeric, cumin powder, coriander. The most adaptable Indian dish.' },
    { name:'Curd Rice', time:'10 min', protein:'7g/serving', desc:'Mix cooked rice with thick curd (not watery). Temper mustard, curry leaves, green chilli, ginger. Add salt. Perfect meal when nothing else is ready.' },
    { name:'Moong Dal Khichdi', time:'20 min', protein:'11g/serving', desc:'Pressure cook rice + moong dal (equal parts) with turmeric and salt, 4 whistles. Temper with ghee, cumin, asafoetida. The most complete, digestible Indian meal.' },
  ];

  const nutrition = [
    { nutrient:'Protein', need:'1.0–1.6g per kg body weight/day', indian_sources:'Curd, paneer, dal, eggs, chicken, soya, sprouts, peanuts', gap:'Most Indians eat 40% less than needed' },
    { nutrient:'Iron', need:'Men: 8mg/day | Women: 18mg/day', indian_sources:'Spinach (with Vitamin C), rajma, ragi, dates, jaggery, sesame', gap:'Anaemia affects 57% of Indian women' },
    { nutrient:'Calcium', need:'1000mg/day for adults', indian_sources:'Ragi, sesame seeds, curd, milk, paneer, green leafy vegetables', gap:'Most Indians lack adequate dairy or substitutes' },
    { nutrient:'Vitamin D', need:'600–800 IU/day', indian_sources:'Sun exposure (20 min, 11am–2pm), egg yolk, fatty fish, fortified milk', gap:'75% of urban Indians are deficient despite sunny climate' },
    { nutrient:'Fibre', need:'25–35g/day', indian_sources:'Whole grains, rajma, chana, all sabzis, fruits with skin', gap:'White rice and maida dominate Indian diets, stripping fibre' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['dishes','🍽️ Essential Dishes'],['nutrition','🥗 Nutrition Guide']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="cooking" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} userProfile={userProfile} /></div>}
      {tab==='dishes' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {dishes.map(d => (
            <div key={d.name} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ color:accent, fontSize:15, fontWeight:800 }}>{d.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ padding:'2px 8px', background:accentDim, borderRadius:8, color:accent, fontSize:11, fontWeight:700 }}>⏱ {d.time}</span>
                  <span style={{ padding:'2px 8px', background:'rgba(82,183,136,0.15)', borderRadius:8, color:'#52b788', fontSize:11, fontWeight:700 }}>💪 {d.protein}</span>
                </div>
              </div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.7 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      )}
      {tab==='nutrition' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {nutrition.map(n => (
            <details key={n.nutrient} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${accentBorder}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'14px 16px', cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'white', fontSize:14, fontWeight:800 }}>{n.nutrient}</span>
                <span style={{ color:accent, fontSize:11 }}>▼</span>
              </summary>
              <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                {[['Daily need',n.need],['Indian sources',n.indian_sources],['The gap',n.gap]].map(([lbl,val]) => (
                  <div key={lbl} style={{ display:'flex', gap:10 }}>
                    <span style={{ color:accent, fontSize:12, fontWeight:800, minWidth:110, flexShrink:0 }}>{lbl}</span>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6 }}>{val}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Time Management Module ─────────────────────────────────────────────────
function TimeManagementModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const [tasks, setTasks] = useState([{text:'',quadrant:'do'}]);

  const quadrants = [
    { id:'do', label:'Do First', sub:'Urgent + Important', color:'#e74c3c', desc:'Deadlines, crises, genuine emergencies. These must be done today.' },
    { id:'schedule', label:'Schedule', sub:'Not Urgent + Important', color:'#52b788', desc:'Planning, relationships, learning, exercise. This is where results live.' },
    { id:'delegate', label:'Delegate', sub:'Urgent + Not Important', color:'#f4a261', desc:'Interruptions, some emails, some meetings. Do these quickly or delegate.' },
    { id:'eliminate', label:'Eliminate', sub:'Not Urgent + Not Important', color:'rgba(255,255,255,0.3)', desc:'Mindless scrolling, trivial tasks, busywork. Cut ruthlessly.' },
  ];

  const techniques = [
    { name:'Time Blocking', desc:'Assign every hour of your day a specific task — before the day begins. Defend these blocks like meetings.', when:'Sunday evening or the night before' },
    { name:'Pomodoro (25/5)', desc:'Work for 25 minutes with full focus. Rest 5 minutes. After 4 rounds, take a 20-minute break.', when:'For tasks requiring deep concentration' },
    { name:'Two-Minute Rule', desc:'If a task takes less than 2 minutes, do it immediately. Do not defer it to a list.', when:'For emails, small requests, quick decisions' },
    { name:'MIT (Most Important Task)', desc:'Identify the single most important thing to do today. Do it first, before email or messages.', when:'Every morning before opening any app' },
    { name:'Weekly Review', desc:'Every Sunday: review last week, clear open loops, plan the week ahead. 30 minutes. Non-negotiable.', when:'Every Sunday, same time, same place' },
    { name:'Deep Work Blocks', desc:'Schedule 2–4 hours of uninterrupted work on your highest-value activity. Phone off. Notifications off.', when:'Your peak energy window (usually morning)' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['matrix','📊 Priority Matrix'],['techniques','⚡ Techniques']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="timemanagement" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}
      {tab==='matrix' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>The Eisenhower Matrix — used by high performers to separate what matters from what feels urgent but doesn't.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {quadrants.map(q => (
              <div key={q.id} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`2px solid ${q.color}40`, borderRadius:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ color:q.color, fontSize:14, fontWeight:800 }}>{q.label}</div>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', alignSelf:'center' }}>{q.sub}</span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:12, lineHeight:1.6 }}>{q.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, padding:'12px 16px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.7 }}>
            <strong style={{ color:accent }}>The insight:</strong> Most people spend their days in quadrants 1 and 3 — urgent things. But the life-changing work lives in quadrant 2. You have to schedule it deliberately or it will never happen.
          </div>
        </div>
      )}
      {tab==='techniques' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {techniques.map(t => (
            <div key={t.name} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ color:accent, fontSize:14, fontWeight:800 }}>{t.name}</div>
                <span style={{ padding:'2px 10px', background:accentDim, borderRadius:10, color:accent, fontSize:11, fontWeight:700, flexShrink:0, marginLeft:8 }}>{t.when}</span>
              </div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.7 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Career Planning Module ─────────────────────────────────────────────────
function CareerPlanningModule({ accent, accentDim, accentBorder, sensors, userProfile }) {
  const [tab, setTab] = useState('coach');
  const [ikigai, setIkigai] = useState({ love:'', good:'', paid:'', world:'' });

  const stages = [
    { stage:'Explore (18–24)', color:'#a8dadc', actions:['Try internships in 2–3 different fields','Talk to 10 people doing jobs you find interesting','Do not commit to a path based on salary alone','Build skills that transfer across industries'] },
    { stage:'Build (24–30)', color:'#4cc9f0', actions:['Go deep on one skill until you are in the top 20%','Find your first mentor — someone 10 years ahead','Build a portfolio, not just a resume','Negotiate your first salary — most first offers are not final'] },
    { stage:'Advance (30–40)', color:'#7b68ee', actions:['Develop leadership and management skills','Build a professional network with genuine relationships','Consider: is this path still aligned with your values?','Think about income diversification — freelance, investments'] },
    { stage:'Master (40+)', color:'#f72585', actions:['Focus on contribution and legacy, not just advancement','Mentor others — it accelerates your own growth','Transition if needed — it is never too late','Balance ambition with sustainability and family'] },
  ];

  const ikigaiComplete = Object.values(ikigai).every(v => v.trim().length > 5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['ikigai','🎯 Find Your Ikigai'],['stages','📈 Career Stages']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>
      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="careerplanning" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} userProfile={userProfile} /></div>}
      {tab==='ikigai' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.7, marginBottom:16 }}>
            Ikigai (生き甲斐) is the Japanese concept of your reason for being — the intersection of what you love, what you are good at, what the world needs, and what you can be paid for. Fill in all four to discover yours.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              ['love','❤️ What do I love doing?','Things that make you lose track of time',accent],
              ['good','⭐ What am I good at?','Skills others notice and value','#52b788'],
              ['paid','💰 What can I be paid for?','Problems people will pay you to solve','#f4a261'],
              ['world','🌍 What does the world need?','What gap or problem genuinely matters to you','#a8dadc'],
            ].map(([key,lbl,ph,col]) => (
              <div key={key} style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.08)`, borderRadius:14 }}>
                <div style={{ color:col, fontSize:13, fontWeight:800, marginBottom:8 }}>{lbl}</div>
                <textarea data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" value={ikigai[key]} onChange={e => setIkigai(i=>({...i,[key]:e.target.value}))}
                  placeholder={ph} rows={3}
                  style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none' }} />
              </div>
            ))}
          </div>
          {ikigaiComplete && (
            <div style={{ padding:'16px 18px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:10 }}>Your Ikigai intersection:</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.8 }}>
                You love <strong style={{color:'white'}}>{ikigai.love}</strong>, you are good at <strong style={{color:'white'}}>{ikigai.good}</strong>, the world needs <strong style={{color:'white'}}>{ikigai.world}</strong>, and you can be paid for <strong style={{color:'white'}}>{ikigai.paid}</strong>. Ask your AI coach to help you find the career paths that sit at this intersection.
              </div>
            </div>
          )}
        </div>
      )}
      {tab==='stages' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {stages.map(s => (
            <div key={s.stage} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1.5px solid ${s.color}40`, borderRadius:16 }}>
              <div style={{ color:s.color, fontSize:14, fontWeight:800, marginBottom:10 }}>{s.stage}</div>
              {s.actions.map((a,i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <span style={{ color:s.color, fontSize:12, marginTop:2, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{a}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Digital Literacy Module ────────────────────────────────────────────────
function DigitalLiteracyModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');

  const threats = [
    { icon:'📱', name:'UPI / Payment Fraud', severity:'HIGH', desc:'Fake payment requests, screen-share scams, QR code tricks. The sender always pays — you never need to scan to receive money.', action:'Never share OTP, UPI PIN, or do a "test transaction". Hang up on anyone who asks. Call 1930 immediately if defrauded.' },
    { icon:'📧', name:'Phishing', severity:'HIGH', desc:'Fake emails/SMS from "HDFC Bank", "IRCTC", "Amazon" with urgent links. Always check the actual sender domain — not the display name.', action:'Never click links in SMS. Type the URL directly. Hover over links to see the real destination before clicking.' },
    { icon:'📲', name:'WhatsApp Forwards', severity:'MED', desc:'Fake news, doctored photos, false health advice, investment scams. India shares more misinformation per capita than any other country.', action:'Apply the 3-source rule: verify with 3 independent reliable sources before believing or sharing anything alarming.' },
    { icon:'🔐', name:'Weak Passwords', severity:'HIGH', desc:'Using the same password across accounts means one breach exposes everything. "Password123" and your birthday are hacked in seconds.', action:'Use a password manager (Bitwarden is free). Enable 2FA on all important accounts. Each password must be unique.' },
    { icon:'📷', name:'Camera & Mic Access', severity:'MED', desc:'Many apps request camera, microphone, and location access they do not need. This data is harvested and sold.', action:'Review app permissions: Settings → Apps → Permissions. Revoke access for any app that does not genuinely need it.' },
    { icon:'🌐', name:'Public Wi-Fi', severity:'MED', desc:'Airport, café, and hotel Wi-Fi can be intercepted. Man-in-the-middle attacks capture passwords, banking sessions, messages.', action:'Never do banking or sensitive transactions on public Wi-Fi. Use mobile data instead, or a reputable VPN.' },
    { icon:'🎣', name:'Social Engineering', severity:'HIGH', desc:'"KYC expiry", "your account will be blocked", "lottery winner" — these trigger panic so you act before thinking.', action:'Slow down. Legitimate organisations never demand immediate action by phone. Call the official number yourself.' },
    { icon:'👤', name:'Digital Footprint', severity:'LOW', desc:'Everything you post, like, comment, or search creates a permanent profile. Future employers, colleges, and partners will search for you.', action:'Google yourself. Review your social media privacy settings now. Anything you would not show your boss — remove it.' },
  ];

  const audit = [
    { cat:'Passwords', checks:['I use different passwords for different accounts','I use a password manager or very strong unique passwords','I have enabled 2-Factor Authentication on email and banking apps','I have not shared my password with anyone'] },
    { cat:'Phone Security', checks:['My phone has a strong PIN or biometric lock','I review app permissions regularly and revoke unnecessary ones','I have Find My Device / Remote Wipe enabled','I back up my phone data weekly'] },
    { cat:'Online Behaviour', checks:['I verify news before sharing it','I never click links in SMS messages — I type URLs directly','I use secure websites (https://) for any sensitive transactions','I have checked my privacy settings on WhatsApp, Instagram, and Google'] },
    { cat:'Financial Safety', checks:['I never share OTP with anyone — including "bank employees"','I have set transaction limits on my UPI and banking apps','I know how to freeze my card instantly if needed','I know the cybercrime helpline number: 1930'] },
  ];

  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked(c => ({ ...c, [key]: !c[key] }));
  const totalChecks = audit.reduce((a, c) => a + c.checks.length, 0);
  const doneChecks  = Object.values(checked).filter(Boolean).length;
  const score       = Math.round((doneChecks / totalChecks) * 100);
  const scoreColor  = score >= 80 ? '#52b788' : score >= 50 ? '#ffd166' : '#e74c3c';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['threats','🚨 Threat Guide'],['audit','🔍 Security Audit']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="digitalliteracy" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}

      {tab==='threats' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {threats.map(t => (
            <details key={t.name} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${t.severity==='HIGH'?'rgba(231,76,60,0.3)':t.severity==='MED'?'rgba(255,209,102,0.25)':'rgba(255,255,255,0.08)'}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'13px 16px', cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{t.icon}</span>
                <span style={{ color:'white', fontSize:13, fontWeight:800, flex:1 }}>{t.name}</span>
                <span style={{ padding:'2px 9px', borderRadius:10, fontSize:10, fontWeight:800, background: t.severity==='HIGH'?'rgba(231,76,60,0.2)':t.severity==='MED'?'rgba(255,209,102,0.15)':'rgba(255,255,255,0.08)', color: t.severity==='HIGH'?'#e74c3c':t.severity==='MED'?'#ffd166':'rgba(255,255,255,0.4)' }}>{t.severity}</span>
              </summary>
              <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.7 }}>{t.desc}</div>
                <div style={{ padding:'10px 14px', background:accentDim, borderRadius:10 }}>
                  <span style={{ color:accent, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px' }}>What to do: </span>
                  <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6 }}>{t.action}</span>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {tab==='audit' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ padding:'16px 20px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16, display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:42, fontWeight:900, color:scoreColor }}>{score}%</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>security score</div>
            </div>
            <div>
              <div style={{ color:'white', fontSize:14, fontWeight:800, marginBottom:4 }}>
                {score>=80?'Well protected':'Needs attention'}
              </div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13 }}>{doneChecks} of {totalChecks} checks done</div>
              <div style={{ width:180, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, marginTop:8 }}>
                <div style={{ width:`${score}%`, height:'100%', background:scoreColor, borderRadius:3, transition:'width 0.4s' }} />
              </div>
            </div>
          </div>
          {audit.map(cat => (
            <div key={cat.cat} style={{ padding:'16px', background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:12 }}>{cat.cat}</div>
              {cat.checks.map((chk, i) => {
                const key = `${cat.cat}-${i}`;
                return (
                  <div key={i} onClick={() => toggle(key)} style={{ display:'flex', gap:12, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', alignItems:'flex-start' }}>
                    <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${checked[key]?accent:'rgba(255,255,255,0.2)'}`, background:checked[key]?accentDim:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                      {checked[key] && <span style={{ color:accent, fontSize:12, fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ color:checked[key]?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6, textDecoration:checked[key]?'line-through':'none' }}>{chk}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Environmental Awareness Module ─────────────────────────────────────────
function EnvironmentModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const [footprint, setFootprint] = useState({ diet:'veg', transport:'public', flights:'0', electricity:'medium', shopping:'medium' });

  const calcFootprint = () => {
    const diet    = { veg:0.5, eggetarian:1.0, nonveg:2.0, vegan:0.3 }[footprint.diet] || 1;
    const travel  = { walk:0, cycle:0.1, public:0.5, twoWheeler:1.2, car:2.5 }[footprint.transport] || 0.5;
    const flights = parseFloat(footprint.flights)||0;
    const elec    = { low:0.3, medium:0.8, high:1.8 }[footprint.electricity] || 0.8;
    const shop    = { low:0.2, medium:0.6, high:1.5 }[footprint.shopping] || 0.6;
    return ((diet + travel + (flights * 0.9) + elec + shop) * 365 / 1000).toFixed(1);
  };

  const actions = [
    { impact:'🔴 High', title:'Reduce meat consumption', detail:'Switching one meat meal per day to plant-based food cuts your food carbon footprint by ~40%. India has the richest vegetarian cuisine in the world — use it.' },
    { impact:'🔴 High', title:'Avoid one flight per year', detail:'A single return flight Mumbai–Delhi emits ~0.15 tonnes CO₂ — equal to 3 months of daily commuting. Take trains instead when possible.' },
    { impact:'🟡 Medium', title:'Switch to LED and unplug', detail:'LED bulbs use 75% less energy. Devices on standby consume 5–10% of household electricity. Unplug chargers and appliances when not in use.' },
    { impact:'🟡 Medium', title:'Carry your own bag and bottle', detail:'India uses 16.5 billion plastic bags per year. A reusable bottle eliminates ~150 plastic bottles annually. Two easy switches, lasting impact.' },
    { impact:'🟡 Medium', title:'Use public transport or cycle', detail:'Cars and two-wheelers account for ~18% of India\'s CO₂ emissions. One car trip replaced with a bus per week saves ~250kg CO₂ per year.' },
    { impact:'🟢 Easy', title:'Eat local and seasonal food', detail:'Food transported thousands of kilometres has a massive carbon cost. Local seasonal produce is cheaper, fresher, and 5x lower in emissions.' },
    { impact:'🟢 Easy', title:'Fix leaking taps', detail:'A dripping tap wastes 15 litres per day — 5,000 litres per year. India faces a severe water crisis. Fix leaks immediately.' },
    { impact:'🟢 Easy', title:'Buy less, buy better', detail:'Fast fashion is the world\'s second most polluting industry. Buy less clothing, choose quality that lasts, and consider second-hand first.' },
  ];

  const indiaFacts = [
    { stat:'7 of 10', context:'Most polluted cities in the world are in India (IQAir 2023)' },
    { stat:'600M', context:'Indians will face acute water stress by 2030 (NITI Aayog)' },
    { stat:'3rd', context:'India is the third largest emitter of greenhouse gases globally' },
    { stat:'40%', context:'Of India\'s land is already degraded or facing desertification' },
    { stat:'12 min', context:'Average life expectancy lost per Indian due to air pollution' },
  ];

  const tonnes = calcFootprint();
  const avgIndian = 1.9;
  const comparison = parseFloat(tonnes) < avgIndian ? 'below' : 'above';
  const fpColor = parseFloat(tonnes) <= 1.5 ? '#52b788' : parseFloat(tonnes) <= 2.5 ? '#ffd166' : '#e74c3c';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['footprint','🌍 Carbon Calculator'],['actions','⚡ Actions'],['facts','📊 India Facts']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="environment" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}

      {tab==='footprint' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            ['diet','🍽️ Diet',{veg:'Vegetarian',eggetarian:'Eggetarian',nonveg:'Non-vegetarian',vegan:'Vegan'}],
            ['transport','🚌 Daily transport',{walk:'Walk/cycle',public:'Public transport',twoWheeler:'Two-wheeler',car:'Car'}],
            ['electricity','💡 Electricity use',{low:'Low (fan, LED)',medium:'Medium (AC sometimes)',high:'High (AC always)'}],
            ['shopping','🛍️ Clothes/shopping',{low:'Minimal (buy rarely)',medium:'Average (monthly)',high:'Frequent (weekly)'}],
          ].map(([key,lbl,opts]) => (
            <div key={key}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>{lbl}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(opts).map(([val,label]) => (
                  <button key={val} onClick={() => setFootprint(f=>({...f,[key]:val}))}
                    style={{ padding:'8px 14px', borderRadius:20, border:`1px solid ${footprint[key]===val?accent:'rgba(255,255,255,0.1)'}`, background:footprint[key]===val?accentDim:'transparent', color:footprint[key]===val?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div key="flights">
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>✈️ Flights per year (return trips)</div>
            <input type="number" min="0" max="20" value={footprint.flights} onChange={e=>setFootprint(f=>({...f,flights:e.target.value}))}
              style={{ width:80, background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:16, fontFamily:'inherit', outline:'none' }} />
          </div>
          <div style={{ padding:'20px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16, textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, fontWeight:700, marginBottom:6 }}>ESTIMATED ANNUAL FOOTPRINT</div>
            <div style={{ fontSize:52, fontWeight:900, color:fpColor }}>{tonnes}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:8 }}>tonnes CO₂ per year</div>
            <div style={{ color:fpColor, fontSize:14, fontWeight:700 }}>
              {parseFloat(tonnes) <= 1.5 ? 'Below average — well done' : parseFloat(tonnes) <= 3 ? `${comparison} average Indian (${avgIndian}t)` : 'High impact — significant room to reduce'}
            </div>
          </div>
        </div>
      )}

      {tab==='actions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {actions.map(a => (
            <div key={a.title} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:14, display:'flex', gap:14 }}>
              <span style={{ fontSize:13, flexShrink:0, marginTop:2 }}>{a.impact}</span>
              <div>
                <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:5 }}>{a.title}</div>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.7 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='facts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {indiaFacts.map(f => (
            <div key={f.stat} style={{ padding:'16px 20px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, display:'flex', gap:20, alignItems:'center' }}>
              <div style={{ color:accent, fontSize:28, fontWeight:900, minWidth:80, textAlign:'center' }}>{f.stat}</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{f.context}</div>
            </div>
          ))}
          <div style={{ padding:'14px 16px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:12, color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.7 }}>
            India is simultaneously one of the most climate-vulnerable countries <em>and</em> one of its biggest contributors. What you do matters — not because one person changes everything, but because culture changes when enough people change together.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mindfulness Module ─────────────────────────────────────────────────────
function MindfulnessModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');
  const [breathPhase, setBreathPhase] = useState(null); // 'inhale'|'hold'|'exhale'|'hold2'|null
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const breathRef = useRef(null);

  const BOX = [
    { phase:'inhale', label:'Inhale', duration:4, color:'#a8dadc' },
    { phase:'hold',   label:'Hold',   duration:4, color:'#7b68ee' },
    { phase:'exhale', label:'Exhale', duration:4, color:'#c8b6ff' },
    { phase:'hold2',  label:'Hold',   duration:4, color:'#48cae4' },
  ];

  const startBreath = () => {
    if (breathRunning) {
      clearInterval(breathRef.current);
      setBreathRunning(false); setBreathPhase(null); setBreathTimer(0);
      return;
    }
    setBreathRunning(true);
    let idx = 0, tick = 0, rounds = 0;
    setBreathPhase(BOX[0].phase); setBreathTimer(BOX[0].duration);
    breathRef.current = setInterval(() => {
      tick++;
      const cur = BOX[idx];
      if (tick >= cur.duration) {
        tick = 0; idx = (idx + 1) % 4;
        if (idx === 0) { rounds++; setBreathCount(rounds); }
        setBreathPhase(BOX[idx].phase); setBreathTimer(BOX[idx].duration);
      } else {
        setBreathTimer(cur.duration - tick);
      }
    }, 1000);
  };

  useEffect(() => () => clearInterval(breathRef.current), []);

  const practices = [
    { name:'Breath Awareness', duration:'5 min', level:'Beginner', desc:'Sit comfortably. Close eyes. Focus only on the sensation of breathing — the air entering the nostrils, the chest rising, the exhale. When the mind wanders (it will), gently return attention to the breath. No force, no judgment.' },
    { name:'Body Scan', duration:'10 min', level:'Beginner', desc:'Lie down or sit. Slowly move attention from the top of your head to the tips of your toes — noticing sensations (warmth, tension, tingling, numbness) without trying to change them. This rewires your ability to be in your body.' },
    { name:'Loving-Kindness (Metta)', duration:'10 min', level:'Intermediate', desc:'Silently repeat: "May I be happy. May I be healthy. May I be safe. May I live with ease." Then extend this to a loved one, a neutral person, a difficult person, and finally all beings. Builds empathy and softens reactivity.' },
    { name:'Noting Practice', duration:'15 min', level:'Intermediate', desc:'While meditating, softly label what arises: "thinking", "hearing", "feeling", "planning". This creates distance between you and mental content — you observe rather than being lost in thoughts.' },
    { name:'Open Awareness', duration:'20 min', level:'Advanced', desc:'Rest in open awareness — not focusing on any single object, but aware of everything that arises and passes in consciousness: sounds, thoughts, sensations, emotions. You are the sky; thoughts are clouds passing through.' },
  ];

  const myths = [
    { myth:'You have to stop thinking to meditate', truth:'The goal is not empty mind — it is noticing when you have wandered and returning. Every return is a rep.' },
    { myth:'You need 30+ minutes a day to benefit', truth:'5 minutes of consistent daily practice beats 30 minutes twice a week. Start with 5.' },
    { myth:'Mindfulness is religious or Hindu/Buddhist', truth:'Clinical mindfulness (MBSR) is completely secular. It is a mental training practice, like going to the gym.' },
    { myth:'If your mind wanders, you are doing it wrong', truth:'Mind wandering is the practice. Noticing you wandered and returning — that is the actual exercise.' },
    { myth:'You need to sit in lotus position on a cushion', truth:'Sit in a chair, lie down, walk — any position where you are alert but not tense.' },
  ];

  const curPhaseData = BOX.find(b => b.phase === breathPhase);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['breathe','🫁 Box Breathing'],['practices','🧘 Practices'],['myths','💡 Myths']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background:tab===id?accentDim:'transparent', color:tab===id?accent:'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height:460, display:'flex', flexDirection:'column' }}><AICoach moduleId="mindfulness" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}

      {tab==='breathe' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, padding:'20px 0' }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.7, textAlign:'center', maxWidth:400 }}>
            Box breathing — used by Navy SEALs, surgeons, and elite athletes. Activates the parasympathetic nervous system. Reduces cortisol in 4 cycles.
          </div>
          {/* Animated box */}
          <div style={{ position:'relative', width:200, height:200 }}>
            <div style={{ position:'absolute', inset:0, border:`3px solid ${accentBorder}`, borderRadius:24 }} />
            {breathPhase && (
              <div style={{ position:'absolute', inset:6, background:accentDim, borderRadius:18, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:`2px solid ${curPhaseData?.color||accent}`, transition:'border-color 1s' }}>
                <div style={{ fontSize:52, fontWeight:900, color:curPhaseData?.color||accent }}>{breathTimer}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'white', marginTop:4 }}>{curPhaseData?.label}</div>
              </div>
            )}
            {!breathPhase && (
              <div style={{ position:'absolute', inset:6, background:'rgba(255,255,255,0.02)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13 }}>Press start</div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <button onClick={startBreath} style={{ padding:'12px 32px', borderRadius:24, border:`2px solid ${accent}`, background:breathRunning?accentDim:'transparent', color:accent, fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:'pointer' }}>
              {breathRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            {breathCount > 0 && <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>{breathCount} round{breathCount!==1?'s':''} complete</div>}
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {BOX.map(b => (
              <div key={b.phase} style={{ textAlign:'center', padding:'8px 14px', background: breathPhase===b.phase?`${b.color}25`:'rgba(255,255,255,0.03)', border:`1px solid ${breathPhase===b.phase?b.color:'rgba(255,255,255,0.07)'}`, borderRadius:10, transition:'all 0.5s' }}>
                <div style={{ color:breathPhase===b.phase?b.color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:800 }}>{b.label}</div>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{b.duration}s</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='practices' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {practices.map(p => (
            <div key={p.name} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ color:accent, fontSize:14, fontWeight:800 }}>{p.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ padding:'2px 9px', background:accentDim, borderRadius:8, color:accent, fontSize:11, fontWeight:700 }}>⏱ {p.duration}</span>
                  <span style={{ padding:'2px 9px', background:'rgba(255,255,255,0.05)', borderRadius:8, color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700 }}>{p.level}</span>
                </div>
              </div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab==='myths' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {myths.map((m,i) => (
            <div key={i} style={{ padding:'16px 18px', background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:14 }}>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <span style={{ color:'#e74c3c', fontSize:12, fontWeight:800, flexShrink:0, marginTop:2 }}>MYTH</span>
                <span style={{ color:'rgba(255,255,255,0.55)', fontSize:13, fontStyle:'italic' }}>{m.myth}</span>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ color:'#52b788', fontSize:12, fontWeight:800, flexShrink:0, marginTop:2 }}>TRUTH</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.7 }}>{m.truth}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Civic Responsibility Module ────────────────────────────────────────────
function CivicModule({ accent, accentDim, accentBorder, sensors }) {
  const [tab, setTab] = useState('coach');

  const govLevels = [
    {
      level: 'Ward / Gram Panchayat', icon: '🏘️', color: '#74c69d',
      who: 'Elected councillor or Panchayat members',
      does: 'Roads, drains, streetlights, local parks, birth/death certificates, property tax',
      contact: 'Visit ward office, BBMP/municipal corporation app, 1533 helpline (most cities)',
    },
    {
      level: 'State Government', icon: '🏢', color: '#f4a261',
      who: 'MLA (Member of Legislative Assembly) — your state representative',
      does: 'Police, public health, education, electricity, water, state highways, land records',
      contact: 'CM helpline varies by state: 1905 (UP), 14545 (Karnataka), 181 (Delhi)',
    },
    {
      level: 'Central Government', icon: '🏛️', color: '#4cc9f0',
      who: 'MP (Member of Parliament) — Lok Sabha and Rajya Sabha',
      does: 'Defence, railways, income tax, national highways, foreign affairs, Aadhaar, passports',
      contact: 'pgportal.gov.in, 1800-11-1800 (PM helpline), MPs accessible via constituency office',
    },
  ];

  const rtiSteps = [
    { step: 'Identify the authority', detail: 'Determine which government office holds the information — central (use CIC) or state (use SIC). Any public authority is covered.' },
    { step: 'Write the application', detail: 'Write in plain language: "I seek information about [specific details]". Be as specific as possible. No need for legal language.' },
    { step: 'Pay ₹10 fee', detail: 'Court fee stamp or demand draft or online payment on the RTI portal. BPL applicants are exempt from fees.' },
    { step: 'Submit', detail: 'Online: rtionline.gov.in (for central ministries). Offline: by hand or speed post to the Public Information Officer (PIO) of that office.' },
    { step: 'Wait 30 days', detail: 'Response must come within 30 days by law. For information that affects life/liberty — 48 hours. Keep your receipt.' },
    { step: 'Appeal if needed', detail: 'No response or unsatisfactory response? File First Appeal to the Appellate Authority within 30 days. Then Second Appeal to CIC/SIC.' },
  ];

  const grievances = [
    { portal: 'pgportal.gov.in', desc: 'Central Government grievances — any ministry or department', icon: '🌐' },
    { portal: 'consumerhelpline.gov.in', desc: 'Consumer complaints against companies, banks, e-commerce', icon: '🛒' },
    { portal: 'cybercrime.gov.in', desc: 'Online fraud, harassment, child abuse, financial crimes', icon: '🔐' },
    { portal: 'Right to Information: rtionline.gov.in', desc: 'File RTI applications to any central government body', icon: '📋' },
    { portal: 'National Human Rights: nhrc.nic.in', desc: 'Human rights violations by state actors', icon: '⚖️' },
    { portal: 'lokpal.gov.in', desc: 'Corruption complaints against central government employees', icon: '🔍' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['coach','🤖 AI Coach'],['govt','🏛️ How Govt Works'],['rti','📋 How to File RTI'],['portals','🌐 Grievance Portals']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background: tab===id?accentDim:'transparent', color: tab===id?accent:'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height: 460, display: 'flex', flexDirection: 'column' }}><AICoach moduleId="civic" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} /></div>}

      {tab==='govt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7 }}>India has a three-tier democracy. Most daily problems are solved at the first tier — not by the Prime Minister.</div>
          {govLevels.map(g => (
            <div key={g.level} style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${g.color}40`, borderRadius: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 26 }}>{g.icon}</span>
                <div style={{ color: g.color, fontSize: 15, fontWeight: 800 }}>{g.level}</div>
              </div>
              {[['Who represents you', g.who],['What they control', g.does],['How to contact/complain', g.contact]].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <span style={{ color: g.color, fontSize: 12, fontWeight: 800, minWidth: 160, flexShrink: 0 }}>{lbl}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ padding: '14px 16px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 12 }}>
            <div style={{ color: accent, fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Your vote matters most locally</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7 }}>Municipal and panchayat elections have the most direct impact on your daily life — roads, water, garbage, local schools. Turnout is often lower than state/national elections. This is where individual participation matters most.</div>
          </div>
        </div>
      )}

      {tab==='rti' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>
            The Right to Information Act 2005 gives every Indian citizen the right to ask any public authority for any information. It is one of the most powerful tools democracy offers. Most people never use it.
          </div>
          {rtiSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: accentDim, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: accent, fontSize: 13, fontWeight: 900 }}>{i+1}</div>
              <div>
                <div style={{ color: accent, fontSize: 13, fontWeight: 800, marginBottom: 5 }}>{s.step}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 16px', background: 'rgba(248,150,30,0.08)', border: '1px solid rgba(248,150,30,0.2)', borderRadius: 12 }}>
            <div style={{ color: '#f8961e', fontSize: 13, fontWeight: 800, marginBottom: 6 }}>💡 What can you ask for?</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7 }}>Road repair status · Police FIR copies · Government school inspection reports · Why your passport was delayed · City budget spending · Land records · Tender details · Any decision made by any public authority.</div>
          </div>
        </div>
      )}

      {tab==='portals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grievances.map(g => (
            <div key={g.portal} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentBorder}`, borderRadius: 14, display: 'flex', gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
              <div>
                <div style={{ color: accent, fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{g.portal}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>{g.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 16px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 12, color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: accent }}>Emergency numbers:</strong> Police 100 · Ambulance 108 · Fire 101 · All emergencies 112 · Women helpline 1091 · Child helpline 1098 · Cybercrime 1930
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home Management Module ─────────────────────────────────────────────────
function HomeManagementModule({ accent, accentDim, accentBorder, sensors, userProfile }) {
  const [tab, setTab] = useState('coach');

  const rentalChecklist = [
    { cat: '📄 Documents to verify', items: ['Owner\'s title deed or property tax receipt', 'Society NOC for renting', 'Owner\'s Aadhaar/PAN match with agreement', 'Previous tenant reference if possible'] },
    { cat: '🔍 Physical inspection', items: ['Water pressure at all taps (morning and evening)', 'Electricity points — working sockets, earthing', 'Seepage marks on walls and ceiling', 'Lock quality on doors and windows', 'Mobile network and internet signal strength', 'Noise levels from neighbours, road, construction'] },
    { cat: '📝 Agreement must include', items: ['Exact rent amount and due date', 'Security deposit amount and return terms', 'Notice period (typically 1–2 months both ways)', 'Who pays maintenance charges', 'Rent escalation clause (cap at 5–10% annually)', 'What is included — furniture, appliances, parking'] },
    { cat: '💰 Costs to budget for', items: ['Security deposit: typically 2–10 months rent', 'Brokerage: 1 month rent (negotiate hard)', 'Society maintenance: ₹1,000–5,000/month', 'Electricity, water, gas separately', 'Shifting/moving costs', 'Minor repairs before moving in'] },
  ];

  const budget = [
    { category: 'Rent', typical: '25–35%', note: 'Keep below 30% of take-home salary' },
    { category: 'Food & groceries', typical: '15–20%', note: 'Cooking saves 40–60% vs eating out daily' },
    { category: 'Transport', typical: '5–10%', note: 'Public transport vs own vehicle significantly different' },
    { category: 'Utilities', typical: '3–5%', note: 'Electricity, internet, gas, water' },
    { category: 'Maintenance', typical: '1–3%', note: 'Society charges, repairs, cleaning supplies' },
    { category: 'Emergency fund', typical: '10–15%', note: 'Build 3 months expenses before other goals' },
    { category: 'Savings/investments', typical: '20%', note: 'Non-negotiable — pay yourself first' },
  ];

  const repairs = [
    { issue: '🚿 Dripping tap', fix: 'Replace the washer inside the tap — costs ₹5–20. Turn off water supply first (under sink valve or main stopcock). YouTube the specific tap model.' },
    { issue: '💡 Tripped circuit breaker', fix: 'Open MCB box (usually near meter). Find the tripped switch (it will be between ON and OFF). Switch fully off, then fully on. If it trips again immediately, there is a fault — call electrician.' },
    { issue: '🪟 Stiff door lock', fix: 'Apply graphite powder or WD-40 to the key and lock mechanism. Do not use oil — it attracts dust and makes it worse long-term.' },
    { issue: '🕷️ Cockroach infestation', fix: 'Boric acid powder along walls, under sink, behind fridge. Gel bait in corners. Block any gaps with steel wool. Address moisture — fix leaks first.' },
    { issue: '💧 Ceiling seepage', fix: 'Map when it appears (rain only, or always). If rain-only: roof waterproofing issue — escalate to building society. If always: pipe leak above — find source floor and escalate.' },
    { issue: '⚡ No power in one room', fix: 'Check if that room\'s MCB has tripped. If not, check if the issue is one socket (test another device) or all sockets (wiring fault — call electrician).' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['coach','🤖 AI Coach'],['rental','🏠 Renting a Home'],['budget','💰 Household Budget'],['repairs','🔧 Basic Repairs']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background: tab===id?accentDim:'transparent', color: tab===id?accent:'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height: 460, display: 'flex', flexDirection: 'column' }}><AICoach moduleId="homemanagement" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} userProfile={userProfile} /></div>}

      {tab==='rental' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rentalChecklist.map(c => (
            <details key={c.cat} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${accentBorder}`, borderRadius: 14, overflow: 'hidden' }}>
              <summary style={{ padding: '14px 16px', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>{c.cat}</span>
                <span style={{ color: accent, fontSize: 11 }}>▼</span>
              </summary>
              <div style={{ padding: '0 16px 14px' }}>
                {c.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: accent, fontSize: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {tab==='budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>Recommended allocation of monthly take-home income for a single person in an Indian metro:</div>
          {budget.map(b => (
            <div key={b.category} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{b.category}</div>
                <div style={{ color: accent, fontSize: 16, fontWeight: 900, marginTop: 2 }}>{b.typical}</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6, paddingTop: 2 }}>{b.note}</div>
            </div>
          ))}
          <div style={{ padding: '14px 16px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 12, color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: accent }}>First-time renter rule:</strong> Never pay more than 30% of your take-home in rent. If the city forces you above 40%, either find flatmates, move further out, or negotiate salary before accepting the job.
          </div>
        </div>
      )}

      {tab==='repairs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {repairs.map(r => (
            <details key={r.issue} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${accentBorder}`, borderRadius: 14, overflow: 'hidden' }}>
              <summary style={{ padding: '13px 16px', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 800, flex: 1 }}>{r.issue}</span>
                <span style={{ color: accent, fontSize: 11 }}>▼ How to fix</span>
              </summary>
              <div style={{ padding: '0 16px 14px', color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.8 }}>{r.fix}</div>
            </details>
          ))}
          <div style={{ padding: '12px 16px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 12, color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: accent }}>Always keep handy:</strong> Plumber number · Electrician number · Building watchman number · Society secretary number · Gas agency number. Save them in your phone the day you move in.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Life Stages Module ─────────────────────────────────────────────────────
function LifeStagesModule({ accent, accentDim, accentBorder, sensors, userProfile }) {
  const [tab, setTab] = useState('coach');

  const stages = [
    {
      range: '13–18 · Adolescence', color: '#a8dadc', icon: '🌱',
      theme: 'Identity formation — who am I, really?',
      focus: ['Separate your identity from your parents\' expectations — this is healthy and necessary', 'Choose friends based on who you want to become, not just who is convenient', 'Exam results are real — but they do not determine your worth or your ceiling', 'Your brain is still developing until age 25 — be patient with yourself and others', 'This is the best time to discover what you love before the world tells you what to do'],
      challenge: 'Peer pressure, exam stress, identity confusion, social media comparison',
      gift: 'Energy, neuroplasticity, time to experiment, no major responsibilities yet',
    },
    {
      range: '18–25 · Early Adulthood', color: '#74c69d', icon: '🚀',
      theme: 'Exploration — try more than you commit',
      focus: ['This decade is for exploring, not optimising — do not lock in too early', 'Build skills, not just credentials — what can you actually do?', 'Your relationships now will shape who you become — choose them consciously', 'Learn to manage money before you earn a lot of it', 'Travel, try new things, fail in low-stakes ways — this is the time'],
      challenge: 'Career confusion, relationship pressure, financial anxiety, comparison with peers',
      gift: 'Flexibility, low obligations, maximum learning curve, time to recover from mistakes',
    },
    {
      range: '25–35 · Building', color: '#f4a261', icon: '🏗️',
      theme: 'Commitment — go deep on what matters',
      focus: ['Choose depth over breadth — in career, relationships, and values', 'The marriage/partner decision is the most consequential of your life — take time', 'Build an emergency fund and start investing before lifestyle creep sets in', 'Your health habits now determine your health at 60 — non-negotiable', 'Mentor someone younger and find mentors older — both are essential'],
      challenge: 'Work-life balance, relationship transitions, financial pressure, comparison anxiety',
      gift: 'Peak cognitive ability, growing income, deepening relationships, clarity of values',
    },
    {
      range: '35–50 · Midlife', color: '#ee9b00', icon: '⚡',
      theme: 'Recalibration — what actually matters?',
      focus: ['The midlife question is not crisis — it is "Is this still aligned with who I am?"', 'Your children are watching everything you do, not what you say', 'Parents are ageing — begin having the hard conversations now, not in a crisis', 'Career pivots are possible and often necessary at 40 — do not wait', 'Invest in friendships — they require deliberate effort at this stage'],
      challenge: 'Aging parents, children\'s needs, career plateau, health changes, identity questions',
      gift: 'Experience, financial stability, deeper self-knowledge, reduced peer pressure',
    },
    {
      range: '50+ · Mastery & Legacy', color: '#c8b6ff', icon: '🌳',
      theme: 'Legacy — what will outlast you?',
      focus: ['Shift from achievement to contribution — what do you want to give back?', 'Your health is now your most important asset — invest in it without compromise', 'Simplify ruthlessly — possessions, obligations, relationships that drain you', 'The most valuable thing you can give the next generation is your time and wisdom', 'Retirement is a financial event, not an identity — know who you are without the title'],
      challenge: 'Health management, purpose after career, generational transitions, loss and grief',
      gift: 'Wisdom, perspective, freedom from approval, time to focus on what truly matters',
    },
  ];

  const transitions = [
    { name: 'Leaving home for college', prep: 'Learn basic cooking, laundry, and budgeting before you leave. Build the skill — not just the attitude.' },
    { name: 'First job', prep: 'Negotiate salary from day one. Build professional relationships. Never stop learning. Understand your PF and tax from month 1.' },
    { name: 'Marriage / partnership', prep: 'Discuss money, family planning, living arrangements, and career goals before committing — not after. These are not taboo topics.' },
    { name: 'Becoming a parent', prep: 'Read about infant development. Build your support network before the baby arrives. Plan finances 6 months ahead. Both partners equally responsible.' },
    { name: 'Losing a job', prep: 'Keep 6 months expenses in a separate account always. Your identity is not your job. Use the transition to course-correct if needed.' },
    { name: 'Caring for ageing parents', prep: 'Have the conversation about health wishes, finances, and living arrangements while everyone is healthy. Avoid making these decisions in a crisis.' },
    { name: 'Loss and grief', prep: 'Grief is not linear and has no timeline. Professional support is not weakness. The goal is not to "get over it" — it is to carry it and continue.' },
  ];

  const ageGroup = userProfile?.age
    ? parseInt(userProfile.age) < 18 ? 0
    : parseInt(userProfile.age) < 25 ? 1
    : parseInt(userProfile.age) < 35 ? 2
    : parseInt(userProfile.age) < 50 ? 3 : 4
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['coach','🤖 AI Coach'],['stages','🗓️ Life Stages'],['transitions','🔀 Major Transitions']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${tab===id?accent:'rgba(255,255,255,0.1)'}`, background: tab===id?accentDim:'transparent', color: tab===id?accent:'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{lbl}</button>
        ))}
      </div>

      {tab==='coach' && <div style={{ height: 460, display: 'flex', flexDirection: 'column' }}><AICoach moduleId="lifestages" accent={accent} accentDim={accentDim} accentBorder={accentBorder} sensors={sensors} userProfile={userProfile} /></div>}

      {tab==='stages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ageGroup !== null && (
            <div style={{ padding: '10px 14px', background: accentDim, border: `1px solid ${accentBorder}`, borderRadius: 10, color: accent, fontSize: 12, fontWeight: 700 }}>
              Based on your profile: your current stage is highlighted below ↓
            </div>
          )}
          {stages.map((s, i) => (
            <details key={s.range} open={ageGroup === i} style={{ background: 'rgba(255,255,255,0.02)', border: `1.5px solid ${ageGroup===i ? s.color : `${s.color}30`}`, borderRadius: 16, overflow: 'hidden' }}>
              <summary style={{ padding: '14px 16px', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.color, fontSize: 14, fontWeight: 800 }}>{s.range}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{s.theme}</div>
                </div>
                {ageGroup === i && <span style={{ padding: '2px 10px', background: `${s.color}25`, borderRadius: 10, color: s.color, fontSize: 11, fontWeight: 800 }}>YOUR STAGE</span>}
              </summary>
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {s.focus.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: s.color, fontSize: 12, flexShrink: 0, marginTop: 3 }}>▸</span>
                      <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 1.7 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['⚡ Challenge', s.challenge, 'rgba(231,76,60,0.15)'],['🎁 Gift', s.gift, 'rgba(82,183,136,0.12)']].map(([lbl, val, bg]) => (
                    <div key={lbl} style={{ padding: '10px 12px', background: bg, borderRadius: 10 }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>{lbl}</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {tab==='transitions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>Major transitions are predictable. Preparing in advance makes them navigable instead of destabilising.</div>
          {transitions.map(t => (
            <div key={t.name} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentBorder}`, borderRadius: 14 }}>
              <div style={{ color: accent, fontSize: 13, fontWeight: 800, marginBottom: 7 }}>🔀 {t.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>{t.prep}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Milestone Toast ────────────────────────────────────────────────────────
function MilestoneToast({ milestones, onDismiss }) {
  if (!milestones?.length) return null;
  return (
    <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', zIndex:1000, display:'flex', flexDirection:'column', gap:8, maxWidth:340, width:'90%' }}>
      {milestones.map(m => (
        <div key={m.id} style={{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', border:'1.5px solid rgba(255,215,0,0.4)', borderRadius:16, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', animation:'slidein 0.4s ease' }}>
          <span style={{ fontSize:28 }}>{m.icon}</span>
          <div>
            <div style={{ color:'#ffd700', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>Achievement Unlocked</div>
            <div style={{ color:'white', fontSize:13, fontWeight:700 }}>{m.label}</div>
          </div>
          <button onClick={onDismiss} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Wellness Score Ring ────────────────────────────────────────────────────
function WellnessRing({ score }) {
  const r = 22, circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const color = score >= 75 ? '#52b788' : score >= 50 ? '#f4a261' : score >= 25 ? '#ffd166' : '#4cc9f0';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width={52} height={52} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${filled} ${circ-filled}`} strokeLinecap="round" style={{ transition:'stroke-dasharray 1s ease' }} />
      </svg>
      <div>
        <div style={{ color:'white', fontSize:20, fontWeight:900, lineHeight:1 }}>{score}</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, fontWeight:700 }}>Wellness Score</div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LifeSkillsPage() {
  const lp      = useLifeProgress();
  const sensors = useSensors();
  const { t, lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const [activeModule, setActive] = useState(() => lp.lastModule || 'finance');
  const [showSensors, setShowSensors] = useState(false);

  // ── Derive age group from grade ──────────────────────────────────────────
  const deriveAgeGroup = (grade) => {
    if (!grade) return '';
    const g = grade.toLowerCase();
    if (['class 1','class 2','class 3','class 4','class 5'].some(c => g.startsWith(c.toLowerCase()))) return 'Under 18';
    if (['class 6','class 7','class 8','class 9','class 10'].some(c => g.startsWith(c.toLowerCase()))) return 'Under 18';
    if (['class 11','class 12'].some(c => g.startsWith(c.toLowerCase()))) return 'Under 18';
    if (g.includes('neet') || g.includes('iit') || g.includes('kcet')) return '18–25';
    if (g.includes('llb year 1') || g.includes('llb year 2') || g.includes('llb year 3')) return '18–25';
    if (g.includes('mbbs') || g.includes('bds') || g.includes('bsc') || g.includes('bpt') || g.includes('bmlt')) return '18–25';
    if (g.includes('llb year 4') || g.includes('llb year 5')) return '18–25';
    if (g.includes('upsc') || g.includes('neet pg')) return '26–35';
    return '18–25';
  };

  // ── Auto-populate Life Skills profile from registered user data ──────────
  useEffect(() => {
    if (!user || !lp.profile || lp.loading) return;
    const p = lp.profile;
    // Only auto-fill fields that are still empty
    const updates = {};
    if (!p.name  && user.name)              updates.name  = user.name;
    if (!p.age   && user.grade)             updates.age   = deriveAgeGroup(user.grade);
    if (!p.grade && user.grade)             updates.grade = user.grade;
    if (!p.lang  && user.preferredLanguage) updates.lang  = user.preferredLanguage;
    if (Object.keys(updates).length > 0) {
      lp.updateProfile({ ...p, ...updates });
    }
  }, [user, lp.loading]); // eslint-disable-line

  useEffect(() => {
    if (!lp.loading && lp.lastModule && lp.lastModule !== activeModule) {
      setActive(lp.lastModule);
    }
  }, [lp.loading]); // eslint-disable-line

  // Auto-complete step-based fitness check-in
  useEffect(() => {
    if (sensors.steps >= 5000) {
      const current = lp.getTodayCheckin('fitness');
      if (!current.includes('fit1')) lp.saveCheckin('fitness', [...current, 'fit1']);
    }
    if (sensors.steps >= 8000) {
      const current = lp.getTodayCheckin('fitness');
      if (!current.includes('fit5')) lp.saveCheckin('fitness', [...current, 'fit5']);
    }
  }, [sensors.steps]); // eslint-disable-line

  const mod = MODULES[activeModule] || MODULES.finance;
  const handleSetModule = (id) => { setActive(id); lp.setLastModule(id); setShowSensors(false); };
  const handleToggleCheckin = (habitId) => {
    const current = lp.getTodayCheckin(activeModule);
    const next = current.includes(habitId) ? current.filter(x => x !== habitId) : [...current, habitId];
    lp.saveCheckin(activeModule, next);
  };
  const moduleProps = { accent: mod.accent, accentDim: mod.accentDim, accentBorder: mod.accentBorder };
  const isReturning = lp.totalDaysActive > 1;
  const topStreak   = Object.values(lp.streaks).reduce((a, v) => Math.max(a, v), 0);

  if (lp.loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40, animation:'spin 1.5s linear infinite', display:'inline-block' }}>🧭</div>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>{t('loading')}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ padding:'16px', maxWidth:900, margin:'0 auto', fontFamily:"'Nunito',sans-serif", minHeight:'100vh' }}>
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes slidein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ls-card{animation:fadein 0.35s ease forwards}
        textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.25)!important}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      <MilestoneToast milestones={lp.newMilestones} onDismiss={lp.dismissMilestones} />
      <SedentaryBanner sensors={sensors} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:28 }}>🧭</span>
          <div>
            <div style={{ color:'white', fontSize:22, fontWeight:900, lineHeight:1.1 }}>{t('ls_title')}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>
              {isReturning ? `${t('ls_day')} ${lp.totalDaysActive} · ${topStreak}${t('ls_streak')}` : t('ls_journey')}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <WellnessRing score={lp.wellnessScore} />
          <button onClick={() => setShowSensors(s => !s)} title="Sensors"
            style={{ background:showSensors ? 'rgba(76,201,240,0.15)' : 'rgba(255,255,255,0.05)', border:`1.5px solid ${showSensors ? 'rgba(76,201,240,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius:12, padding:'8px 12px', color:showSensors ? '#4cc9f0' : 'rgba(255,255,255,0.5)', fontSize:18, cursor:'pointer', lineHeight:1 }}>
            📡
          </button>
        </div>
      </div>

      {/* Welcome back */}
      {isReturning && (
        <div style={{ marginBottom:14, padding:'11px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>
            {t('dash_welcome')}! · <strong style={{color:'white'}}>{MODULES[lp.lastModule || 'finance']?.label}</strong>
          </div>
          <div style={{ display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap' }}>
            {topStreak > 0 && <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,165,0,0.1)', border:'1px solid rgba(255,165,0,0.25)', borderRadius:20, padding:'4px 10px' }}><span>🔥</span><span style={{ color:'#f4a261', fontSize:11, fontWeight:800 }}>{topStreak}d {t('ls_streak')}</span></div>}
            {sensors.steps > 0 && <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(76,201,240,0.1)', border:'1px solid rgba(76,201,240,0.25)', borderRadius:20, padding:'4px 10px' }}><span>🦶</span><span style={{ color:'#4cc9f0', fontSize:11, fontWeight:800 }}>{sensors.steps.toLocaleString()}</span></div>}
            {!lp.serverOnline && <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:20, padding:'4px 10px' }}><span style={{ color:'#e74c3c', fontSize:11, fontWeight:700 }}>📵 {t('ls_offline')}</span></div>}
          </div>
        </div>
      )}

      {/* Sensors panel */}
      {showSensors && (
        <div style={{ marginBottom:16, animation:'fadein 0.3s ease' }}>
          <SensorsPanel sensors={sensors} modules={Object.values(MODULES)} accent="#4cc9f0" accentDim="rgba(76,201,240,0.12)" accentBorder="rgba(76,201,240,0.3)" />
        </div>
      )}

      {/* Module tabs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8, marginBottom:14 }}>
        {Object.values(MODULES).map(m => {
          const mStreak = lp.getStreak(m.id);
          return (
            <button key={m.id} onClick={() => handleSetModule(m.id)}
              style={{ padding:'12px 8px', borderRadius:14, border:`1.5px solid ${activeModule===m.id ? m.accent : 'rgba(255,255,255,0.07)'}`, background:activeModule===m.id ? m.accentDim : 'rgba(255,255,255,0.02)', color:activeModule===m.id ? m.accent : 'rgba(255,255,255,0.45)', fontFamily:'inherit', fontSize:11, fontWeight:800, cursor:'pointer', textAlign:'center', transition:'all 0.2s', lineHeight:1.4, position:'relative' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
              <div>{m.label}</div>
              {mStreak > 0 && <div style={{ position:'absolute', top:-6, right:-6, background:'#f4a261', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#0d0d0d' }}>{mStreak}</div>}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom:14, padding:'11px 16px', background:mod.accentDim, border:`1px solid ${mod.accentBorder}`, borderRadius:12, color:mod.accent, fontSize:13, fontStyle:'italic', fontWeight:700 }}>"{mod.tagline}"</div>

      <div className="ls-card" key={activeModule} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {['fitness','grooming','lifestyle','etiquette','criticalthinking','publicspeaking','legalliteracy','emotionalintelligence','firstaid','sleep','cooking','timemanagement','careerplanning','digitalliteracy','environment','mindfulness','civic','homemanagement','lifestages'].includes(activeModule) && (
          <UserProfileSetup profile={lp.profile} onChange={lp.updateProfile} {...moduleProps} />
        )}
        <QuoteCard moduleId={activeModule} {...moduleProps} />
        {activeModule === 'finance'               && <FinanceModule               {...moduleProps} sensors={sensors} />}
        {activeModule === 'ethics'                && <EthicsModule                {...moduleProps} sensors={sensors} />}
        {activeModule === 'relationships'         && <RelationshipsModule         {...moduleProps} sensors={sensors} />}
        {activeModule === 'fitness'               && <FitnessModule               {...moduleProps} userProfile={lp.profile} sensors={sensors} />}
        {activeModule === 'grooming'              && <GroomingModule              {...moduleProps} userProfile={lp.profile} sensors={sensors} />}
        {activeModule === 'lifestyle'             && <LifestyleModule             {...moduleProps} userProfile={lp.profile} sensors={sensors} />}
        {activeModule === 'etiquette'             && <EtiquetteModule             {...moduleProps} userProfile={lp.profile} sensors={sensors} />}
        {activeModule === 'criticalthinking'      && <CriticalThinkingModule      {...moduleProps} sensors={sensors} />}
        {activeModule === 'publicspeaking'        && <PublicSpeakingModule        {...moduleProps} sensors={sensors} />}
        {activeModule === 'legalliteracy'         && <LegalLiteracyModule         {...moduleProps} sensors={sensors} />}
        {activeModule === 'emotionalintelligence' && <EmotionalIntelligenceModule {...moduleProps} sensors={sensors} />}
        {activeModule === 'firstaid'              && <FirstAidModule              {...moduleProps} sensors={sensors} />}
        {activeModule === 'sleep'                 && <SleepModule                 {...moduleProps} sensors={sensors} />}
        {activeModule === 'cooking'               && <CookingModule               {...moduleProps} sensors={sensors} userProfile={lp.profile} />}
        {activeModule === 'timemanagement'        && <TimeManagementModule        {...moduleProps} sensors={sensors} />}
        {activeModule === 'careerplanning'        && <CareerPlanningModule        {...moduleProps} sensors={sensors} userProfile={lp.profile} />}
        {activeModule === 'digitalliteracy'       && <DigitalLiteracyModule       {...moduleProps} sensors={sensors} />}
        {activeModule === 'environment'           && <EnvironmentModule           {...moduleProps} sensors={sensors} />}
        {activeModule === 'mindfulness'           && <MindfulnessModule           {...moduleProps} sensors={sensors} />}
        {activeModule === 'civic'                 && <CivicModule                 {...moduleProps} sensors={sensors} />}
        {activeModule === 'homemanagement'        && <HomeManagementModule        {...moduleProps} sensors={sensors} userProfile={lp.profile} />}
        {activeModule === 'lifestages'            && <LifeStagesModule            {...moduleProps} sensors={sensors} userProfile={lp.profile} />}
        <DailyCheckin moduleId={activeModule} {...moduleProps} todayChecked={lp.getTodayCheckin(activeModule)} onToggle={handleToggleCheckin} streak={lp.getStreak(activeModule)} />
        <ReflectionJournal moduleId={activeModule} {...moduleProps} getJournal={lp.getJournal} saveJournal={lp.saveJournal} sensors={sensors} />
        <NotificationSettings sensors={sensors} modules={Object.values(MODULES)} {...moduleProps} />
        {lp.milestones?.length > 0 && (
          <div style={{ padding:'16px 18px', background:'rgba(255,215,0,0.04)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:16 }}>
            <div style={{ color:'#ffd700', fontSize:12, fontWeight:800, marginBottom:12 }}>Your Achievements</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {lp.milestones.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:20, padding:'5px 12px' }}>
                  <span style={{ fontSize:16 }}>{m.icon}</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:700 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
