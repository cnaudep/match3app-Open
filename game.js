// Game logic for Match-3

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const movesEl = document.getElementById("moves");
const goalCountEl = document.getElementById("goalCount");
const leaderboardEl = document.getElementById("leaderboard");

const COLS = 7;
const ROWS = 10;
let TILE = 64;
const GOAL = 15;
const GOAL_TILE = 3;

let board = [];
let selected = null;
let score = 0;
let moves = 20;
let goalCount = 0;
let hintTile = null;
let hintTimer = null;

let leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

const tileImages = [], pickImages = [], hintImages = [];
for (let i = 0; i < 6; i++) {
  tileImages.push(document.getElementById("tile" + i));
  pickImages.push(document.getElementById("pick" + i));
  hintImages.push(document.getElementById("hint" + i));
}
const bgImage = document.getElementById("bg");

startBtn.onclick = () => {
  menu.remove();
  hud.style.display = "flex";
  leaderboardEl.style.display = "block";
  initBoard();
};

function initBoard() {
  score = 0;
  moves = 20;
  goalCount = 0;
  hintTile = null;
  selected = null;

  const safeHeight = Math.min(window.innerHeight - 120, 640);
  const safeWidth = Math.min(window.innerWidth - 20, 448);
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  TILE = Math.floor(canvas.width / COLS);

  do {
    board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => Math.floor(Math.random() * tileImages.length))
    );
  } while (findMatches().length);

  updateHUD();
  updateLeaderboard();
  draw();
  resetHintTimer();
}

function updateHUD() {
  scoreEl.textContent = `Счёт: ${score}`;
  movesEl.textContent = `Ходов: ${moves}`;
  goalCountEl.textContent = `${goalCount}/${GOAL}`;
}

function updateLeaderboard() {
  const top = leaderboard.slice(0, 5).map((e, i) => `${i + 1}. ${e.name} — ${e.moves} ходов`).join("<br>");
  leaderboardEl.innerHTML = `<strong>Топ 5 (меньше ходов):</strong><br>${top}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const idx = board[y][x];
      if (idx == null) continue;
      let img;
      if (hintTile && hintTile.x === x && hintTile.y === y) {
        img = hintImages[idx];
      } else if (selected && selected.x === x && selected.y === y) {
        img = pickImages[idx];
      } else {
        img = tileImages[idx];
      }
      ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
    }
  }
}

canvas.addEventListener("click", handleInput);

function getTileFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / (rect.width / COLS));
  const y = Math.floor((e.clientY - rect.top) / (rect.height / ROWS));
  return { x, y };
}

function handleInput(e) {
  e.preventDefault();
  const { x, y } = getTileFromEvent(e);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS || moves <= 0) return;

  if (hintTile && (x !== hintTile.x || y !== hintTile.y)) {
    clearHint();
    draw();
  }

  clearHint();
  resetHintTimer();

  if (selected) {
    const dx = Math.abs(selected.x - x);
    const dy = Math.abs(selected.y - y);
    if (dx + dy === 1) {
      swap(selected.x, selected.y, x, y);
      const m = findMatches();
      if (m.length) {
        moves--;
        processMatches(m);
      } else {
        swap(selected.x, selected.y, x, y);
      }
      selected = null;
    } else {
      selected = { x, y };
    }
  } else {
    selected = { x, y };
  }

  updateHUD();
  draw();
  checkEnd();
}

function swap(x1, y1, x2, y2) {
  [board[y1][x1], board[y2][x2]] = [board[y2][x2], board[y1][x1]];
}

function findMatches() {
  const set = new Set();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS - 2; x++) {
      const t = board[y][x];
      if (t != null && t === board[y][x + 1] && t === board[y][x + 2]) {
        [[x, y], [x + 1, y], [x + 2, y]].forEach(p => set.add(JSON.stringify(p)));
      }
    }
  }
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS - 2; y++) {
      const t = board[y][x];
      if (t != null && t === board[y + 1][x] && t === board[y + 2][x]) {
        [[x, y], [x, y + 1], [x, y + 2]].forEach(p => set.add(JSON.stringify(p)));
      }
    }
  }
  return Array.from(set).map(JSON.parse);
}

function processMatches(matches) {
  matches.forEach(([x, y]) => {
    if (board[y][x] === GOAL_TILE) goalCount++;
    board[y][x] = null;
    score += 10;
  });
  collapse();
  refill();
  updateHUD();
  draw();
  setTimeout(() => {
    const nxt = findMatches();
    if (nxt.length) processMatches(nxt);
  }, 200);
}

function collapse() {
  for (let x = 0; x < COLS; x++) {
    const col = board.map(r => r[x]).filter(v => v != null);
    while (col.length < ROWS) {
      col.unshift(Math.floor(Math.random() * tileImages.length));
    }
    for (let y = 0; y < ROWS; y++) {
      board[y][x] = col[y];
    }
  }
}

function refill() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] == null) {
        board[y][x] = Math.floor(Math.random() * tileImages.length);
      }
    }
  }
}

function checkEnd() {
  if (goalCount >= GOAL) showEnd("Победа!");
  else if (moves <= 0) showEnd("Игра окончена");
}

function showEnd(text) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0",
    display: "flex", justifyContent: "center",
    alignItems: "center",
    background: "rgba(0,0,0,0.8)", zIndex: 200
  });
  overlay.innerHTML = `
    <div style="background:#000a;padding:30px;border-radius:8px;text-align:center;">
      <h2 style="color:#fff;margin-bottom:20px;">${text}</h2>
      <button id="restartBtn" style="font-size:18px;padding:10px 20px;border:none;border-radius:4px;background:#fff;color:#000;cursor:pointer;">Начать заново</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("restartBtn").onclick = () => {
    overlay.remove();
    checkLeaderboard();
    initBoard();
  };
}

function resetHintTimer() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    const hint = findHint();
    if (hint) {
      hintTile = hint;
      draw();
      resetHintTimer();
    }
  }, 3000);
}

function clearHint() {
  hintTile = null;
  clearTimeout(hintTimer);
}

function findHint() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const dirs = [[1, 0], [0, 1]];
      for (let [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= COLS || ny >= ROWS) continue;
        swap(x, y, nx, ny);
        if (findMatches().length) {
          swap(x, y, nx, ny);
          return { x, y };
        }
        swap(x, y, nx, ny);
      }
    }
  }
  return null;
}

function checkLeaderboard() {
  if (goalCount >= GOAL) {
    const top5 = leaderboard.slice(0, 5);
    const worstTop = top5.length === 5 ? top5[top5.length - 1].moves : Infinity;
    if (moves < worstTop) {
      const name = prompt("Новый рекорд! Введите свой ник:") || "Игрок";
      leaderboard.push({ name, moves });
      leaderboard.sort((a, b) => a.moves - b.moves);
      leaderboard = leaderboard.slice(0, 5);
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
      updateLeaderboard();
    }
  }
}
