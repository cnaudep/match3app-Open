const COLS = 7, ROWS = 10;
let TILE = 64;
let board = [], selected = null;
let score = 0, moves = 20, goalCount = 0, GOAL = 15;
let leaderboard = [];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const safeHeight = Math.min(window.innerHeight - 120, 640);
const safeWidth = Math.min(window.innerWidth - 20, 448);
canvas.width = safeWidth;
canvas.height = safeHeight;
TILE = Math.floor(canvas.width / COLS);

const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const movesEl = document.getElementById("moves");
const goalCountEl = document.getElementById("goalCount");
const leaderboardEl = document.getElementById("leaderboard");

const tileImages = [], pickImages = [];
for (let i = 0; i < 6; i++) {
  tileImages.push(document.getElementById("tile" + i));
  pickImages.push(document.getElementById("pick" + i));
}
const bgImage = document.getElementById("bg");

function startGame() {
  document.getElementById("menu").remove();
  hud.style.display = "flex";
  leaderboardEl.style.display = "block";
  initBoard();
}

function initBoard() {
  score = 0; moves = 20; goalCount = 0;
  do {
    board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () =>
        Math.floor(Math.random() * tileImages.length)
      )
    );
  } while (findMatches().length);
  updateHUD();
  draw();
}

function updateHUD() {
  scoreEl.textContent = `Счёт: ${score}`;
  movesEl.textContent = `Ходов: ${moves}`;
  goalCountEl.textContent = `${goalCount}/${GOAL}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const idx = board[y][x];
      if (idx == null) continue;
      const img = selected && selected.x === x && selected.y === y
        ? pickImages[idx]
        : tileImages[idx];
      ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function getTileFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = Math.floor((clientX - rect.left) / TILE);
  const y = Math.floor((clientY - rect.top) / TILE);
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return { x: -1, y: -1 };
  return { x, y };
}

function handleInput(e) {
  e.preventDefault();
  if (moves <= 0) return;
  const { x, y } = getTileFromEvent(e);
  if (x === -1 || y === -1) return;

  if (selected) {
    const dx = Math.abs(selected.x - x), dy = Math.abs(selected.y - y);
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

canvas.addEventListener("click", handleInput);
canvas.addEventListener("touchstart", handleInput, { passive: false });

function swap(x1, y1, x2, y2) {
  [board[y1][x1], board[y2][x2]] = [board[y2][x2], board[y1][x1]];
}

function findMatches() {
  const set = new Set();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS - 2; x++) {
      const t = board[y][x];
      if (t != null && t === board[y][x+1] && t === board[y][x+2]) {
        [[x,y],[x+1,y],[x+2,y]].forEach(p => set.add(JSON.stringify(p)));
      }
    }
  }
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS - 2; y++) {
      const t = board[y][x];
      if (t != null && t === board[y+1][x] && t === board[y+2][x]) {
        [[x,y],[x,y+1],[x,y+2]].forEach(p => set.add(JSON.stringify(p)));
      }
    }
  }
  return Array.from(set).map(JSON.parse);
}

function processMatches(matches) {
  matches.forEach(([x, y]) => {
    if (board[y][x] === 3) goalCount++;
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

  const isWin = text === "Победа!";

  overlay.innerHTML = `
    <div style="background:#000a;padding:30px;border-radius:8px;text-align:center;">
      <h2 style="color:#fff;margin-bottom:20px;">${text}</h2>
      ${isWin ? `
        <div style="margin-bottom:20px">
          <label style="color:#fff">Ваш ник: <input id="playerName" style="padding:4px" /></label>
        </div>
      ` : ""}
      <button id="restartBtn" style="font-size:18px;padding:10px 20px;border:none;border-radius:4px;background:#fff;color:#000;cursor:pointer;">Начать заново</button>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("restartBtn").onclick = () => {
    if (isWin) {
      const name = document.getElementById("playerName").value || "Игрок";
      leaderboard.push({ name, moves });
      leaderboard.sort((a, b) => b.moves - a.moves); // Больше ходов — выше
      leaderboard = leaderboard.slice(0, 5);
    }

    renderLeaderboard();
    overlay.remove();
    initBoard();
  };
}

function renderLeaderboard() {
  leaderboardEl.innerHTML = `<strong>Топ 5 (больше ходов):</strong><br>` +
    leaderboard.map((e, i) => `${i+1}. ${e.name} — ${e.moves} ходов`).join("<br>");
}

// Кнопки в меню
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("showLeaderboardBtn").addEventListener("click", () => {
  leaderboardEl.style.display = "block";
  renderLeaderboard();
});
