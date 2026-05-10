const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");
const homeBtn = document.getElementById("homeBtn");

const cardArea = document.getElementById("cardArea");

const comboText = document.getElementById("comboText");
const callText = document.getElementById("callText");
const messageText = document.getElementById("messageText");

const timeGauge = document.getElementById("timeGauge");

const scoreText = document.getElementById("scoreText");
const maxComboText = document.getElementById("maxComboText");
const clearText = document.getElementById("clearText");

const resultTitle = document.getElementById("resultTitle");
const resultCharacter = document.getElementById("resultCharacter");
const resultComment = document.getElementById("resultComment");

const GAME_URL = "https://afoolhippo.github.io/game9/";
const HOME_URL = "https://afoolhippo.github.io/home/?skipTitle=1";

const bgm = new Audio("bgm.mp3");
const startSe = new Audio("start.mp3");
const hitSe = new Audio("hit.mp3");
const missSe = new Audio("miss.mp3");
const resultSe = new Audio("result.mp3");

bgm.volume = 0.8;
startSe.volume = 0.9;
hitSe.volume = 0.85;
missSe.volume = 0.7;
resultSe.volume = 0.9;

const sequence = [
  { name: "佐藤", time: 5.9 },
  { name: "鈴木", time: 7.6 },
  { name: "高橋", time: 9.4 },
  { name: "田中", time: 11.7 },

  { name: "伊藤", time: 14.2 },
  { name: "渡辺", time: 15.6 },
  { name: "山本", time: 17.8 },
  { name: "中村", time: 19.9 },

  { name: "小林", time: 21.9 },
  { name: "加藤", time: 24.4 },
  { name: "吉田", time: 26.2 },
  { name: "山田", time: 28.4 },

  { name: "佐々木", time: 30.5 },
  { name: "山口", time: 32.3 },
  { name: "松本", time: 34.4 },
  { name: "井上", time: 36.4 }
];

const fakeNames = [
  "森",
  "清水",
  "橋本",
  "阿部"
];

const LAST_LIMIT_MS = 3000;
const BEFORE_NEXT_MARGIN_MS = 120;
const GAME_END_TIME = 39.5;

let currentIndex = 0;
let currentTarget = "";

let score = 0;
let combo = 0;
let maxCombo = 0;
let clearCount = 0;

let accepting = false;
let gameRunning = false;

let timerId = null;
let syncId = null;
let gaugeId = null;

let roundStartTime = 0;
let roundLimitMs = 3000;

