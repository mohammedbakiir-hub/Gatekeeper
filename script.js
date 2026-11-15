
const SIZE = 9;

const GOAL = { r: 0, c: 4 };

const STARTS = {
  1: { r: 8, c: 0 },
  2: { r: 8, c: 8 }
};

const WALLS = new Set([
  "1,2", "1,6",
  "2,2", "2,6",
  "3,4",
  "4,1", "4,7",
  "5,1", "5,7",
  "6,3", "6,5",
  "7,3", "7,5"
]);

// 0 = atas, 1 = kanan, 2 = bawah, 3 = kiri
const INITIAL_GATES = {
  "1,1": 1,
  "1,4": 2,
  "1,7": 3,
  "3,2": 0,
  "3,6": 2,
  "5,2": 1,
  "5,6": 3,
  "7,4": 0
};

const DIRS = [
  { r: -1, c: 0, label: "atas", arrow: "↑" },
  { r: 0, c: 1, label: "kanan", arrow: "→" },
  { r: 1, c: 0, label: "bawah", arrow: "↓" },
  { r: 0, c: -1, label: "kiri", arrow: "←" }
];

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");

const turnNameEl = document.getElementById("turnName");
const turnCountEl = document.getElementById("turnCount");

const selectGateBtn = document.getElementById("selectGateBtn");
const rotateBtn = document.getElementById("rotateBtn");
const passBtn = document.getElementById("passBtn");

const winOverlay = document.getElementById("winOverlay");

let players;
let gates;
let currentPlayer;
let turnNumber;
let rotatedThisTurn;
let selectedGate;
let selectingGate;
let gameOver;


// ================================
// RESET GAME
// ================================

function resetGame() {
  players = {
    1: { ...STARTS[1] },
    2: { ...STARTS[2] }
  };

  gates = { ...INITIAL_GATES };

  currentPlayer = 1;
  turnNumber = 1;

  rotatedThisTurn = false;
  selectedGate = null;
  selectingGate = false;
  gameOver = false;

  winOverlay.classList.remove("show");

  historyEl.innerHTML =
    "<li>Permainan dimulai. Pemain 1 mendapat giliran pertama.</li>";

  setStatus(
    "<strong>Pemain 1, mulai!</strong> Klik petak hijau untuk bergerak."
  );

  render();
}


// ================================
// HELPER FUNCTIONS
// ================================

function keyOf(r, c) {
  return `${r},${c}`;
}

function playerAt(r, c) {
  if (players[1].r === r && players[1].c === c) return 1;

  if (players[2].r === r && players[2].c === c) return 2;

  return null;
}

function inside(r, c) {
  return (
    r >= 0 &&
    r < SIZE &&
    c >= 0 &&
    c < SIZE
  );
}

function isBlocked(r, c) {
  return !inside(r, c) || WALLS.has(keyOf(r, c));
}


// ================================
// VALID MOVEMENT
// ================================

function legalMoves(playerId = currentPlayer) {
  const p = players[playerId];

  const gateDirection = gates[keyOf(p.r, p.c)];

  const directions =
    gateDirection === undefined
      ? DIRS
      : [DIRS[gateDirection]];

  return directions
    .map(d => ({
      r: p.r + d.r,
      c: p.c + d.c
    }))
    .filter(pos => inside(pos.r, pos.c))
    .filter(pos => !isBlocked(pos.r, pos.c))
    .filter(pos => !playerAt(pos.r, pos.c));
}


// ================================
// RENDER BOARD
// ================================

