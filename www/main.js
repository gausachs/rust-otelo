import init, { Game } from "./pkg/otelo.js";

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("status-text");
const statusSpinnerEl = document.getElementById("status-spinner");
const scoreBlackEl = document.getElementById("score-black");
const scoreWhiteEl = document.getElementById("score-white");
const depthEl = document.getElementById("depth");
const depthValueEl = document.getElementById("depth-value");
const humanColorEl = document.getElementById("human-color");
const newGameEl = document.getElementById("new-game");
const swapSidesEl = document.getElementById("swap-sides");
const autoResetEl = document.getElementById("auto-reset");
const passEl = document.getElementById("pass");
const langModalEl = document.getElementById("lang-modal");
const langButtons = Array.from(langModalEl.querySelectorAll("button[data-lang]"));
const languageSelectEl = document.getElementById("language-select");

let game = null;
let humanColor = 0;
let lastMoveIdx = null;
const cells = [];
let lang = "en";
let lastFlips = [];
let lastMovePlayer = null;
let flipEndAt = 0;
let flipTimer = null;

const I18N = {
  ca: {
    choose_language: "Tria l'idioma",
    subtitle: "Juga contra una IA minimax.",
    human_color: "Color humà",
    black: "Negre",
    white: "Blanc",
    depth: "Profunditat",
    auto_reset: "Auto-reinicia",
    language: "Idioma",
    new_game: "Nova partida",
    swap_sides: "Canvia bàndol",
    loading: "Carregant...",
    pass: "Passar",
    legal_move: "Moviment legal",
    last_move: "Últim moviment",
    game_over: "Partida acabada. Avaluació per l'humà: {eval}",
    your_turn: "El teu torn ({color}). Avaluació: {eval}",
    ai_turn: "Torn de la IA ({color}). Avaluació: {eval}",
    ai_thinking: "La IA està pensant...",
    no_legal: "No hi ha moviments legals. Passes.",
    not_allowed: "Passar no està permès.",
  },
  pt: {
    choose_language: "Escolha o idioma",
    subtitle: "Jogue contra uma IA minimax.",
    human_color: "Cor humana",
    black: "Preto",
    white: "Branco",
    depth: "Profundidade",
    auto_reset: "Reinício auto",
    language: "Idioma",
    new_game: "Novo jogo",
    swap_sides: "Trocar lados",
    loading: "A carregar...",
    pass: "Passar",
    legal_move: "Jogada legal",
    last_move: "Última jogada",
    game_over: "Fim de jogo. Avaliação para o humano: {eval}",
    your_turn: "A tua vez ({color}). Avaliação: {eval}",
    ai_turn: "Vez da IA ({color}). Avaliação: {eval}",
    ai_thinking: "A IA está a pensar...",
    no_legal: "Sem jogadas legais. Passa.",
    not_allowed: "Passar não é permitido.",
  },
  fr: {
    choose_language: "Choisir la langue",
    subtitle: "Jouez contre une IA minimax.",
    human_color: "Couleur humaine",
    black: "Noir",
    white: "Blanc",
    depth: "Profondeur",
    auto_reset: "Réinit auto",
    language: "Langue",
    new_game: "Nouvelle partie",
    swap_sides: "Changer de camp",
    loading: "Chargement...",
    pass: "Passer",
    legal_move: "Coup légal",
    last_move: "Dernier coup",
    game_over: "Partie terminée. Évaluation pour l'humain : {eval}",
    your_turn: "Votre tour ({color}). Évaluation : {eval}",
    ai_turn: "Tour de l'IA ({color}). Évaluation : {eval}",
    ai_thinking: "L'IA réfléchit...",
    no_legal: "Aucun coup légal. Passe.",
    not_allowed: "Passer n'est pas autorisé.",
  },
  en: {
    choose_language: "Choose language",
    subtitle: "Play against a minimax AI.",
    human_color: "Human color",
    black: "Black",
    white: "White",
    depth: "Depth",
    auto_reset: "Auto-reset",
    language: "Language",
    new_game: "New game",
    swap_sides: "Swap sides",
    loading: "Loading...",
    pass: "Pass",
    legal_move: "Legal move",
    last_move: "Last move",
    game_over: "Game over. Eval for human: {eval}",
    your_turn: "Your turn ({color}). Eval: {eval}",
    ai_turn: "AI turn ({color}). Eval: {eval}",
    ai_thinking: "AI is thinking...",
    no_legal: "No legal moves. Pass.",
    not_allowed: "Pass not allowed.",
  },
  de: {
    choose_language: "Sprache wählen",
    subtitle: "Spiele gegen eine Minimax-KI.",
    human_color: "Menschliche Farbe",
    black: "Schwarz",
    white: "Weiß",
    depth: "Tiefe",
    auto_reset: "Auto-Reset",
    language: "Sprache",
    new_game: "Neues Spiel",
    swap_sides: "Seiten wechseln",
    loading: "Laden...",
    pass: "Passen",
    legal_move: "Legaler Zug",
    last_move: "Letzter Zug",
    game_over: "Spiel vorbei. Bewertung für den Menschen: {eval}",
    your_turn: "Du bist dran ({color}). Bewertung: {eval}",
    ai_turn: "KI ist dran ({color}). Bewertung: {eval}",
    ai_thinking: "KI denkt nach...",
    no_legal: "Keine legalen Züge. Passe.",
    not_allowed: "Passen ist nicht erlaubt.",
  },
  it: {
    choose_language: "Scegli la lingua",
    subtitle: "Gioca contro una IA minimax.",
    human_color: "Colore umano",
    black: "Nero",
    white: "Bianco",
    depth: "Profondità",
    auto_reset: "Auto-reset",
    language: "Lingua",
    new_game: "Nuova partita",
    swap_sides: "Cambia lato",
    loading: "Caricamento...",
    pass: "Passa",
    legal_move: "Mossa legale",
    last_move: "Ultima mossa",
    game_over: "Partita finita. Valutazione per l'umano: {eval}",
    your_turn: "Il tuo turno ({color}). Valutazione: {eval}",
    ai_turn: "Turno IA ({color}). Valutazione: {eval}",
    ai_thinking: "L'IA sta pensando...",
    no_legal: "Nessuna mossa legale. Passa.",
    not_allowed: "Passare non è permesso.",
  },
};

