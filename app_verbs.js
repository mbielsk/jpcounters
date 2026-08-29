// Tryb nauki czasowników — osobny od trybów liczników i kanji.
// Trzy fazy: 1) wybór znaczenia, 2) forma grzecznościowa ~masu,
// 3) wskazana forma (przeczenie / czas przeszły / przeczenie czasu przeszłego).

(function () {
  "use strict";

  // --- Ujednolicony przełącznik trybów (obsługuje wszystkie trzy zakładki) ---
  const apps = {
    counters: document.getElementById("counters-app"),
    kanji: document.getElementById("kanji-app"),
    verbs: document.getElementById("verbs-app")
  };
  const modeBtns = {
    counters: document.getElementById("mode-counters"),
    kanji: document.getElementById("mode-kanji"),
    verbs: document.getElementById("mode-verbs")
  };
  function switchMode(mode) {
    Object.keys(apps).forEach(function (m) {
      apps[m].hidden = (m !== mode);
      modeBtns[m].classList.toggle("active", m === mode);
    });
  }
  modeBtns.counters.addEventListener("click", function () { switchMode("counters"); });
  modeBtns.kanji.addEventListener("click", function () { switchMode("kanji"); });
  modeBtns.verbs.addEventListener("click", function () { switchMode("verbs"); });

  // --- Konfiguracja faz ---
  const STAGE_INFO = {
    1: "Faza 1 · Wybierz znaczenie bezokolicznika",
    2: "Faza 2 · Odmień na formę grzecznościową (~masu)",
    3: "Faza 3 · Podaj wskazaną formę"
  };
  const PHASE_NAME = { 1: "znaczenie", 2: "forma ~masu", 3: "formy" };

  // Formy fazy 3 (dołączane do rdzenia ~masu).
  const FORMS3 = [
    { label: "przeczenie", suffix: "masen" },
    { label: "czas przeszły", suffix: "mashita" },
    { label: "przeczenie czasu przeszłego", suffix: "masendeshita" }
  ];

  const state = {
    count: 10,
    stages: [1, 2, 3],
    firstStage: 1,
    stage: 1,
    session: [],
    queue: [],
    current: null,
    target: null,   // faza 2/3: oczekiwana odpowiedź (string) + etykieta
    correctMeaning: null,
    answered: false,
    index: 0,
    mistakes: [],
    phaseResults: [],
    stats: { correct: 0, wrong: 0, streak: 0 }
  };

  const el = {
    setup: document.getElementById("v-setup"),
    quiz: document.getElementById("v-quiz"),
    results: document.getElementById("v-results"),
    countSelect: document.getElementById("v-count"),
    skipStage1: document.getElementById("v-skip-stage1"),
    startBtn: document.getElementById("v-start-btn"),
    available: document.getElementById("v-available"),

    progressText: document.getElementById("v-progress-text"),
    progressFill: document.getElementById("v-progress-fill"),
    stageHint: document.getElementById("v-stage-hint"),
    card: document.getElementById("v-card"),
    cardQuestion: document.getElementById("v-card-question"),
    cardSub: document.getElementById("v-card-sub"),
    prompt: document.getElementById("v-prompt"),
    tiles: document.getElementById("v-tiles"),
    form: document.getElementById("v-answer-form"),
    input: document.getElementById("v-answer-input"),
    submitBtn: document.getElementById("v-submit-btn"),
    dontKnowBtn: document.getElementById("v-dontknow-btn"),
    quitBtn: document.getElementById("v-quit-btn"),
    feedback: document.getElementById("v-feedback"),
    nextBtn: document.getElementById("v-next-btn"),

    resultTitle: document.getElementById("v-result-title"),
    resultScore: document.getElementById("v-result-score"),
    resultAccuracy: document.getElementById("v-result-accuracy"),
    resultDetail: document.getElementById("v-result-detail"),
    resultActions: document.getElementById("v-result-actions"),

    sCorrect: document.getElementById("v-stat-correct"),
    sWrong: document.getElementById("v-stat-wrong"),
    sStreak: document.getElementById("v-stat-streak"),
    sAcc: document.getElementById("v-stat-accuracy"),
    preview: document.getElementById("v-preview")
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
    return s.toLowerCase().trim().replace(/[\s'’\-]/g, "");
  }
  function matches(expected, raw) {
    return normalize(expected) === normalize(raw);
  }

  function isLastStage() {
    return state.stages.indexOf(state.stage) === state.stages.length - 1;
  }
  function nextStageNum() {
    return state.stages[state.stages.indexOf(state.stage) + 1];
  }

  // --- Sterowanie sesją ---
  function startQuiz() {
    state.count = parseInt(el.countSelect.value, 10) || 10;
    const stages = [];
    if (!el.skipStage1.checked) stages.push(1);
    stages.push(2);
    stages.push(3);
    state.stages = stages;
    state.firstStage = stages[0];
    state.phaseResults = [];
    state.session = shuffle(VERB_LIST).slice(0, state.count);
    startStage(state.firstStage);
  }

  function startStage(n) {
    state.stage = n;
    state.stats = { correct: 0, wrong: 0, streak: 0 };
    state.mistakes = [];
    state.index = 0;
    state.current = null;
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
    el.cardQuestion.textContent = state.current.hiragana;
    el.cardSub.textContent = state.current.romaji;

    if (state.stage === 1) renderMeaning();
    else if (state.stage === 2) renderMasu();
    else renderForm3();
  }

  // --- Faza 1: znaczenie (kafle) ---
  function renderMeaning() {
    el.form.hidden = true;
    el.dontKnowBtn.hidden = true;
    el.prompt.hidden = true;
    el.tiles.hidden = false;
    el.tiles.innerHTML = "";

    const v = state.current;
    state.correctMeaning = v.meaning;

    const pool = [];
    const seen = new Set([v.meaning]);
    VERB_LIST.forEach(function (o) {
      if (!seen.has(o.meaning)) { seen.add(o.meaning); pool.push(o.meaning); }
    });
    const distractors = shuffle(pool).slice(0, 2);
    const options = shuffle([v.meaning].concat(distractors));

    options.forEach(function (m) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile tile-text";
      btn.textContent = m;
      if (m === v.meaning) btn.dataset.correct = "1";
      btn.addEventListener("click", function () { answerTile(m === v.meaning, btn); });
      el.tiles.appendChild(btn);
    });
  }

  // --- Faza 2: forma ~masu ---
  function renderMasu() {
    el.tiles.hidden = true;
    el.prompt.hidden = false;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;

    state.target = { answer: state.current.stem + "masu", label: "forma ~masu" };
    el.prompt.textContent = "Podaj formę grzecznościową (~masu)";
    resetInput("Wpisz formę ~masu…");
  }

  // --- Faza 3: wskazana forma ---
  function renderForm3() {
    el.tiles.hidden = true;
    el.prompt.hidden = false;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;

    const form = FORMS3[Math.floor(Math.random() * FORMS3.length)];
    state.target = { answer: state.current.stem + form.suffix, label: form.label };
    el.prompt.innerHTML = "Podaj: <b>" + form.label + "</b>";
    resetInput("Wpisz odpowiedź…");
  }

  function resetInput(placeholder) {
    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.input.placeholder = placeholder;
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
    resolve(matches(state.target.answer, raw), false);
  }

  function giveUp() {
    if (state.answered) return;
    el.input.value = state.target.answer;
    resolve(false, false);
  }

  function answerLabel() {
    const v = state.current;
    if (state.stage === 1) return v.hiragana + " = " + state.correctMeaning;
    if (state.stage === 2) return v.romaji + " → " + state.target.answer;
    return v.romaji + " → " + state.target.label + ": " + state.target.answer;
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

    state.phaseResults.push({
      stage: state.stage,
      correct: state.stats.correct,
      total: total,
      acc: acc,
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
        !apps.verbs.hidden) {
      e.preventDefault();
      nextQuestion();
    }
  });

  // --- Init ---
  el.available.textContent = "Dostępnych czasowników: " + VERB_LIST.length;
  VERB_LIST.forEach(function (v) {
    const chip = document.createElement("div");
    chip.className = "verb-chip";
    chip.innerHTML =
      '<span class="verb-chip-hira">' + v.hiragana + "</span>" +
      '<span class="verb-chip-meaning">' + v.meaning + "</span>";
    chip.title = v.romaji;
    el.preview.appendChild(chip);
  });
})();