function render() {
  boardEl.innerHTML = "";

  const moves = legalMoves();

  for (let r = 0; r < SIZE; r++) {

    for (let c = 0; c < SIZE; c++) {

      const key = keyOf(r, c);

      const isWall = WALLS.has(key);

      const isGate =
        Object.prototype.hasOwnProperty.call(gates, key);

      const isGoal =
        r === GOAL.r && c === GOAL.c;

      const isLegal = moves.some(
        m => m.r === r && m.c === c
      );

      const occupant = playerAt(r, c);

      const cell = document.createElement("button");

      cell.type = "button";
      cell.className = "cell";

      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.setAttribute("role", "gridcell");

      // WALL
      if (isWall) {

        cell.classList.add("wall");
        cell.disabled = true;

        cell.innerHTML =
          '<span class="wall-mark">✕</span>';

        cell.setAttribute(
          "aria-label",
          `Rintangan baris ${r + 1}, kolom ${c + 1}`
        );

      } else {

        // GATE
        if (isGate) {

          cell.classList.add("gate");

          cell.innerHTML = `
            <span class="gate-arrow">
              ${DIRS[gates[key]].arrow}
            </span>
            <span class="gate-tag">GATE</span>
          `;

          cell.setAttribute(
            "aria-label",
            `Gerbang arah ${DIRS[gates[key]].label}`
          );
        }

        // FINISH
        if (isGoal) {

          cell.classList.add("goal");

          cell.innerHTML =
            '<span class="goal-mark">★</span>';

          cell.setAttribute("aria-label", "Garis finis");
        }

        // START POSITION
        if (
          (r === STARTS[1].r && c === STARTS[1].c) ||
          (r === STARTS[2].r && c === STARTS[2].c)
        ) {

          const startPlayer =
            r === STARTS[1].r &&
            c === STARTS[1].c
              ? 1
              : 2;

          const marker = document.createElement("span");

          marker.className = "start-mark";

          marker.textContent =
            startPlayer === 1 ? "P1" : "P2";

          cell.appendChild(marker);
        }

        // LEGAL MOVES
        if (isLegal) {
          cell.classList.add("legal");
        }

        // SELECTED GATE
        if (selectedGate === key) {
          cell.classList.add("selected");
        }

        // PLAYER PAWN
        if (occupant) {

          const pawn = document.createElement("span");

          pawn.className =
            `pawn ${occupant === 1 ? "red" : "blue"}`;

          pawn.textContent =
            occupant === 1 ? "1" : "2";

          cell.appendChild(pawn);
        }

        if (!cell.getAttribute("aria-label")) {
          cell.setAttribute(
            "aria-label",
            `Petak baris ${r + 1}, kolom ${c + 1}`
          );
        }
      }

      boardEl.appendChild(cell);
    }
  }

  updateHud();
}


// ================================
// UPDATE INTERFACE
// ================================

function updateHud() {

  document.getElementById("card1")
    .classList.toggle(
      "active",
      currentPlayer === 1 && !gameOver
    );

  document.getElementById("card2")
    .classList.toggle(
      "active",
      currentPlayer === 2 && !gameOver
    );

  turnNameEl.textContent =
    currentPlayer === 1
      ? "Pemain 1 · Merah"
      : "Pemain 2 · Biru";

  turnCountEl.textContent =
    `Giliran ${turnNumber}`;

  selectGateBtn.classList.toggle(
    "mode-on",
    selectingGate
  );

  selectGateBtn.textContent =
    selectingGate
      ? "Mode Pilih Gerbang: ON"
      : "Pilih Gerbang";

  rotateBtn.disabled =
    !selectedGate ||
    rotatedThisTurn ||
    gameOver;

  selectGateBtn.disabled =
    rotatedThisTurn ||
    gameOver;

  passBtn.disabled = gameOver;
}


// ================================
// STATUS MESSAGE
// ================================

function setStatus(message, warning = false) {

  statusEl.innerHTML = message;

  statusEl.classList.toggle(
    "warning",
    warning
  );
}


// ================================
// GAME HISTORY
// ================================

function addHistory(message) {

  const item = document.createElement("li");

  item.innerHTML = message;

  historyEl.prepend(item);

  while (historyEl.children.length > 8) {

    historyEl.removeChild(
      historyEl.lastChild
    );
  }
}


// ================================
// SELECT GATE
// ================================

function chooseGateMode() {

  if (gameOver || rotatedThisTurn) return;

  selectingGate = !selectingGate;

  selectedGate = null;

  if (selectingGate) {

    setStatus(
      "Mode pilih gerbang aktif. Klik salah satu petak <strong>kuning</strong>."
    );

  } else {

    setStatus(
      "Mode pilih gerbang dimatikan. Klik petak hijau untuk bergerak."
    );
  }

  render();
}


function selectGate(r, c) {

  const key = keyOf(r, c);

  if (!(key in gates)) {

    setStatus(
      "Petak itu bukan gerbang. Pilih petak berwarna kuning.",
      true
    );

    return;
  }

  selectedGate = key;

  selectingGate = false;

  const dir = DIRS[gates[key]].label;

  setStatus(
    `Gerbang dipilih. Arah saat ini: <strong>${dir}</strong>. Tekan Putar 90°.`
  );

  render();
}


// ================================
// ROTATE GATE
// ================================

function rotateSelectedGate() {

  if (
    !selectedGate ||
    rotatedThisTurn ||
    gameOver
  ) return;

  const oldDirection = gates[selectedGate];

  // Rotate clockwise 90 degrees
  gates[selectedGate] =
    (oldDirection + 1) % 4;

  rotatedThisTurn = true;

  const newDirection =
    DIRS[gates[selectedGate]].label;

  const [r, c] =
    selectedGate.split(",").map(Number);

  addHistory(
    `<strong>Pemain ${currentPlayer}</strong> memutar gerbang (${r + 1}, ${c + 1}) ke ${newDirection}.`
  );

  selectedGate = null;

  selectingGate = false;

  setStatus(
    `Gerbang berhasil diputar! Arah baru: <strong>${newDirection}</strong>. Sekarang lanjutkan dengan bergerak.`
  );

  render();
}


