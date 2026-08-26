// Counters Pro — quiz japońskich liczników.
// Cała logika po stronie klienta, bez zależności. Gotowe pod GitHub Pages.

(function () {
  "use strict";

  const STORAGE_KEY = "counterspro.selected";

  // --- Stan ---
  const state = {
    selected: new Set(),   // id grup
    mode: "romaji",        // romaji | hiragana | any
    perStage: 10,          // liczba pytań w każdej fazie
    stage: 1,              // aktualna faza: 1 | 2 | 3
    pool: [],              // aktywne pytania
    queue: [],             // pytania w bieżącej fazie (bez powtórek)
    current: null,
    answered: false,       // czy bieżące pytanie zostało sprawdzone
    index: 0,              // numer bieżącego pytania w fazie
    mistakes: [],          // lista błędnie odpowiedzianych pytań w fazie
    stats: { correct: 0, wrong: 0, streak: 0 }
  };

  const STAGE_INFO = {
    1: "Faza 1 · Zobacz czytanie, wybierz właściwą liczbę",
    2: "Faza 2 · Zobacz kanji, wybierz właściwe czytanie",
    3: "Faza 3 · Wpisz czytanie z pamięci"
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
    stageHint: document.getElementById("stage-hint"),
    dontKnowBtn: document.getElementById("dontknow-btn"),
    tiles: document.getElementById("tiles"),
    nextBtn: document.getElementById("next-btn"),
    resultTitle: document.getElementById("result-title"),
    resultScore: document.getElementById("result-score"),
    resultAccuracy: document.getElementById("result-accuracy"),
    resultDetail: document.getElementById("result-detail"),
    resultActions: document.getElementById("result-actions"),
    cardCounter: document.getElementById("card-counter"),
    cardQuestion: document.getElementById("card-question"),
    card: document.getElementById("card"),
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

  // --- Helpery ---
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Liczba prezentowana w kanji (np. 二人, 十一時, 二十日).
  // Opcjonalne pole item.label nadpisuje etykietę (np. 十 albo 幾つ,
  // które nie doklejają licznika).
  function numLabel(q) {
    return q.item.label || (q.item.kanji + q.group.counter);
  }

  // Klucz "pytania" dla danej fazy — służy do usuwania powtórek w kolejce.
  function questionKey(q) {
    if (state.stage === 1) return q.item.reading;      // faza 1: pytanie to czytanie
    return q.group.id + "|" + q.item.num;              // faza 2/3: pytanie to kanji
  }

  // Tekst czytania zależnie od trybu (romaji vs hiragana).
  function displayReading(q) {
    return state.mode === "romaji" ? q.item.romaji[0] : q.item.reading;
  }

  // Zwraca listę pytań z unikalnymi kluczami (deduplikacja np. wariantów czytań).
  function uniqueByKey(list, keyFn) {
    const seen = new Set();
    const out = [];
    list.forEach(function (q) {
      const k = keyFn(q);
      if (!seen.has(k)) { seen.add(k); out.push(q); }
    });
    return out;
  }

  // Buduje kolejkę pytań na fazę z proporcjonalnym udziałem grup.
  // Przy G grupach każda dostaje ~ perStage/G pytań; reszta z dzielenia
  // rozdzielana jest losowo, a niewykorzystane miejsca (gdy grupa ma za
  // mało unikalnych pytań) przechodzą do grup z zapasem.
  function buildStageQueue() {
    const unique = uniqueByKey(state.pool, questionKey);
    const byGroup = {};
    const groupIds = [];
    unique.forEach(function (q) {
      const id = q.group.id;
      if (!byGroup[id]) { byGroup[id] = []; groupIds.push(id); }
      byGroup[id].push(q);
    });

    const G = groupIds.length;
    const N = state.perStage;
    if (G === 0) return [];

    const shuffledIds = shuffle(groupIds);
    const base = Math.floor(N / G);
    let remainder = N % G;
    const alloc = {};
    shuffledIds.forEach(function (id) {
      alloc[id] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    });

    // ogranicz do dostępnych pytań i policz niewykorzystane miejsca
    let deficit = 0;
    groupIds.forEach(function (id) {
      const cap = byGroup[id].length;
      if (alloc[id] > cap) { deficit += alloc[id] - cap; alloc[id] = cap; }
    });

    // rozdziel deficyt do grup z zapasem (round-robin)
    let progress = true;
    while (deficit > 0 && progress) {
      progress = false;
      for (let i = 0; i < shuffledIds.length && deficit > 0; i++) {
        const id = shuffledIds[i];
        if (alloc[id] < byGroup[id].length) {
          alloc[id]++;
          deficit--;
          progress = true;
        }
      }
    }

    let queue = [];
    groupIds.forEach(function (id) {
      queue = queue.concat(shuffle(byGroup[id]).slice(0, alloc[id]));
    });
    return shuffle(queue);
  }

  // Buduje 3 opcje (poprawną + 2 dystraktory), preferując tę samą grupę.
  function buildOptions(correct, keyFn) {
    const correctKey = keyFn(correct);
    const candidates = uniqueByKey(
      state.pool.filter(function (q) { return keyFn(q) !== correctKey; }),
      keyFn
    );
    const same = shuffle(candidates.filter(function (q) {
      return q.group.id === correct.group.id;
    }));
    const diff = shuffle(candidates.filter(function (q) {
      return q.group.id !== correct.group.id;
    }));
    const distractors = same.concat(diff).slice(0, 2);
    return shuffle([correct].concat(distractors));
  }

  // --- Sterowanie fazami ---
  function startQuiz() {
    state.mode = el.modeSelect.value;
    state.perStage = parseInt(el.lengthSelect.value, 10) || 10;
    state.pool = buildPool();
    startStage(1);
  }

  function startStage(n) {
    state.stage = n;
    state.stats = { correct: 0, wrong: 0, streak: 0 };
    state.mistakes = [];
    state.index = 0;
    state.current = null;
    // Kolejka bez powtórek, z proporcjonalnym udziałem wybranych grup.
    state.queue = buildStageQueue();
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

    const pick = state.queue[state.index];
    state.current = pick;
    state.index++;
    updateProgress();
    el.cardCounter.textContent = pick.group.counter;
    el.cardCounter.style.color = pick.group.color;

    if (state.stage === 3) {
      renderTypeQuestion(pick);
    } else {
      renderTileQuestion(pick);
    }
  }

  // Faza 3: wpisywanie odpowiedzi.
  function renderTypeQuestion(pick) {
    el.tiles.hidden = true;
    el.form.hidden = false;
    el.dontKnowBtn.hidden = false;
    el.dontKnowBtn.disabled = false;
    el.card.classList.remove("reading-mode");
    el.cardQuestion.textContent = numLabel(pick);
    el.input.value = "";
    el.input.className = "";
    el.input.disabled = false;
    el.submitBtn.textContent = "Sprawdź";
    el.input.focus();
  }

  // Faza 1 i 2: wybór spośród 3 kafli.
  function renderTileQuestion(pick) {
    el.form.hidden = true;
    el.dontKnowBtn.hidden = true;
    el.tiles.hidden = false;
    el.tiles.innerHTML = "";

    let options, keyFn, questionText, tileText;
    if (state.stage === 1) {
      // pytanie = czytanie; kafle = liczba+licznik
      keyFn = function (q) { return q.group.id + "|" + q.item.num; };
      questionText = displayReading(pick);
      tileText = numLabel;
      el.card.classList.add("reading-mode");
    } else {
      // pytanie = kanji; kafle = czytanie
      keyFn = function (q) { return q.item.reading; };
      questionText = numLabel(pick);
      tileText = displayReading;
      el.card.classList.remove("reading-mode");
    }

    el.cardQuestion.textContent = questionText;
    options = buildOptions(pick, keyFn);
    options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.textContent = tileText(opt);
      if (opt === pick) btn.dataset.correct = "1";
      btn.addEventListener("click", function () {
        answerTile(opt, btn);
      });
      el.tiles.appendChild(btn);
    });
  }

  function answerTile(chosen, btn) {
    if (state.answered) return;
    const ok = chosen === state.current;
    // oznacz kafle: poprawny na zielono, błędny wybór na czerwono
    const buttons = el.tiles.querySelectorAll(".tile");
    buttons.forEach(function (b) {
      b.disabled = true;
      if (b.dataset.correct === "1") b.classList.add("correct");
    });
    if (!ok) btn.classList.add("wrong");

    resolveQuestion(ok, true);
  }

  function submitAnswer() {
    if (state.answered) {
      nextQuestion();
      return;
    }
    const raw = el.input.value;
    if (!raw.trim()) return;
    resolveQuestion(checkAnswer(state.current.item, raw), false);
  }

  // "Nie wiem" (tylko faza 3) — pokazuje odpowiedź i zalicza jako błąd.
  function giveUp() {
    if (state.answered || state.stage !== 3) return;
    el.input.value = state.current.item.romaji[0];
    resolveQuestion(false, false);
  }

  // Rozstrzyga bieżące pytanie: statystyki + feedback.
  function resolveQuestion(ok, tileMode) {
    const q = state.current;
    const item = q.item;
    state.answered = true;

    if (ok) {
      state.stats.correct++;
      state.stats.streak++;
      el.feedback.innerHTML =
        '<span class="ok">✔ Dobrze!</span> ' +
        '<span class="answer">' + numLabel(q) + " = " + item.reading + "</span>";
    } else {
      state.stats.wrong++;
      state.stats.streak = 0;
      state.mistakes.push(q);
      el.feedback.innerHTML =
        '<span class="no">✘ Błąd.</span> Poprawnie: ' +
        '<span class="answer">' + numLabel(q) + " = " + item.reading + "</span>" +
        "<small>" + item.romaji.join(" / ") + "</small>";
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

  function showResults() {
    const total = state.stats.correct + state.stats.wrong;
    const acc = total === 0 ? 100 : Math.round((state.stats.correct / total) * 100);
    const isLast = state.stage === 3;

    el.resultTitle.textContent = isLast
      ? "Koniec — ukończono wszystkie fazy!"
      : "Koniec fazy " + state.stage + "!";
    el.resultScore.textContent = state.stats.correct + " / " + total;
    el.resultAccuracy.textContent = "Celność: " + acc + "%";

    if (state.mistakes.length === 0) {
      el.resultDetail.innerHTML =
        '<p class="none">🎉 Bezbłędnie! Wszystkie odpowiedzi poprawne.</p>';
    } else {
      const rows = state.mistakes.map(function (q) {
        return '<li><span class="r-q">' + numLabel(q) + '</span> → ' +
          '<span class="r-reading">' + q.item.reading + "</span> " +
          "<small>(" + q.item.romaji.join(" / ") + ")</small></li>";
      }).join("");
      el.resultDetail.innerHTML =
        "<h3>Do powtórki (" + state.mistakes.length + "):</h3><ul>" + rows + "</ul>";
    }

    renderResultActions(isLast);
    el.quiz.classList.remove("active");
    el.results.classList.add("active");
  }

  function renderResultActions(isLast) {
    el.resultActions.innerHTML = "";
    if (!isLast) {
      const next = document.createElement("button");
      next.className = "btn primary";
      next.textContent = "Faza " + (state.stage + 1) + " →";
      next.addEventListener("click", function () { startStage(state.stage + 1); });
      el.resultActions.appendChild(next);
    } else {
      const again = document.createElement("button");
      again.className = "btn primary";
      again.textContent = "Zagraj ponownie (od fazy 1)";
      again.addEventListener("click", function () { startStage(1); });
      el.resultActions.appendChild(again);
    }
    const back = document.createElement("button");
    back.className = "btn ghost";
    back.textContent = "← Zmień grupy";
    back.addEventListener("click", function () {
      el.results.classList.remove("active");
      el.setup.classList.add("active");
    });
    el.resultActions.appendChild(back);
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
  el.nextBtn.addEventListener("click", nextQuestion);
  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitAnswer();
  });
  // W fazach z kaflami Enter przechodzi do kolejnego pytania po odpowiedzi.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && state.answered && !el.nextBtn.hidden) {
      e.preventDefault();
      nextQuestion();
    }
  });

  // --- Init ---
  loadSelection();
  renderGroups();
})();
