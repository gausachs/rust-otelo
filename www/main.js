const WASM_VERSION = "v8";

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
const passEl = document.getElementById("pass");
const langModalEl = document.getElementById("lang-modal");
const langButtons = Array.from(langModalEl.querySelectorAll("button[data-lang]"));
const languageSelectEl = document.getElementById("language-select");
const setupHumanColorEl = document.getElementById("setup-human-color");
const setupDepthEl = document.getElementById("setup-depth");
const setupDepthValueEl = document.getElementById("setup-depth-value");
const setupStartEl = document.getElementById("setup-start");
const confirmModalEl = document.getElementById("confirm-modal");
const confirmTitleEl = document.getElementById("confirm-title");
const confirmMessageEl = document.getElementById("confirm-message");
const confirmCancelEl = document.getElementById("confirm-cancel");
const confirmOkEl = document.getElementById("confirm-ok");

let game = null;
let humanColor = 0;
let lastMoveIdx = null;
const cells = [];
let lang = "ca";
let lastFlips = [];
let lastMovePlayer = null;
let flipEndAt = 0;
let flipTimer = null;
const AI_THINK_START_DELAY = 100;
const AI_THINK_DELAY = 1200;
let pendingConfirm = null;

const I18N = {
  ca: {
    choose_language: "Tria l'idioma",
    subtitle: "Juga contra una IA minimax.",
    human_color: "Color humà",
    black: "Negre",
    white: "Blanc",
    depth: "Dificultat/Profunditat",
    language: "Idioma",
    new_game: "Nova partida",
    loading: "Carregant...",
    pass: "Passar",
    legal_move: "Moviment legal",
    last_move: "Últim moviment",
    game_over: "Partida acabada. Material per l'humà: {eval}",
    your_turn: "El teu torn ({color}). Material: {eval}",
    ai_turn: "Torn de la IA ({color}). Material: {eval}",
    ai_thinking: "La IA està pensant...",
    confirm_new_game: "Vols començar una nova partida?",
    confirm_swap_sides: "Vols canviar el color humà?",
    confirm_title: "Confirmació",
    confirm_ok: "D'acord",
    confirm_cancel: "Cancel·la",
    start_game: "Comença",
    no_legal: "No hi ha moviments legals. Passes.",
    not_allowed: "Passar no està permès.",
  },
  pt: {
    choose_language: "Escolha o idioma",
    subtitle: "Jogue contra uma IA minimax.",
    human_color: "Cor humana",
    black: "Preto",
    white: "Branco",
    depth: "Dificuldade/Profundidade",
    language: "Idioma",
    new_game: "Novo jogo",
    loading: "A carregar...",
    pass: "Passar",
    legal_move: "Jogada legal",
    last_move: "Última jogada",
    game_over: "Fim de jogo. Material para o humano: {eval}",
    your_turn: "A tua vez ({color}). Material: {eval}",
    ai_turn: "Vez da IA ({color}). Material: {eval}",
    ai_thinking: "A IA está a pensar...",
    confirm_new_game: "Queres começar um novo jogo?",
    confirm_swap_sides: "Queres mudar a cor humana?",
    confirm_title: "Confirmação",
    confirm_ok: "OK",
    confirm_cancel: "Cancelar",
    start_game: "Começar",
    no_legal: "Sem jogadas legais. Passa.",
    not_allowed: "Passar não é permitido.",
  },
  fr: {
    choose_language: "Choisir la langue",
    subtitle: "Jouez contre une IA minimax.",
    human_color: "Couleur humaine",
    black: "Noir",
    white: "Blanc",
    depth: "Difficulté/Profondeur",
    language: "Langue",
    new_game: "Nouvelle partie",
    loading: "Chargement...",
    pass: "Passer",
    legal_move: "Coup légal",
    last_move: "Dernier coup",
    game_over: "Partie terminée. Matériel pour l'humain : {eval}",
    your_turn: "Votre tour ({color}). Matériel : {eval}",
    ai_turn: "Tour de l'IA ({color}). Matériel : {eval}",
    ai_thinking: "L'IA réfléchit...",
    confirm_new_game: "Voulez-vous commencer une nouvelle partie ?",
    confirm_swap_sides: "Voulez-vous changer la couleur humaine ?",
    confirm_title: "Confirmation",
    confirm_ok: "OK",
    confirm_cancel: "Annuler",
    start_game: "Commencer",
    no_legal: "Aucun coup légal. Passe.",
    not_allowed: "Passer n'est pas autorisé.",
  },
  en: {
    choose_language: "Choose language",
    subtitle: "Play against a minimax AI.",
    human_color: "Human color",
    black: "Black",
    white: "White",
    depth: "Difficulty/Depth",
    language: "Language",
    new_game: "New game",
    loading: "Loading...",
    pass: "Pass",
    legal_move: "Legal move",
    last_move: "Last move",
    game_over: "Game over. Material for human: {eval}",
    your_turn: "Your turn ({color}). Material: {eval}",
    ai_turn: "AI turn ({color}). Material: {eval}",
    ai_thinking: "AI is thinking...",
    confirm_new_game: "Start a new game?",
    confirm_swap_sides: "Change human color?",
    confirm_title: "Confirm",
    confirm_ok: "OK",
    confirm_cancel: "Cancel",
    start_game: "Start",
    no_legal: "No legal moves. Pass.",
    not_allowed: "Pass not allowed.",
  },
  de: {
    choose_language: "Sprache wählen",
    subtitle: "Spiele gegen eine Minimax-KI.",
    human_color: "Menschliche Farbe",
    black: "Schwarz",
    white: "Weiß",
    depth: "Schwierigkeit/Tiefe",
    language: "Sprache",
    new_game: "Neues Spiel",
    loading: "Laden...",
    pass: "Passen",
    legal_move: "Legaler Zug",
    last_move: "Letzter Zug",
    game_over: "Spiel vorbei. Material für den Menschen: {eval}",
    your_turn: "Du bist dran ({color}). Material: {eval}",
    ai_turn: "KI ist dran ({color}). Material: {eval}",
    ai_thinking: "KI denkt nach...",
    confirm_new_game: "Neues Spiel starten?",
    confirm_swap_sides: "Menschliche Farbe ändern?",
    confirm_title: "Bestätigen",
    confirm_ok: "OK",
    confirm_cancel: "Abbrechen",
    start_game: "Starten",
    no_legal: "Keine legalen Züge. Passe.",
    not_allowed: "Passen ist nicht erlaubt.",
  },
  it: {
    choose_language: "Scegli la lingua",
    subtitle: "Gioca contro una IA minimax.",
    human_color: "Colore umano",
    black: "Nero",
    white: "Bianco",
    depth: "Difficoltà/Profondità",
    language: "Lingua",
    new_game: "Nuova partita",
    loading: "Caricamento...",
    pass: "Passa",
    legal_move: "Mossa legale",
    last_move: "Ultima mossa",
    game_over: "Partita finita. Materiale per l'umano: {eval}",
    your_turn: "Il tuo turno ({color}). Materiale: {eval}",
    ai_turn: "Turno IA ({color}). Materiale: {eval}",
    ai_thinking: "L'IA sta pensando...",
    confirm_new_game: "Vuoi iniziare una nuova partita?",
    confirm_swap_sides: "Vuoi cambiare il colore umano?",
    confirm_title: "Conferma",
    confirm_ok: "OK",
    confirm_cancel: "Annulla",
    start_game: "Inizia",
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
  confirmTitleEl.textContent = t("confirm_title");
  confirmCancelEl.textContent = t("confirm_cancel");
  confirmOkEl.textContent = t("confirm_ok");
  setupStartEl.textContent = t("start_game");
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
    const evalScore = game.material_eval_for_human();
    setStatus(t("game_over", { eval: evalScore }), false);
    passEl.disabled = true;
    // No auto-reset.
    return;
  }

  const turnNameLocalized = t(turn === 0 ? "black" : "white");
  const evalScore = game.material_eval_for_human();
  if (turn === humanColor) {
    setStatus(t("your_turn", { color: turnNameLocalized, eval: evalScore }), false);
  } else {
    // Always show spinner on AI turn.
    setStatus(t("ai_thinking"), true);
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
  setTimeout(() => {
    if (!game) return;
    if (game.is_game_over() || game.side_to_move() === humanColor) {
      return;
    }
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
    }, 0);
  }, AI_THINK_DELAY);
}