// ================================
// MOVE PLAYER
// ================================

function attemptMove(r, c) {

  if (gameOver) return;

  const moves = legalMoves();

  const valid = moves.some(
    pos => pos.r === r && pos.c === c
  );

  if (!valid) {

    const p = players[currentPlayer];

    const gateDirection =
      gates[keyOf(p.r, p.c)];

    if (gateDirection !== undefined) {

      setStatus(
        `Pionmu berada di gerbang. Kamu hanya boleh keluar ke arah <strong>${DIRS[gateDirection].label}</strong>.`,
        true
      );

    } else {

      setStatus(
        "Langkah tidak valid. Pilih petak hijau yang bersebelahan dengan pionmu.",
        true
      );
    }

    return;
  }

  // Update player position
  players[currentPlayer] = { r, c };

  const reachedGoal =
    r === GOAL.r && c === GOAL.c;

  addHistory(
    `<strong>Pemain ${currentPlayer}</strong> bergerak ke baris ${r + 1}, kolom ${c + 1}.`
  );

  // CHECK WINNER
  if (reachedGoal) {

    gameOver = true;

    render();

    const winnerName =
      currentPlayer === 1
        ? "Pemain 1 · Merah"
        : "Pemain 2 · Biru";

    document.getElementById("winTitle").textContent =
      `${winnerName} Menang!`;

    document.getElementById("winMessage").textContent =
      "Kamu berhasil mencapai garis finis lebih dulu.";

    winOverlay.classList.add("show");

    setStatus(
      `<strong>${winnerName}</strong> memenangkan permainan!`
    );

    addHistory(
      `<strong>${winnerName}</strong> memenangkan permainan!`
    );

    updateHud();

    return;
  }

  // CHANGE TURN
  currentPlayer =
    currentPlayer === 1 ? 2 : 1;

  turnNumber++;

  rotatedThisTurn = false;

  selectedGate = null;

  selectingGate = false;

  const movesNext = legalMoves();

  if (movesNext.length === 0) {

    setStatus(
      `Pemain ${currentPlayer}, pionmu tertahan! Kamu bisa mencoba memutar gerbang yang ditempati.`
    );

  } else {

    setStatus(
      `Pemain ${currentPlayer}, giliranmu. Kamu boleh memutar satu gerbang lalu bergerak satu petak.`
    );
  }

  render();
}


// ================================
// END TURN
// ================================

function endTurn() {

  if (gameOver) return;

  addHistory(
    `<strong>Pemain ${currentPlayer}</strong> melewati langkah.`
  );

  currentPlayer =
    currentPlayer === 1 ? 2 : 1;

  turnNumber++;

  rotatedThisTurn = false;

  selectedGate = null;

  selectingGate = false;

  setStatus(
    `Giliran berpindah ke <strong>Pemain ${currentPlayer}</strong>.`
  );

  render();
}


// ================================
// BOARD CLICK
// ================================

function onBoardClick(event) {

  const cell = event.target.closest(".cell");

  if (!cell || cell.disabled || gameOver) return;

  const r = Number(cell.dataset.r);

  const c = Number(cell.dataset.c);

  if (selectingGate) {

    selectGate(r, c);

    return;
  }

  attemptMove(r, c);
}


// ================================
// KEYBOARD CONTROL
// ================================

function moveByKey(key) {

  if (gameOver) return;

  const p = players[currentPlayer];

  const map = {

    ArrowUp: {
      r: -1,
      c: 0
    },

    ArrowRight: {
      r: 0,
      c: 1
    },

    ArrowDown: {
      r: 1,
      c: 0
    },

    ArrowLeft: {
      r: 0,
      c: -1
    }
  };

  const d = map[key];

  if (!d) return;

  attemptMove(
    p.r + d.r,
    p.c + d.c
  );
}


// ================================
// EVENT LISTENERS
// ================================

boardEl.addEventListener(
  "click",
  onBoardClick
);

selectGateBtn.addEventListener(
  "click",
  chooseGateMode
);

rotateBtn.addEventListener(
  "click",
  rotateSelectedGate
);

passBtn.addEventListener(
  "click",
  endTurn
);

document.getElementById("resetBtn")
  .addEventListener(
    "click",
    resetGame
  );

document.getElementById("playAgainBtn")
  .addEventListener(
    "click",
    resetGame
  );

window.addEventListener(
  "keydown",
  event => {

    if (
      [
        "ArrowUp",
        "ArrowRight",
        "ArrowDown",
        "ArrowLeft"
      ].includes(event.key)
    ) {

      event.preventDefault();

      moveByKey(event.key);
    }
  }
);


// ================================
// START GAME
// ================================

resetGame();
