'use strict';
/* own journal — маленькі послання. Додати нові можна прямо в Налаштуваннях або дописати сюди. */

const MESSAGE_KINDS = { q: 'Thought', m: 'Support', w: 'Wish', r: 'Question for you', c: 'Self-care', k: 'Just because' };

const MESSAGES = [
  // Thoughts
  ['q', 'Small steps can take you far.'],
  ['q', 'Silence is an answer too. Sometimes the best one.'],
  ['q', 'You don’t have to bloom all year. Even trees rest in winter.'],
  ['q', 'Everything you feel has a right to exist.'],
  ['q', 'Slow is a speed too.'],
  ['q', 'The best stories are written in pencil: you can always fix them.'],
  ['q', 'The forest never hurries, yet everything gets done.'],
  ['q', 'The days that feel ordinary often become the dearest memories.'],
  ['q', 'Light always finds a crack.'],
  ['q', 'You are not just your mistakes. You are also your attempts.'],
  ['q', 'Even the moon has phases, and no one says it’s worse for it.'],
  ['q', 'Not everything needs to make sense right away. Some things bloom later.'],
  ['q', 'Coziness is when you can simply be.'],
  ['q', 'Your “enough” is already a lot.'],
  ['q', 'What you write down stops spinning in your head.'],
  ['q', 'Every page is a little room where you can hide.'],
  ['q', 'The storm passes. The moss stays.'],
  ['q', 'Good things happen without warning too.'],
  ['q', 'The heart knows the way, even when the head gets lost.'],
  ['q', 'Dreams grow like mushrooms after rain — quietly and unexpectedly.'],
  // Support
  ['m', 'You’re doing more than you think.'],
  ['m', 'You don’t have to be perfect today. Being yourself is enough.'],
  ['m', 'You’ve made it through so many hard days — this one will pass too.'],
  ['m', 'Your drawings, words and thoughts deserve to exist.'],
  ['m', 'Remember when you dreamed of what you have now?'],
  ['m', 'Progress isn’t always visible, but it’s there.'],
  ['m', 'You’re allowed to start over as many times as you need.'],
  ['m', 'A mistake is just a rough draft of a future skill.'],
  ['m', 'You’re braver than you think.'],
  ['m', 'Don’t compare your chapter one to someone else’s chapter twenty.'],
  ['m', 'The fact that you keep trying is already a win.'],
  ['m', 'Your sensitivity isn’t a weakness — it’s a superpower.'],
  ['m', 'You’re not behind. You’re walking your own path.'],
  ['m', 'Even if today is hard, you’re not alone.'],
  ['m', 'Every line you draw brings you closer to your dream.'],
  ['m', 'You know how to create beauty. That’s a lot.'],
  ['m', 'Your steps may be small, but they’re yours.'],
  ['m', 'You deserve the same kindness you give to others.'],
  ['m', 'Let yourself be proud of something small today.'],
  ['m', 'You don’t have to carry everything alone. It’s okay to ask for help.'],
  // Wishes
  ['w', 'May something small and lovely happen to you today.'],
  ['w', 'Wishing you warm tea, a soft blanket and a calm evening.'],
  ['w', 'May the day be gentle with you.'],
  ['w', 'May someone smile at you sincerely today.'],
  ['w', 'May inspiration find you exactly when you need it.'],
  ['w', 'May there always be a lamp glowing in your window.'],
  ['w', 'May your way home be beautiful today.'],
  ['w', 'Wishing you a day without rushing.'],
  ['w', 'May your dreams be soft as moss.'],
  ['w', 'May everything sprouting now bloom for sure.'],
  ['w', 'Wishing you at least one moment when everything feels right.'],
  ['w', 'May today have a little bit of fairy tale.'],
  ['w', 'May fireflies light your way.'],
  ['w', 'Wishing you people you can be quiet with.'],
  ['w', 'May this week bring a lovely surprise.'],
  // Questions to yourself
  ['r', 'What made you smile today?'],
  ['r', 'What can you thank yourself for this week?'],
  ['r', 'What little thing would make this evening cozier?'],
  ['r', 'What would you tell your five-year-old self?'],
  ['r', 'What do you really want right now?'],
  ['r', 'Which song describes your mood today?'],
  ['r', 'What would you draw if no one was watching?'],
  ['r', 'Who made your day better today?'],
  ['r', 'What can you do now that you couldn’t a year ago?'],
  ['r', 'Which place makes you feel at home?'],
  ['r', 'What surprised you today?'],
  ['r', 'What could you let go of to feel lighter?'],
  ['r', 'Which smell reminds you of childhood?'],
  ['r', 'Which dream have you been putting off for too long?'],
  ['r', 'What would you do with a whole free day?'],
  ['r', 'What would your perfect morning look like?'],
  ['r', 'What do the people who love you like about you?'],
  ['r', 'Which emotion did you carry the longest today?'],
  ['r', 'What are you proud of but rarely talk about?'],
  ['r', 'Which fairy-tale creature would you be friends with?'],
  ['r', 'If today were a color, which one would it be?'],
  ['r', 'What do you want to remember about this month?'],
  // Self-care
  ['c', 'Drink a glass of water. Your body will thank you.'],
  ['c', 'Have you eaten properly today?'],
  ['c', 'Roll your shoulders back and take three deep breaths.'],
  ['c', 'You can put your phone down and just look out the window.'],
  ['c', 'Rest is a task too. An important one.'],
  ['c', 'Go to bed a little earlier tonight. You deserve sleep.'],
  ['c', 'Step outside for a few minutes of fresh air.'],
  ['c', 'Saying “no” is self-care too.'],
  ['c', 'Hug yourself. Seriously, right now.'],
  ['c', 'Make yourself something tasty for no reason at all.'],
  ['c', 'Stretch like a cat after a nap.'],
  ['c', 'If you’re tired, it’s not laziness — it’s a signal.'],
  ['c', 'Put on your favorite music for five minutes.'],
  ['c', 'Take care of your hands: they do so much for you.'],
  ['c', 'Start the day with something nice, not the news.'],
  ['c', 'Today you can be softer with yourself.'],
  // Just because
  ['k', 'Hi! So glad to see you here 🌿'],
  ['k', 'Somewhere in the forest a tiny mushroom is glowing right now. Just so you know.'],
  ['k', 'Your journal missed you.'],
  ['k', 'Today is a great day to write down something lovely.'],
  ['k', 'You’re the main character of this story.'],
  ['k', 'The cats of the world say hi.'],
  ['k', 'It’s always warm in this journal. Come by more often.'],
  ['k', 'You smell like tea and adventures. Probably.'],
  ['k', 'The fireflies gathered to hear your story.'],
  ['k', 'It’s safe here. You can write anything.'],
  ['k', 'This day is already a little better because you’re here.'],
  ['k', 'Little reminder: you’re awesome.'],
  ['k', 'Someone in the world is thinking of you warmly right now.'],
  ['k', 'Your journal is waiting for new stories.'],
].map(([kind, text], i) => ({ id: 'b' + i, kind, text }));

