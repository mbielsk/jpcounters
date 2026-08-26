// Counters Pro — quiz japońskich liczników.
// Cała logika po stronie klienta, bez zależności. Gotowe pod GitHub Pages.

(function () {
  "use strict";

  const STORAGE_KEY = "counterspro.selected";

  // --- Stan ---
  const state = {
    selected: new Set(),   // id grup
    mode: "romaji",        // romaji | hiragana | any
    length: 10,            // liczba pytań w sesji (0 = bez limitu)
    pool: [],              // aktywne pytania
    current: null,
    answered: false,       // czy bieżące pytanie zostało sprawdzone
    index: 0,              // numer bieżącego pytania (0-based)
    mistakes: [],          // lista błędnie odpowiedzianych pytań
    stats: { correct: 0, wrong: 0, streak: 0 }
  };

  // --- Elementy DOM ---
  const el = {
    setup: document.getElementById("setup"),
    quiz: document.getElementById("quiz"),
    results: document.getElementById("results"),
    groups: document.getElementById("groups"),
    startBtn: document.getElementById("start-btn"),
    modeSelect: document.getElementById("answer-mode"),
    lengthSelect: document.getElementById("session-length"),
    progressText: document.getElementById("progress-text"),
    progressFill: document.getElementById("progress-fill"),
    dontKnowBtn: document.getElementById("dontknow-btn"),
    resultScore: document.getElementById("result-score"),
    resultAccuracy: document.getElementById("result-accuracy"),
    resultDetail: document.getElementById("result-detail"),
    againBtn: document.getElementById("again-btn"),
    backBtn: document.getElementById("back-btn"),
    cardCounter: document.getElementById("card-counter"),
    cardQuestion: document.getElementById("card-question"),
    form: document.getElementById("answer-form"),
    input: document.getElementById("answer-input"),
    submitBtn: document.getElementById("submit-btn"),
    feedback: document.getElementById("feedback"),
    quitBtn: document.getElementById("quit-btn"),
    sCorrect: document.getElementById("stat-correct"),
    sWrong: document.getElementById("stat-wrong"),
    sStreak: document.getElementById("stat-streak"),
    sAcc: document.getElementById("stat-accuracy")
  };

  // --- Normalizacja odpowiedzi ---
  // Ujednolica romaji: usuwa spacje/łączniki/apostrofy, zamienia makrony,
  // sprowadza długie samogłoski do prostszej formy dla luźniejszego porównania.
  function normalizeRomaji(s) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[\s'’\-]/g, "")
      .replace(/ō|ô/g, "ou")
      .replace(/ū|û/g, "uu")
      .replace(/ā|â/g, "aa")
      .replace(/ē|ê/g, "ee")
      .replace(/ī|î/g, "ii");
  }

  function normalizeHiragana(s) {
    return s.trim().replace(/\s/g, "");
  }

  // Buduje zbiór akceptowanych form dla danego trybu.
  function acceptedAnswers(item) {
    const set = new Set();
    if (state.mode === "hiragana" || state.mode === "any") {
      set.add("hira:" + normalizeHiragana(item.reading));
    }
    if (state.mode === "romaji" || state.mode === "any") {
      item.romaji.forEach(function (r) {
        const n = normalizeRomaji(r);
        set.add("rom:" + n);
        // wariant bez podwojonych samogłosek (junin dla juunin itp.)
        set.add("rom:" + n.replace(/([aeiou])\1/g, "$1"));
      });
    }
    return set;
  }

  function checkAnswer(item, raw) {
    const accepted = acceptedAnswers(item);
    const asHira = "hira:" + normalizeHiragana(raw);
    const rom = normalizeRomaji(raw);
    const asRom = "rom:" + rom;
    const asRomShort = "rom:" + rom.replace(/([aeiou])\1/g, "$1");
    return accepted.has(asHira) || accepted.has(asRom) || accepted.has(asRomShort);
  }

  // --- Render ekranu wyboru ---
  function renderGroups() {
    el.groups.innerHTML = "";
    Object.values(COUNTER_GROUPS).forEach(function (g) {
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", g.color);
      card.dataset.id = g.id;
      card.innerHTML =
        '<div class="check">✓</div>' +
        '<div class="glyph">' + g.counter + "</div>" +
        '<div class="name">' + g.label + "</div>" +
        '<div class="sub">' + g.reading + "</div>";
      if (state.selected.has(g.id)) card.classList.add("selected");
      card.addEventListener("click", function () {
        toggleGroup(g.id, card);
      });
      el.groups.appendChild(card);
    });
    updateStartBtn();
  }

  function toggleGroup(id, card) {
    if (state.selected.has(id)) {
      state.selected.delete(id);
      card.classList.remove("selected");
    } else {
      state.selected.add(id);
      card.classList.add("selected");
    }
    saveSelection();
    updateStartBtn();
  }

  function updateStartBtn() {
    el.startBtn.disabled = state.selected.size === 0;
  }

  function saveSelection() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(state.selected))
      );
    } catch (e) { /* localStorage niedostępny — ignorujemy */ }
  }

  function loadSelection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        JSON.parse(raw).forEach(function (id) {
          if (COUNTER_GROUPS[id]) state.selected.add(id);
        });
      }
    } catch (e) { /* ignorujemy */ }
  }

  // --- Quiz ---
  function buildPool() {
    const pool = [];
    state.selected.forEach(function (id) {
      const g = COUNTER_GROUPS[id];
      g.items.forEach(function (item) {
        pool.push({ group: g, item: item });
      });
    });
    return pool;
  }

  function startQuiz() {
    state.mode = el.modeSelect.value;
    state.length = parseInt(el.lengthSelect.value, 10) || 0;
    state.pool = buildPool();
    state.stats = { correct: 0, wrong: 0, streak: 0 };
    state.mistakes = [];
    state.index = 0;
    state.current = null;
    updateStats();
    el.results.classList.remove("active");
    el.setup.classList.remove("active");
    el.quiz.classList.add("active");
    nextQuestion();
  }

  function nextQuestion() {
    // koniec sesji, jeśli osiągnięto limit pytań
    if (state.length > 0 && state.index >= state.length) {
      showResults();
      return;
    }

    state.answered = false;
    el.feedback.innerHTML = "";
    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.submitBtn.textContent = "Sprawdź";
    el.dontKnowBtn.disabled = false;

    // losujemy inne pytanie niż ostatnie (jeśli pula > 1)
    let pick;
    do {
      pick = state.pool[Math.floor(Math.random() * state.pool.length)];
    } while (state.pool.length > 1 && pick === state.current);

    state.current = pick;
    state.index++;
    updateProgress();
    el.cardCounter.textContent = pick.group.counter;
    el.cardCounter.style.color = pick.group.color;
    const numLabel = pick.item.num === "?" ? "何" : pick.item.num;
    el.cardQuestion.textContent = numLabel + pick.group.counter;
    el.input.focus();
  }

  function updateProgress() {
    if (state.length > 0) {
      el.progressText.textContent = "Pytanie " + state.index + " z " + state.length;
      el.progressFill.style.width = (state.index / state.length) * 100 + "%";
    } else {
      el.progressText.textContent = "Pytanie " + state.index + " (bez limitu)";
      el.progressFill.style.width = "100%";
    }
  }

  function submitAnswer() {
    if (state.answered) {
      // druga aktywacja = przejście do następnego pytania
      nextQuestion();
      return;
    }
    const raw = el.input.value;
    if (!raw.trim()) return;
    resolveQuestion(checkAnswer(state.current.item, raw));
  }

  // "Nie wiem" — pokazuje odpowiedź i zalicza jako błąd.
  function giveUp() {
    if (state.answered) return;
    el.input.value = state.current.item.romaji[0];
    resolveQuestion(false);
  }

  // Rozstrzyga bieżące pytanie: aktualizuje statystyki i feedback.
  function resolveQuestion(ok) {
    const q = state.current;
    const item = q.item;
    state.answered = true;
    el.input.disabled = true;
    el.dontKnowBtn.disabled = true;
    el.submitBtn.textContent = "Dalej →";

    if (ok) {
      state.stats.correct++;
      state.stats.streak++;
      el.input.className = "good";
      el.feedback.innerHTML =
        '<span class="ok">✔ Dobrze!</span> ' +
        '<span class="answer">' + item.reading + "</span>";
    } else {
      state.stats.wrong++;
      state.stats.streak = 0;
      state.mistakes.push(q);
      el.input.className = "bad";
      el.feedback.innerHTML =
        '<span class="no">✘ Błąd.</span> Poprawnie: ' +
        '<span class="answer">' + item.reading + "</span>" +
        "<small>" + item.romaji.join(" / ") + "</small>";
    }
    updateStats();
    el.submitBtn.focus();
  }

  function showResults() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    el.resultScore.textContent = state.stats.correct + " / " + total;
    el.resultAccuracy.textContent = "Celność: " + acc + "%";

    if (state.mistakes.length === 0) {
      el.resultDetail.innerHTML =
        '<p class="none">🎉 Bezbłędnie! Wszystkie odpowiedzi poprawne.</p>';
    } else {
      const rows = state.mistakes.map(function (q) {
        const numLabel = q.item.num === "?" ? "何" : q.item.num;
        return '<li><span class="r-q">' + numLabel + q.group.counter + '</span> → ' +
          '<span class="r-reading">' + q.item.reading + "</span> " +
          "<small>(" + q.item.romaji.join(" / ") + ")</small></li>";
      }).join("");
      el.resultDetail.innerHTML =
        "<h3>Do powtórki (" + state.mistakes.length + "):</h3><ul>" + rows + "</ul>";
    }

    el.quiz.classList.remove("active");
    el.results.classList.add("active");
  }

  function updateStats() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    el.sCorrect.textContent = state.stats.correct;
    el.sWrong.textContent = state.stats.wrong;
    el.sStreak.textContent = state.stats.streak;
    el.sAcc.textContent = acc + "%";
  }

  function quitQuiz() {
    el.quiz.classList.remove("active");
    el.setup.classList.add("active");
  }

  // --- Zdarzenia ---
  el.startBtn.addEventListener("click", startQuiz);
  el.quitBtn.addEventListener("click", quitQuiz);
  el.dontKnowBtn.addEventListener("click", giveUp);
  el.againBtn.addEventListener("click", startQuiz);
  el.backBtn.addEventListener("click", function () {
    el.results.classList.remove("active");
    el.setup.classList.add("active");
  });
  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitAnswer();
  });

  // --- Init ---
  loadSelection();
  renderGroups();
})();