function resetGame() {
  humanColor = Number(humanColorEl.value);
  lastMoveIdx = null;
  lastFlips = [];
  game.reset(humanColor);
  game.set_depth(Number(depthEl.value));
  syncLastMove();
  render();
  maybeAiMove();
}

function hookControls() {
  boardEl.addEventListener("click", handleCellClick);
  depthEl.addEventListener("input", () => {
    depthValueEl.textContent = depthEl.value;
    if (game) game.set_depth(Number(depthEl.value));
  });
  newGameEl.addEventListener("click", () => {
    showConfirm(t("confirm_new_game"), () => resetGame());
  });
  humanColorEl.addEventListener("change", () => {
    if (!game) return;
    showConfirm(t("confirm_swap_sides"), () => {
      humanColor = Number(humanColorEl.value);
      game.set_human_color(humanColor);
      render();
      maybeAiMove();
    });
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
    });
  });
}

function showConfirm(message, onOk) {
  confirmMessageEl.textContent = message;
  confirmModalEl.classList.remove("hidden");
  pendingConfirm = onOk;
}

function closeConfirm() {
  confirmModalEl.classList.add("hidden");
  pendingConfirm = null;
}

async function initGame() {
  buildBoard();
  hookControls();
  depthValueEl.textContent = depthEl.value;
  const wasm = await import(`./pkg/otelo.js?${WASM_VERSION}`);
  await wasm.default({
    module_or_path: new URL(`./pkg/otelo_bg.wasm?${WASM_VERSION}`, import.meta.url),
  });
  humanColor = Number(humanColorEl.value);
  game = new wasm.Game(humanColor, Number(depthEl.value));
  syncLastMove();
  render();
  maybeAiMove();
}

applyI18n();
hookLanguagePicker();
setupDepthValueEl.textContent = setupDepthEl.value;
setupDepthEl.addEventListener("input", () => {
  setupDepthValueEl.textContent = setupDepthEl.value;
});
setupStartEl.addEventListener("click", () => {
  humanColorEl.value = setupHumanColorEl.value;
  depthEl.value = setupDepthEl.value;
  depthValueEl.textContent = depthEl.value;
  langModalEl.classList.add("hidden");
  if (!game) {
    initGame();
  } else {
    humanColor = Number(humanColorEl.value);
    game.set_human_color(humanColor);
    game.set_depth(Number(depthEl.value));
    render();
    maybeAiMove();
  }
});
languageSelectEl.addEventListener("change", () => {
  setLanguage(languageSelectEl.value || "en");
});
confirmCancelEl.addEventListener("click", closeConfirm);
confirmOkEl.addEventListener("click", () => {
  const cb = pendingConfirm;
  closeConfirm();
  if (cb) cb();
});
confirmModalEl.addEventListener("click", (e) => {
  if (e.target === confirmModalEl) {
    closeConfirm();
  }
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