const MSG_FREQ = [
  ['off', 'Never'], ['rare', 'Rarely (as a surprise)'], ['sometimes', 'Sometimes'], ['daily', 'Once a day'], ['always', 'Every time'],
];

let sessionMessage;   // одне послання на одне відкриття застосунку
let messageClosed = false;

function allMessages() {
  return MESSAGES.concat((S.settings.customMessages || []).map((m, i) => ({ id: 'c' + i, kind: m.kind || 'k', text: m.text })));
}

function decideMessage() {
  const st = S.settings;
  const freq = st.msgFreq || 'sometimes';
  if (freq === 'off') return null;
  const today = D.key(new Date());
  if (freq === 'daily' && st.msgDay === today) return allMessages().find((m) => m.id === st.msgLastId) || null;
  const chance = { rare: 0.25, sometimes: 0.5, daily: 1, always: 1 }[freq] ?? 0.5;
  if (Math.random() > chance) return null;
  const seen = new Set(st.msgSeen || []);
  let pool = allMessages().filter((m) => !seen.has(m.id));
  if (!pool.length) { st.msgSeen = []; pool = allMessages(); }
  const msg = pool[Math.floor(Math.random() * pool.length)];
  st.msgSeen = [...(st.msgSeen || []), msg.id].slice(-Math.max(20, Math.floor(allMessages().length * 0.8)));
  st.msgDay = today;
  st.msgLastId = msg.id;
  saveSettings();
  return msg;
}

function pickMessageHTML() {
  if (sessionMessage === undefined) sessionMessage = decideMessage();
  if (!sessionMessage || messageClosed) return '';
  const m = sessionMessage;
  return `<div class="card message-card" id="msg-card"><span style="font-size:24px;line-height:1">✉︎</span>
    <div class="grow"><div class="m-kind">${MESSAGE_KINDS[m.kind] || ''}</div><div class="m-text">${esc(m.text)}</div></div>
    <button class="text-btn" data-act="closeMsg" aria-label="Close" style="padding:0 4px">${icon('x', 18)}</button></div>`;
}
