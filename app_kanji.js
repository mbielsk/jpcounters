// Tryb nauki kanji — osobny od trybu liczników.
// Trzy fazy: 1) wybór znaczenia, 2) uzupełnienie brakującego czytania,
// 3) wpisanie czytania kanji / złożenia.

(function () {
  "use strict";

  const STAGE_INFO = {
    1: "Faza 1 · Wybierz właściwe znaczenie",
    2: "Faza 2 · Uzupełnij brakujące czytanie",
    3: "Faza 3 · Wpisz czytanie kanji lub złożenia"
  };

  const state = {
    count: 10,
    stages: [1, 2, 3], // sekwencja faz w sesji (zależna od pominięć)
    firstStage: 1,     // pierwsza faza (do etykiet)
    stage: 1,
    session: [],   // wylosowane kanji na całą sesję (te same we wszystkich fazach)
    queue: [],     // pytania bieżącej fazy
    current: null,
    target: null,  // faza 2: { cat, reading }; faza 3: przykład { word, reading }
    correctMeaning: null, // faza 1: pokazane poprawne znaczenie
    answered: false,
    index: 0,
    mistakes: [],
    phaseResults: [], // wyniki ukończonych faz w bieżącej sesji
    stats: { correct: 0, wrong: 0, streak: 0 }
  };

  const PHASE_NAME = { 1: "znaczenie", 2: "czytanie", 3: "złożenia" };

  const el = {
    countersApp: document.getElementById("counters-app"),
    kanjiApp: document.getElementById("kanji-app"),
    modeCounters: document.getElementById("mode-counters"),
    modeKanji: document.getElementById("mode-kanji"),

    setup: document.getElementById("k-setup"),
    quiz: document.getElementById("k-quiz"),
    results: document.getElementById("k-results"),
    countSelect: document.getElementById("k-count"),
    skipStage1: document.getElementById("k-skip-stage1"),
    skipStage2: document.getElementById("k-skip-stage2"),
    startBtn: document.getElementById("k-start-btn"),
    available: document.getElementById("k-available"),
    preview: document.getElementById("k-preview"),
    modal: document.getElementById("k-modal"),
    modalBackdrop: document.getElementById("k-modal-backdrop"),
    modalClose: document.getElementById("k-modal-close"),
    modalBody: document.getElementById("k-modal-body"),

    progressText: document.getElementById("k-progress-text"),
    progressFill: document.getElementById("k-progress-fill"),
    stageHint: document.getElementById("k-stage-hint"),
    card: document.getElementById("k-card"),
    cardQuestion: document.getElementById("k-card-question"),
    readingHint: document.getElementById("k-reading-hint"),
    tiles: document.getElementById("k-tiles"),
    form: document.getElementById("k-answer-form"),
    input: document.getElementById("k-answer-input"),
    submitBtn: document.getElementById("k-submit-btn"),
    dontKnowBtn: document.getElementById("k-dontknow-btn"),
    quitBtn: document.getElementById("k-quit-btn"),
    feedback: document.getElementById("k-feedback"),
    nextBtn: document.getElementById("k-next-btn"),

    resultTitle: document.getElementById("k-result-title"),
    resultScore: document.getElementById("k-result-score"),
    resultAccuracy: document.getElementById("k-result-accuracy"),
    resultDetail: document.getElementById("k-result-detail"),
    resultActions: document.getElementById("k-result-actions"),

    sCorrect: document.getElementById("k-stat-correct"),
    sWrong: document.getElementById("k-stat-wrong"),
    sStreak: document.getElementById("k-stat-streak"),
    sAcc: document.getElementById("k-stat-accuracy")
  };

  // Przechowujemy tylko jawne decyzje użytkownika (pref[kanji] = true/false,
  // gdzie true = wyłączone). Stan efektywny to wybór użytkownika, a gdy go brak —
  // wartość domyślna z danych (defaultOff). Dzięki temu zmiana domyślnych w
  // data_kanji.js działa także dla osób, które już wcześniej otworzyły stronę.
  const PREF_KEY = "nihongo.kanji.pref";
  const pref = {};

  function loadExcluded() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach(function (k) { pref[k] = !!obj[k]; });
      }
    } catch (e) { /* ignorujemy */ }
  }
  function saveExcluded() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(pref));
    } catch (e) { /* ignorujemy */ }
  }
  function isExcluded(k) {
    return Object.prototype.hasOwnProperty.call(pref, k.kanji)
      ? pref[k.kanji]
      : !!k.defaultOff;
  }
  function selectedKanji() {
    return KANJI_LIST.filter(function (k) { return !isExcluded(k); });
  }
  function updateCounts() {
    el.available.textContent =
      "Dostępnych kanji: " + KANJI_LIST.length +
      " · Wybranych: " + selectedKanji().length +
      "  (prawy klik = wyłącz/włącz)";
  }

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

  // Porównuje odpowiedź użytkownika z oczekiwanym czytaniem (tolerancyjnie).
  function readingMatches(expected, raw) {
    const e = normalize(expected);
    const r = normalize(raw);
    if (e === r) return true;
    // zgodność po zredukowaniu podwojonych samogłosek (juu ↔ ju)
    return e.replace(/([aeiou])\1/g, "$1") === r.replace(/([aeiou])\1/g, "$1");
  }

  // --- Przełączanie trybów ---
  function showCounters() {
    el.modeCounters.classList.add("active");
    el.modeKanji.classList.remove("active");
    el.countersApp.hidden = false;
    el.kanjiApp.hidden = true;
  }
  function showKanji() {
    el.modeKanji.classList.add("active");
    el.modeCounters.classList.remove("active");
    el.kanjiApp.hidden = false;
    el.countersApp.hidden = true;
  }

  // --- Sterowanie sesją ---
  function startQuiz() {
    const available = selectedKanji();
    if (available.length === 0) {
      el.available.textContent = "Wybierz przynajmniej jedno kanji (prawy klik włącza z powrotem).";
      return;
    }
    state.count = parseInt(el.countSelect.value, 10) || 10;
    // zbuduj sekwencję faz na podstawie pominięć (faza 3 zawsze zostaje)
    const stages = [];
    if (!el.skipStage1.checked) stages.push(1);
    if (!el.skipStage2.checked) stages.push(2);
    stages.push(3);
    state.stages = stages;
    state.firstStage = stages[0];
    state.phaseResults = [];
    // losowy zestaw kanji na sesję (mniej, jeśli wybrano mniej znaków)
    state.session = shuffle(available).slice(0, state.count);
    startStage(state.firstStage);
  }

  function isLastStage() {
    return state.stages.indexOf(state.stage) === state.stages.length - 1;
  }
  function nextStageNum() {
    return state.stages[state.stages.indexOf(state.stage) + 1];
  }

  function startStage(n) {
    state.stage = n;
    state.stats = { correct: 0, wrong: 0, streak: 0 };
    state.mistakes = [];
    state.index = 0;
    state.current = null;
    // każda faza przechodzi przez te same kanji, w losowej kolejności
    state.queue = shuffle(state.session);
    updateStats();
    el.stageHint.textContent = STAGE_INFO[n];
    el.results.classList.remove("active");
    el.setup.classList.remove("active");
    el.quiz.classList.add("active");
    nextQuestion();
  }

  function nextQuestion() {
    if (state.index >= state.queue.length) {
      showResults();
      return;
    }
    state.answered = false;
    el.feedback.innerHTML = "";
    el.nextBtn.hidden = true;

    state.current = state.queue[state.index];
    state.index++;
    updateProgress();
    el.cardQuestion.textContent = state.current.kanji;

    if (state.stage === 1) renderMeaning();
    else if (state.stage === 2) renderReading();
    else renderCompound();
  }

  // --- Faza 1: znaczenie (kafle) ---
  function renderMeaning() {
    el.form.hidden = true;
    el.dontKnowBtn.hidden = true;
    el.readingHint.hidden = true;
    el.tiles.hidden = false;
    el.tiles.innerHTML = "";
    el.card.classList.remove("reading-mode");

    const k = state.current;
    // jedno poprawne znaczenie, nawet jeśli kanji ma ich kilka
    const correct = k.meanings[Math.floor(Math.random() * k.meanings.length)];
    state.correctMeaning = correct;

    // dystraktory: znaczenia innych kanji, nie kolidujące ze znaczeniami bieżącego
    const own = new Set(k.meanings);
    const pool = [];
    const seen = new Set();
    KANJI_LIST.forEach(function (other) {
      if (other === k) return;
      other.meanings.forEach(function (m) {
        if (!own.has(m) && !seen.has(m)) { seen.add(m); pool.push(m); }
      });
    });
    const distractors = shuffle(pool).slice(0, 2);
    const options = shuffle([correct].concat(distractors));

    options.forEach(function (m) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile tile-text";
      btn.textContent = m;
      if (m === correct) btn.dataset.correct = "1";
      btn.addEventListener("click", function () { answerTile(m === correct, btn); });
      el.tiles.appendChild(btn);
    });
  }

  // --- Faza 2: brakujące czytanie ---
  function renderReading() {
    el.tiles.hidden = true;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;
    el.readingHint.hidden = false;
    el.card.classList.remove("reading-mode");

    const k = state.current;
    // wszystkie sloty czytań z oznaczeniem kategorii
    const slots = k.onyomi.map(function (r) { return { cat: "on", reading: r }; })
      .concat(k.kunyomi.map(function (r) { return { cat: "kun", reading: r }; }));
    // losowy slot do uzupełnienia
    const target = slots[Math.floor(Math.random() * slots.length)];
    state.target = target;

    // renderuj wiersze onyomi / kunyomi, z jednym polem pustym
    function row(label, list, cat) {
      const parts = list.map(function (r) {
        if (!target._used && cat === target.cat && r === target.reading) {
          target._used = true;
          return '<span class="blank">?</span>';
        }
        return '<span class="read">' + r + "</span>";
      });
      if (list.length === 0) parts.push('<span class="read muted">—</span>');
      return '<div class="hint-row"><span class="hint-label">' + label + ":</span> " +
        parts.join(" · ") + "</div>";
    }
    // uwaga: dla powtarzających się identycznych czytań pusty slot trafia w pierwsze wystąpienie
    target._used = false;
    el.readingHint.innerHTML = row("onyomi", k.onyomi, "on") + row("kunyomi", k.kunyomi, "kun");

    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.input.placeholder = "Wpisz brakujące " + (target.cat === "on" ? "onyomi" : "kunyomi") + "…";
    el.submitBtn.textContent = "Sprawdź";
    el.input.focus();
  }

  // --- Faza 3: kanji / złożenie ---
  function renderCompound() {
    el.tiles.hidden = true;
    el.readingHint.hidden = true;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;
    el.card.classList.add("reading-mode");

    const k = state.current;
    const ex = k.examples[Math.floor(Math.random() * k.examples.length)];
    state.target = ex;
    el.cardQuestion.textContent = ex.word;

    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.input.placeholder = "Wpisz czytanie (rōmaji)…";
    el.submitBtn.textContent = "Sprawdź";
    el.input.focus();
  }

  // --- Obsługa odpowiedzi ---
  function answerTile(ok, btn) {
    if (state.answered) return;
    const buttons = el.tiles.querySelectorAll(".tile");
    buttons.forEach(function (b) {
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
    resolve(readingMatches(state.target.reading, raw), false);
  }

  function giveUp() {
    if (state.answered) return;
    el.input.value = state.target.reading;
    resolve(false, false);
  }

  // Zwięzły opis poprawnej odpowiedzi do feedbacku/podsumowania.
  function answerLabel() {
    const k = state.current;
    if (state.stage === 1) return k.kanji + " = " + state.correctMeaning;
    if (state.stage === 2) {
      const cat = state.target.cat === "on" ? "onyomi" : "kunyomi";
      return k.kanji + " · " + cat + ": " + state.target.reading;
    }
    return state.target.word + " = " + state.target.reading;
  }

  function resolve(ok, tileMode) {
    state.answered = true;
    if (ok) {
      state.stats.correct++;
      state.stats.streak++;
      el.feedback.innerHTML = '<span class="ok">✔ Dobrze!</span> ' +
        '<span class="answer">' + answerLabel() + "</span>";
    } else {
      state.stats.wrong++;
      state.stats.streak = 0;
      state.mistakes.push({ text: answerLabel() });
      el.feedback.innerHTML = '<span class="no">✘ Błąd.</span> ' +
        '<span class="answer">' + answerLabel() + "</span>";
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
    el.progressText.textContent =
      "Faza " + state.stage + " · Pytanie " + state.index + " z " + total;
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
    if (mistakes.length === 0) {
      return '<p class="none">🎉 Bezbłędnie! Wszystkie odpowiedzi poprawne.</p>';
    }
    const rows = mistakes.map(function (m) { return "<li>" + m.text + "</li>"; }).join("");
    return "<p class=\"muted-line\">Do powtórki (" + mistakes.length + "):</p><ul>" + rows + "</ul>";
  }

  function phaseSectionHtml(r) {
    return '<div class="phase-summary">' +
      "<h3>Faza " + r.stage + " — " + PHASE_NAME[r.stage] +
      ": " + r.correct + " / " + r.total + " (" + r.acc + "%)</h3>" +
      mistakesHtml(r.mistakes) + "</div>";
  }

  function showResults() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    const isLast = isLastStage();

    // zapisz wynik bieżącej fazy
    state.phaseResults.push({
      stage: state.stage,
      correct: state.stats.correct,
      total: total,
      acc: acc,
      mistakes: state.mistakes.slice()
    });

    if (isLast) {
      // łączny wynik ze wszystkich rozegranych faz + rozbicie na fazy
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
      again.textContent = "Nowy zestaw (od fazy " + state.firstStage + ")";
      again.addEventListener("click", startQuiz);
      el.resultActions.appendChild(again);
    }
    const back = document.createElement("button");
    back.className = "btn ghost";
    back.textContent = "← Zmień ustawienia";
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
  el.modeCounters.addEventListener("click", showCounters);
  el.modeKanji.addEventListener("click", showKanji);
  el.startBtn.addEventListener("click", startQuiz);
  el.quitBtn.addEventListener("click", quitQuiz);
  el.dontKnowBtn.addEventListener("click", giveUp);
  el.nextBtn.addEventListener("click", nextQuestion);
  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitAnswer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && state.answered && !el.nextBtn.hidden &&
        !el.kanjiApp.hidden) {
      e.preventDefault();
      nextQuestion();
    }
  });

  // --- Popup ze szczegółami kanji ---
  function openDetails(k, chip) {
    el.preview.querySelectorAll(".kanji-chip.selected").forEach(function (c) {
      c.classList.remove("selected");
    });
    chip.classList.add("selected");

    const readingRow = function (label, list) {
      const val = list.length ? list.join(", ") : "—";
      return '<div class="detail-row"><span class="detail-label">' + label +
        ':</span> <span class="detail-val">' + val + "</span></div>";
    };
    const examples = k.examples.map(function (ex) {
      return "<li><span class=\"ex-word\">" + ex.word +
        "</span> — <span class=\"ex-reading\">" + ex.reading + "</span></li>";
    }).join("");

    el.modalBody.innerHTML =
      '<div class="detail-kanji">' + k.kanji + "</div>" +
      '<div class="detail-meanings">' + k.meanings.join(", ") + "</div>" +
      readingRow("onyomi", k.onyomi) +
      readingRow("kunyomi", k.kunyomi) +
      '<h3 class="detail-h">Złożenia</h3><ul class="detail-examples">' + examples + "</ul>";

    el.modal.hidden = false;
  }

  function closeDetails() {
    el.modal.hidden = true;
    el.preview.querySelectorAll(".kanji-chip.selected").forEach(function (c) {
      c.classList.remove("selected");
    });
  }

  el.modalClose.addEventListener("click", closeDetails);
  el.modalBackdrop.addEventListener("click", closeDetails);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !el.modal.hidden) closeDetails();
  });

  // --- Init ---
  loadExcluded();
  KANJI_LIST.forEach(function (k) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "kanji-chip";
    chip.textContent = k.kanji;
    chip.title = k.meanings.join(", ") + " (prawy klik: wyłącz/włącz z testów)";
    if (isExcluded(k)) chip.classList.add("excluded");
    // lewy klik: szczegóły
    chip.addEventListener("click", function () { openDetails(k, chip); });
    // prawy klik: wyłącz/włącz z testów
    chip.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      const nowExcluded = !isExcluded(k);
      pref[k.kanji] = nowExcluded;
      chip.classList.toggle("excluded", nowExcluded);
      saveExcluded();
      updateCounts();
    });
    el.preview.appendChild(chip);
  });
  updateCounts();
})();