function t(key, vars = {}) {
  const dict = I18N[lang] || I18N.en;
  let str = dict[key] || I18N.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{${k}}`, String(v));
  });
  return str;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    if (el.tagName === "OPTION") {
      el.textContent = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  document.documentElement.lang = lang;
}

function setLanguage(next) {
  lang = next || "en";
  languageSelectEl.value = lang;
  applyI18n();
  if (game) {
    render();
  } else {
    setStatus(t("loading"), false);
  }
}

function idxFromRowCol(row, col) {
  const rank = 7 - row;
  return col + 8 * rank;
}

function buildBoard() {
  boardEl.innerHTML = "";
  cells.length = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const idx = idxFromRowCol(row, col);
      const cell = document.createElement("div");
      cell.className = "cell" + ((row + col) % 2 === 0 ? " dark" : "");
      cell.dataset.idx = String(idx);
      boardEl.appendChild(cell);
      cells[idx] = cell;
    }
  }
}

function setStatus(text, thinking = false) {
  statusTextEl.textContent = text;
  statusSpinnerEl.classList.toggle("hidden", !thinking);
}

function render() {
  if (!game) return;
  const cellsData = game.board_cells();
  const legal = game.legal_moves();
  const evals = null;
  const turn = game.side_to_move();
  const flipOrder = new Map();
  lastFlips.forEach((idx, i) => flipOrder.set(idx, i));
  const now = Date.now();
  const allowLegalMarkers = now >= flipEndAt;
  // Do not animate the newly placed piece; only flipped ones.

  for (let i = 0; i < 64; i++) {
    const cell = cells[i];
    cell.classList.remove("legal", "last");
    cell.innerHTML = "";
    if (allowLegalMarkers && legal[i] === 1 && turn === humanColor) {
      cell.classList.add("legal");
    }
    if (lastMoveIdx === i) {
      cell.classList.add("last");
    }
    if (cellsData[i] === 1 || cellsData[i] === 2) {
      const color = cellsData[i] === 1 ? "black" : "white";
      if (flipOrder.has(i) && lastMovePlayer !== null) {
        const prevColor = lastMovePlayer === 0 ? "white" : "black";
        const piece = createFlipPiece(prevColor, color);
        piece.style.animationDelay = `${500 + flipOrder.get(i) * 150}ms`;
        cell.appendChild(piece);
      } else {
        cell.appendChild(createPiece(color));
      }
    }
  }
  // Consume flips so they don't re-animate on subsequent renders.
  lastFlips = [];

  scoreBlackEl.textContent = String(game.score_black());
  scoreWhiteEl.textContent = String(game.score_white());

  if (game.is_game_over()) {
    const evalScore = game.eval_for_human();
    setStatus(t("game_over", { eval: evalScore }), false);
    passEl.disabled = true;
    if (autoResetEl.checked) {
      setTimeout(() => resetGame(), 600);
    }
    return;
  }

  const turnName = turn === 0 ? "Black" : "White";
  const turnNameLocalized = t(turn === 0 ? "black" : "white");
  const evalScore = game.eval_for_human();
  if (turn === humanColor) {
    setStatus(t("your_turn", { color: turnNameLocalized, eval: evalScore }), false);
  } else {
    setStatus(t("ai_turn", { color: turnNameLocalized, eval: evalScore }), false);
  }

  const legalCount = legal.reduce((a, b) => a + b, 0);
  passEl.disabled = !(turn === humanColor && legalCount === 0);
}

function handleCellClick(e) {
  if (!game) return;
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const idx = Number(cell.dataset.idx);
  if (Number.isNaN(idx)) return;
  if (game.side_to_move() !== humanColor) return;
  try {
    game.apply_human_move(idx);
    syncLastMove();
    render();
    maybeAiMove();
  } catch (err) {
    setStatus(String(err));
  }
}

function createPiece(color) {
  const piece = document.createElement("div");
  piece.className = `piece ${color}`;
  return piece;
}

function createFlipPiece(prevColor, nextColor) {
  const piece = document.createElement("div");
  piece.className = "piece flip";
  const front = document.createElement("div");
  front.className = `face front ${prevColor}`;
  const back = document.createElement("div");
  back.className = `face back ${nextColor}`;
  piece.appendChild(front);
  piece.appendChild(back);
  return piece;
}

function maybeAiMove() {
  if (!game) return;
  if (game.is_game_over()) return;
  if (game.side_to_move() === humanColor) return;
  setStatus(t("ai_thinking"), true);
  setTimeout(() => {
    try {
      const idx = game.ai_move();
      syncLastMove();
    } catch (err) {
      setStatus(String(err), false);
    }
    render();
    if (game.side_to_move() !== humanColor) {
      maybeAiMove();
    }
  }, 2000);
}

function resetGame() {
  humanColor = Number(humanColorEl.value);
  lastMoveIdx = null;
  lastFlips = [];
  game.reset(humanColor);
  game.set_depth(Number(depthEl.value));
  render();
  maybeAiMove();
}

function hookControls() {
  boardEl.addEventListener("click", handleCellClick);
  depthEl.addEventListener("input", () => {
    depthValueEl.textContent = depthEl.value;
    if (game) game.set_depth(Number(depthEl.value));
  });
  autoResetEl.addEventListener("change", () => {
    render();
  });
  newGameEl.addEventListener("click", resetGame);
  humanColorEl.addEventListener("change", resetGame);
  swapSidesEl.addEventListener("click", () => {
    if (!game) return;
    humanColor = humanColor === 0 ? 1 : 0;
    humanColorEl.value = String(humanColor);
    game.set_human_color(humanColor);
    render();
    maybeAiMove();
  });
  passEl.addEventListener("click", () => {
    if (!game) return;
    try {
      game.pass();
      syncLastMove();
      render();
      maybeAiMove();
    } catch (err) {
    setStatus(String(err), false);
    }
  });
}

function hookLanguagePicker() {
  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang || "en");
      langModalEl.classList.add("hidden");
      if (!game) {
        initGame();
      }
    });
  });
}

async function initGame() {
  buildBoard();
  hookControls();
  depthValueEl.textContent = depthEl.value;
  await init();
  humanColor = Number(humanColorEl.value);
  game = new Game(humanColor, Number(depthEl.value));
  syncLastMove();
  render();
  maybeAiMove();
}

applyI18n();
hookLanguagePicker();
languageSelectEl.addEventListener("change", () => {
  setLanguage(languageSelectEl.value || "en");
});

function syncLastMove() {
  if (!game) return;
  const idx = game.last_move_idx();
  lastMoveIdx = idx < 64 ? idx : null;
  lastFlips = game.last_flips();
  const p = game.last_move_player();
  lastMovePlayer = p === 0 || p === 1 ? p : null;
  if (lastFlips.length > 0) {
    const baseDelay = 500;
    const step = 150;
    const duration = 850;
    const total =
      baseDelay + (lastFlips.length - 1) * step + duration + 50;
    flipEndAt = Date.now() + total;
    if (flipTimer) {
      clearTimeout(flipTimer);
    }
    flipTimer = setTimeout(() => {
      render();
      flipTimer = null;
    }, total);
  } else {
    flipEndAt = 0;
  }
}
