// Tryb nauki słownictwa (Vocabulary) — osobny od pozostałych trybów.
// Dwie fazy: 1) wybór znaczenia (kafle), 2) wpisanie słowa w rōmaji.
// Ten plik zawiera też CENTRALNY przełącznik wszystkich zakładek trybów.

(function () {
  "use strict";

  // --- Centralny przełącznik trybów (wszystkie zakładki) ---
  const apps = {
    counters: document.getElementById("counters-app"),
    kanji: document.getElementById("kanji-app"),
    verbs: document.getElementById("verbs-app"),
    vocab: document.getElementById("vocab-app")
  };
  const modeBtns = {
    counters: document.getElementById("mode-counters"),
    kanji: document.getElementById("mode-kanji"),
    verbs: document.getElementById("mode-verbs"),
    vocab: document.getElementById("mode-vocab")
  };
  function switchMode(mode) {
    Object.keys(apps).forEach(function (m) {
      apps[m].hidden = (m !== mode);
      modeBtns[m].classList.toggle("active", m === mode);
    });
  }
  Object.keys(modeBtns).forEach(function (m) {
    modeBtns[m].addEventListener("click", function () { switchMode(m); });
  });

  // --- Konfiguracja faz ---
  const STAGE_INFO = {
    1: "Faza 1 · Wybierz znaczenie",
    2: "Faza 2 · Wpisz słowo w rōmaji"
  };
  const PHASE_NAME = { 1: "znaczenie", 2: "zapis" };
  const STORAGE_KEY = "nihongo.vocab.selected";

  const state = {
    selected: new Set(),
    count: 10,
    stages: [1, 2],
    stage: 1,
    pool: [],
    queue: [],
    current: null,
    answered: false,
    index: 0,
    mistakes: [],
    phaseResults: [],
    stats: { correct: 0, wrong: 0, streak: 0 }
  };

  const el = {
    setup: document.getElementById("w-setup"),
    quiz: document.getElementById("w-quiz"),
    results: document.getElementById("w-results"),
    groups: document.getElementById("w-groups"),
    countSelect: document.getElementById("w-count"),
    startBtn: document.getElementById("w-start-btn"),

    progressText: document.getElementById("w-progress-text"),
    progressFill: document.getElementById("w-progress-fill"),
    stageHint: document.getElementById("w-stage-hint"),
    card: document.getElementById("w-card"),
    cardQuestion: document.getElementById("w-card-question"),
    cardSub: document.getElementById("w-card-sub"),
    tiles: document.getElementById("w-tiles"),
    form: document.getElementById("w-answer-form"),
    input: document.getElementById("w-answer-input"),
    submitBtn: document.getElementById("w-submit-btn"),
    dontKnowBtn: document.getElementById("w-dontknow-btn"),
    quitBtn: document.getElementById("w-quit-btn"),
    feedback: document.getElementById("w-feedback"),
    nextBtn: document.getElementById("w-next-btn"),

    resultTitle: document.getElementById("w-result-title"),
    resultScore: document.getElementById("w-result-score"),
    resultAccuracy: document.getElementById("w-result-accuracy"),
    resultDetail: document.getElementById("w-result-detail"),
    resultActions: document.getElementById("w-result-actions"),

    sCorrect: document.getElementById("w-stat-correct"),
    sWrong: document.getElementById("w-stat-wrong"),
    sStreak: document.getElementById("w-stat-streak"),
    sAcc: document.getElementById("w-stat-accuracy")
  };

  // --- Helpery ---
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function normalize(s) {
    return s.toLowerCase().trim()
      .replace(/[\s'’\-]/g, "")
      .replace(/ō|ô/g, "ou").replace(/ū|û/g, "uu")
      .replace(/ā|â/g, "aa").replace(/ē|ê/g, "ee").replace(/ī|î/g, "ii");
  }
  function matches(expected, raw) {
    const e = normalize(expected), r = normalize(raw);
    return e === r || e.replace(/([aeiou])\1/g, "$1") === r.replace(/([aeiou])\1/g, "$1");
  }
  function isLastStage() { return state.stages.indexOf(state.stage) === state.stages.length - 1; }
  function nextStageNum() { return state.stages[state.stages.indexOf(state.stage) + 1]; }

  // --- Wybór kategorii ---
  function saveSelection() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.selected))); } catch (e) {}
  }
  function loadSelection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) JSON.parse(raw).forEach(function (id) { if (VOCAB_GROUPS[id]) state.selected.add(id); });
    } catch (e) {}
  }
  function renderGroups() {
    el.groups.innerHTML = "";
    Object.values(VOCAB_GROUPS).forEach(function (g) {
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", g.color);
      card.innerHTML =
        '<div class="check">✓</div>' +
        '<div class="glyph">' + (g.glyph || "") + "</div>" +
        '<div class="name">' + g.label + "</div>" +
        '<div class="sub">' + g.items.length + " słówek</div>";
      if (state.selected.has(g.id)) card.classList.add("selected");
      card.addEventListener("click", function () {
        if (state.selected.has(g.id)) { state.selected.delete(g.id); card.classList.remove("selected"); }
        else { state.selected.add(g.id); card.classList.add("selected"); }
        saveSelection();
        el.startBtn.disabled = state.selected.size === 0;
      });
      el.groups.appendChild(card);
    });
    el.startBtn.disabled = state.selected.size === 0;
  }

  // --- Sterowanie sesją ---
  function buildPool() {
    const pool = [];
    state.selected.forEach(function (id) {
      VOCAB_GROUPS[id].items.forEach(function (it) {
        pool.push({ group: VOCAB_GROUPS[id], item: it });
      });
    });
    return pool;
  }

  function startQuiz() {
    if (state.selected.size === 0) return;
    state.count = parseInt(el.countSelect.value, 10) || 10;
    state.pool = buildPool();
    state.phaseResults = [];
    startStage(1);
  }

  function startStage(n) {
    state.stage = n;
    state.stats = { correct: 0, wrong: 0, streak: 0 };
    state.mistakes = [];
    state.index = 0;
    state.current = null;
    // unikalne pytania (po romaji), przemieszane, przycięte do liczby pytań
    const seen = new Set();
    const unique = state.pool.filter(function (q) {
      if (seen.has(q.item.romaji)) return false;
      seen.add(q.item.romaji);
      return true;
    });
    state.queue = shuffle(unique).slice(0, state.count);
    updateStats();
    el.stageHint.textContent = STAGE_INFO[n];
    el.results.classList.remove("active");
    el.setup.classList.remove("active");
    el.quiz.classList.add("active");
    nextQuestion();
  }

  function nextQuestion() {
    if (state.index >= state.queue.length) { showResults(); return; }
    state.answered = false;
    el.feedback.innerHTML = "";
    el.nextBtn.hidden = true;

    state.current = state.queue[state.index];
    state.index++;
    updateProgress();

    if (state.stage === 1) renderMeaning();
    else renderSpelling();
  }

  // --- Faza 1: wybór znaczenia ---
  function renderMeaning() {
    el.form.hidden = true;
    el.dontKnowBtn.hidden = true;
    el.tiles.hidden = false;
    el.tiles.innerHTML = "";
    el.card.classList.remove("reading-mode");
    el.cardSub.hidden = false;

    const it = state.current.item;
    el.cardQuestion.textContent = it.kana;
    el.cardSub.textContent = it.romaji;

    const own = it.meaning;
    const pool = [];
    const seen = new Set([own]);
    state.pool.forEach(function (q) {
      if (!seen.has(q.item.meaning)) { seen.add(q.item.meaning); pool.push(q.item.meaning); }
    });
    const distractors = shuffle(pool).slice(0, 2);
    const options = shuffle([own].concat(distractors));

    options.forEach(function (m) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile tile-text";
      btn.textContent = m;
      if (m === own) btn.dataset.correct = "1";
      btn.addEventListener("click", function () { answerTile(m === own, btn); });
      el.tiles.appendChild(btn);
    });
  }

  // --- Faza 2: wpisanie w rōmaji ---
  function renderSpelling() {
    el.tiles.hidden = true;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;
    el.card.classList.add("reading-mode");
    el.cardSub.hidden = true;

    el.cardQuestion.textContent = state.current.item.meaning;
    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.submitBtn.textContent = "Sprawdź";
    el.input.focus();
  }

  // --- Obsługa odpowiedzi ---
  function answerTile(ok, btn) {
    if (state.answered) return;
    el.tiles.querySelectorAll(".tile").forEach(function (b) {
      b.disabled = true;
      if (b.dataset.correct === "1") b.classList.add("correct");
    });
    if (!ok) btn.classList.add("wrong");
    resolve(ok, true);
  }

  function submitAnswer() {
    if (state.answered) { nextQuestion(); return; }
    const raw = el.input.value;
    if (!raw.trim()) return;
    resolve(matches(state.current.item.romaji, raw), false);
  }

  function giveUp() {
    if (state.answered) return;
    el.input.value = state.current.item.romaji;
    resolve(false, false);
  }

  function answerLabel() {
    const it = state.current.item;
    return it.kana + " (" + it.romaji + ") = " + it.meaning;
  }

  function resolve(ok, tileMode) {
    state.answered = true;
    if (ok) {
      state.stats.correct++;
      state.stats.streak++;
      el.feedback.innerHTML = '<span class="ok">✔ Dobrze!</span> <span class="answer">' + answerLabel() + "</span>";
    } else {
      state.stats.wrong++;
      state.stats.streak = 0;
      state.mistakes.push({ text: answerLabel() });
      el.feedback.innerHTML = '<span class="no">✘ Błąd.</span> <span class="answer">' + answerLabel() + "</span>";
    }
    updateStats();

    if (tileMode) {
      el.nextBtn.hidden = false;
      el.nextBtn.focus();
    } else {
      el.input.className = ok ? "good" : "bad";
      el.input.disabled = true;
      el.dontKnowBtn.disabled = true;
      el.submitBtn.textContent = "Dalej →";
      el.submitBtn.focus();
    }
  }

  function updateProgress() {
    const total = state.queue.length;
    el.progressText.textContent = "Faza " + state.stage + " · Pytanie " + state.index + " z " + total;
    el.progressFill.style.width = (state.index / total) * 100 + "%";
  }
  function updateStats() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    el.sCorrect.textContent = state.stats.correct;
    el.sWrong.textContent = state.stats.wrong;
    el.sStreak.textContent = state.stats.streak;
    el.sAcc.textContent = acc + "%";
  }

  function mistakesHtml(mistakes) {
    if (mistakes.length === 0) return '<p class="none">🎉 Bezbłędnie! Wszystkie odpowiedzi poprawne.</p>';
    const rows = mistakes.map(function (m) { return "<li>" + m.text + "</li>"; }).join("");
    return "<p class=\"muted-line\">Do powtórki (" + mistakes.length + "):</p><ul>" + rows + "</ul>";
  }
  function phaseSectionHtml(r) {
    return '<div class="phase-summary"><h3>Faza ' + r.stage + " — " + PHASE_NAME[r.stage] +
      ": " + r.correct + " / " + r.total + " (" + r.acc + "%)</h3>" + mistakesHtml(r.mistakes) + "</div>";
  }

  function showResults() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    const isLast = isLastStage();

    state.phaseResults.push({
      stage: state.stage, correct: state.stats.correct, total: total, acc: acc,
      mistakes: state.mistakes.slice()
    });

    if (isLast) {
      let sumC = 0, sumT = 0;
      state.phaseResults.forEach(function (r) { sumC += r.correct; sumT += r.total; });
      const overall = sumT === 0 ? 100 : Math.round((sumC / sumT) * 100);
      el.resultTitle.textContent = "Koniec — ukończono wszystkie fazy!";
      el.resultScore.textContent = sumC + " / " + sumT;
      el.resultAccuracy.textContent = "Łączna celność: " + overall + "%";
      el.resultDetail.innerHTML = state.phaseResults.map(phaseSectionHtml).join("");
    } else {
      el.resultTitle.textContent = "Koniec fazy " + state.stage + "!";
      el.resultScore.textContent = state.stats.correct + " / " + total;
      el.resultAccuracy.textContent = "Celność: " + acc + "%";
      el.resultDetail.innerHTML = mistakesHtml(state.mistakes);
    }

    renderResultActions(isLast);
    el.quiz.classList.remove("active");
    el.results.classList.add("active");
  }

  function renderResultActions(isLast) {
    el.resultActions.innerHTML = "";
    if (!isLast) {
      const target = nextStageNum();
      const next = document.createElement("button");
      next.className = "btn primary";
      next.textContent = "Faza " + target + " →";
      next.addEventListener("click", function () { startStage(target); });
      el.resultActions.appendChild(next);
    } else {
      const again = document.createElement("button");
      again.className = "btn primary";
      again.textContent = "Zagraj ponownie";
      again.addEventListener("click", startQuiz);
      el.resultActions.appendChild(again);
    }
    const back = document.createElement("button");
    back.className = "btn ghost";
    back.textContent = "← Zmień kategorie";
    back.addEventListener("click", function () {
      el.results.classList.remove("active");
      el.setup.classList.add("active");
    });
    el.resultActions.appendChild(back);
  }

  function quitQuiz() {
    el.quiz.classList.remove("active");
    el.setup.classList.add("active");
  }

  // --- Zdarzenia ---
  el.startBtn.addEventListener("click", startQuiz);
  el.quitBtn.addEventListener("click", quitQuiz);
  el.dontKnowBtn.addEventListener("click", giveUp);
  el.nextBtn.addEventListener("click", nextQuestion);
  el.form.addEventListener("submit", function (e) { e.preventDefault(); submitAnswer(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && state.answered && !el.nextBtn.hidden && !apps.vocab.hidden) {
      e.preventDefault();
      nextQuestion();
    }
  });

  // --- Init ---
  loadSelection();
  renderGroups();
})();