function showScreen(screen) {
  [titleScreen, gameScreen, resultScreen].forEach((s) => {
    s.classList.remove("active");
  });

  screen.classList.add("active");
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function playSe(audio) {
  const se = audio.cloneNode();

  se.volume = audio.volume;
  se.currentTime = 0;

  se.play().catch(() => {});
}

function stopGameAudioAndTimers() {
  accepting = false;
  gameRunning = false;

  clearTimeout(timerId);
  cancelAnimationFrame(syncId);
  cancelAnimationFrame(gaugeId);

  bgm.pause();
  bgm.currentTime = 0;
}

function startGame() {
  currentIndex = 0;
  currentTarget = "";

  score = 0;
  combo = 0;
  maxCombo = 0;
  clearCount = 0;

  accepting = false;
  gameRunning = true;

  clearTimeout(timerId);
  cancelAnimationFrame(syncId);
  cancelAnimationFrame(gaugeId);

  comboText.textContent = "0";
  messageText.textContent = "";
  callText.textContent = "待機中…";
  timeGauge.style.width = "100%";

  bgm.pause();
  bgm.currentTime = 0;

  showScreen(gameScreen);

  requestAnimationFrame(() => {
    createCards();

    playSe(startSe);

    bgm.currentTime = 0;
    bgm.play().catch(() => {});

    syncLoop();
  });
}

function createCards() {
  cardArea.innerHTML = "";

  const names = shuffle([
    ...sequence.map((item) => item.name),
    ...fakeNames
  ]);

  const cols = 4;
  const rows = 5;

  const areaWidth = cardArea.clientWidth;
  const areaHeight = cardArea.clientHeight;

  const isSmallHeight = window.innerHeight <= 720;

  const cardW = isSmallHeight ? 68 : 72;
  const cardH = isSmallHeight ? 46 : 50;

  const cellW = areaWidth / cols;
  const cellH = areaHeight / rows;

  names.forEach((name, index) => {
    const card = document.createElement("div");

    card.className = "card";
    card.textContent = name;
    card.dataset.name = name;

    const col = index % cols;
    const row = Math.floor(index / cols);

    const offsetX = Math.random() * 18 - 9;
    const offsetY = Math.random() * 16 - 8;

    const x =
      col * cellW +
      cellW / 2 -
      cardW / 2 +
      offsetX;

    const y =
      row * cellH +
      cellH / 2 -
      cardH / 2 +
      offsetY;

    const rot = Math.random() * 16 - 8;

    card.style.left = `${Math.max(0, Math.min(x, areaWidth - cardW))}px`;
    card.style.top = `${Math.max(0, Math.min(y, areaHeight - cardH))}px`;

    card.style.setProperty("--rot", `${rot}deg`);
    card.style.transform = `rotate(${rot}deg)`;

    card.addEventListener("click", () => {
      tapCard(card);
    });

    cardArea.appendChild(card);
  });
}

function syncLoop() {
  if (!gameRunning) return;

  if (currentIndex >= sequence.length) {
    if (bgm.currentTime >= GAME_END_TIME || bgm.ended) {
      finishGame();
      return;
    }

    syncId = requestAnimationFrame(syncLoop);
    return;
  }

  const current = sequence[currentIndex];

  if (!accepting && bgm.currentTime >= current.time) {
    startRound();
  }

  syncId = requestAnimationFrame(syncLoop);
}

function getRoundLimitMs() {
  const current = sequence[currentIndex];
  const next = sequence[currentIndex + 1];

  if (!next) {
    return LAST_LIMIT_MS;
  }

  return Math.max(
    900,
    (next.time - current.time) * 1000 - BEFORE_NEXT_MARGIN_MS
  );
}

function startRound() {
  if (currentIndex >= sequence.length) {
    finishGame();
    return;
  }

  currentTarget = sequence[currentIndex].name;

  callText.textContent = `${currentTarget}！`;
  messageText.textContent = "";

  accepting = true;
  roundStartTime = performance.now();
  roundLimitMs = getRoundLimitMs();

  clearTimeout(timerId);
  cancelAnimationFrame(gaugeId);

  updateGauge();

  timerId = setTimeout(() => {
    if (!accepting) return;

    miss("お手つき！");
    nextRound();
  }, roundLimitMs);
}

function updateGauge() {
  const elapsed = performance.now() - roundStartTime;

  const remain = Math.max(
    0,
    1 - elapsed / roundLimitMs
  );

  timeGauge.style.width = `${remain * 100}%`;

  if (remain > 0 && accepting) {
    gaugeId = requestAnimationFrame(updateGauge);
  }
}

function tapCard(card) {
  if (!accepting) return;

  const selected = card.dataset.name;

  if (selected === currentTarget) {
    accepting = false;

    clearTimeout(timerId);
    cancelAnimationFrame(gaugeId);

    combo++;
    maxCombo = Math.max(maxCombo, combo);
    clearCount++;

    score += 100 + combo * 10;

    comboText.textContent = combo;
    messageText.textContent = "正解！";

    playSe(hitSe);

    card.classList.add("hit");

    setTimeout(() => {
      card.remove();
      nextRound();
    }, 180);

    return;
  }

  combo = 0;
  comboText.textContent = combo;
  messageText.textContent = "お手つき！";

  playSe(missSe);

  card.classList.add("miss");

  setTimeout(() => {
    card.classList.remove("miss");
  }, 180);
}

function miss(text) {
  combo = 0;
  comboText.textContent = combo;
  messageText.textContent = text;

  playSe(missSe);
}

function nextRound() {
  accepting = false;

  currentIndex++;

  clearTimeout(timerId);
  cancelAnimationFrame(gaugeId);

  timeGauge.style.width = "0%";
}

function finishGame() {
  if (!gameRunning) return;

  accepting = false;
  gameRunning = false;

  clearTimeout(timerId);
  cancelAnimationFrame(syncId);
  cancelAnimationFrame(gaugeId);

  bgm.pause();

  playSe(resultSe);

  clearText.textContent = `${clearCount}枚獲得！`;
  maxComboText.textContent = `${maxCombo}コンボ`;
  scoreText.textContent = score;

  if (clearCount === 16) {
    resultTitle.textContent = "苗字マスター！";
    resultComment.textContent = "すべての苗字を取りきった！";
    resultCharacter.src = "man_happy.png";
  } else if (clearCount >= 10) {
    resultTitle.textContent = "苗字名人！";
    resultComment.textContent = "なかなかの苗字さばき！";
    resultCharacter.src = "man_good.png";
  } else {
    resultTitle.textContent = "お手つき修行中";
    resultComment.textContent = "次はもっと取れるはず！";
    resultCharacter.src = "man_bad.png";
  }

  showScreen(resultScreen);
}

function shareResult() {
  const text =
`苗字カルタ、何枚取れる？🖌️

目指せコンプリート！
16枚中${clearCount}枚正解！

無料ブラウザゲーム
「苗字苗字yeah」
${GAME_URL}

#苗字苗字yeah #カバゲーセン`;

  const shareUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  window.open(shareUrl, "_blank");
}

startBtn.addEventListener("click", startGame);

backBtn.addEventListener("click", () => {
  stopGameAudioAndTimers();
  showScreen(titleScreen);
});

retryBtn.addEventListener("click", () => {
  stopGameAudioAndTimers();
  showScreen(titleScreen);
});

shareBtn.addEventListener("click", shareResult);

homeBtn.addEventListener("click", () => {
  window.location.href = HOME_URL;
});