"use strict";

const app = document.querySelector("#app");
const settings = document.querySelector("#settings");
const demo = { ...readBankFile(demoText), name: "Demo databanka", custom: false };
const modes = {
  truth: { title: "Pravda / lež", hint: "Posuzuj jednotlivá tvrzení a hned zjisti, jestli máš pravdu.", icon: "±", select: true },
  practice: { title: "Trénink kapitol", hint: "Vyber si kapitoly a v každé najdi dvě pravdivá tvrzení z pěti.", icon: "≡", select: true },
  choose: { title: "CHOOSE 2", hint: "Dvě pravdivá tvrzení z pěti. Test ze všech kapitol.", icon: "✓" },
  multi: { title: "MULTI-CHOICE", hint: "Jedno až čtyři pravdivá tvrzení ze čtyř. Test ze všech kapitol.", icon: "⊞" },
};
const fonts = {
  consolas: "Consolas, monospace",
  arial: "Arial, sans-serif",
  calibri: "Calibri, sans-serif",
  verdana: "Verdana, sans-serif",
  trebuchet: "'Trebuchet MS', sans-serif",
};
const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("cs-CZ", { style: "percent", maximumFractionDigits: 1 });
let source = demo;
let screen = "home";
let run;
let error = "";
let importVersion = 0;

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function plural(count, forms) {
  return count === 1 ? forms[0] : count >= 2 && count <= 4 ? forms[1] : forms[2];
}

function button(action, label, style = "outline", attrs = "") {
  return `<button type="button" class="button ${style}" data-action="${action}" ${attrs}>${label}</button>`;
}

function warning() {
  return error ? `<p class="warning" role="alert">${escapeText(error)}</p>` : "";
}

function homeView() {
  const chapterCount = source.chapters.length;
  const statements = source.chapters.flatMap(chapter => [...chapter.OK, ...chapter.NOK]);
  const practiced = statements.filter(option => source.practiced.has(option.id)).length;
  return `
    <section class="hero">
      <div class="hero-copy">
        <h1 tabindex="-1">Kvíz na<br><em>procvičování</em></h1>
        <p>Vyber si trénink po kapitolách nebo si vyzkoušej test nanečisto.</p>
      </div>
      <aside class="bank" aria-labelledby="bank-title">
        <div class="bank-top"><span class="status-dot"></span> Aktivní databanka</div>
        <h2 id="bank-title">${escapeText(source.name)}</h2>
        <p>${chapterCount} ${plural(chapterCount, ["kapitola", "kapitoly", "kapitol"])} <span class="separator">/</span> ${statements.length} tvrzení</p>
        <p>Procvičeno <strong>${practiced} z ${statements.length}</strong></p>
        <div class="bank-actions">
          ${button("import", "↑ &nbsp; Načíst vlastní TXT", "primary")}
          ${button("export", "Stáhnout TXT s pokrokem")}
          ${source.custom ? button("demo", "Použít demo", "quiet") : ""}
          <input type="file" id="bank-file" accept=".txt,text/plain" hidden>
        </div>
        <small>Soubor zůstává v prohlížeči. Pro příště si stáhni kopii s pokrokem.</small>
      </aside>
    </section>
    ${warning()}
    <section class="mode-section" aria-labelledby="mode-title">
      <div class="section-head">
        <h2 id="mode-title">Režimy kvízu</h2>
        <p>Hranice úspěšnosti <strong>${PASS_PERCENT} %</strong></p>
      </div>
      <div class="mode-grid">
        ${Object.entries(modes).map(([id, mode], index) => `
          <button type="button" class="mode-card" data-action="mode" data-mode="${id}" data-shortcut="${index + 1}">
            <span class="mode-top">
              <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
              <kbd aria-hidden="true">${index + 1}</kbd>
            </span>
            <strong>${mode.title}</strong>
            <span class="mode-hint">${mode.hint}</span>
          </button>`).join("")}
      </div>
    </section>`;
}

function panel(title, content, back = "home", backLabel = "← Režimy kvízu") {
  return `<section class="workspace">
    ${button(back, backLabel, "quiet back")}
    <div class="panel"><h1 tabindex="-1">${title}</h1>${content}</div>
  </section>`;
}

function chaptersView() {
  return panel(modes[run.mode].title, `
    <p class="muted">Vyber kapitoly k procvičení.</p>
    <p class="key-hint"><kbd>↑</kbd> <kbd>↓</kbd> pohyb · <kbd>Mezerník</kbd> výběr</p>
    ${warning()}
    <div class="chapter-actions">${button("all", "Vybrat vše", "quiet")}${button("none", "Zrušit výběr", "quiet")}</div>
    <div class="options" role="group" aria-label="Kapitoly">
      ${source.chapters.map((chapter, index) => `
        <label class="option"><input type="checkbox" data-chapter="${index}" ${run.chapters.has(index) ? "checked" : ""}>
        <span><span class="chapter-id">${chapter.id}.</span> ${escapeText(chapter.title)}</span></label>`).join("")}
    </div>
    <div class="actions">${button("start", "Spustit trénink", "primary", run.chapters.size ? "" : "disabled")}</div>`);
}

function progress(index, length, label) {
  return `<div class="progress-meta"><span>${label} ${index + 1} z ${length}</span></div>
    <progress aria-label="${label}" value="${index + 1}" max="${length}"></progress>`;
}

function truthView() {
  const card = run.cards[run.index];
  const answered = run.guess !== undefined;
  const nextLabel = run.index + 1 === run.cards.length ? "Zobrazit výsledek" : "Další tvrzení →";
  return panel(modes.truth.title, `
    ${progress(run.index, run.cards.length, "Tvrzení")}
    <p class="key-hint"><kbd>1</kbd> pravda · <kbd>2</kbd> lež · <kbd>↑</kbd> <kbd>↓</kbd> pohyb · <kbd>Mezerník</kbd> potvrdit · <kbd>→</kbd> pokračovat</p>
    <p class="eyebrow">Kapitola ${card.chapter.id} · ${escapeText(card.chapter.title)}</p>
    <h2 class="statement" tabindex="-1">${escapeText(card.text)}</h2>
    ${answered ? `
      <p class="feedback ${run.guess === card.truth ? "good" : "bad"}" role="status">
        ${run.guess === card.truth ? "Správně." : "Chybně."} Tvrzení je ${card.truth ? "pravdivé" : "nepravdivé"}.
      </p>
      <div class="actions">${button("next-truth", nextLabel, "primary")}</div>
    ` : `<div class="actions truth-actions">
      ${button("true", "Pravda", "primary", 'data-truth-choice data-shortcut="1"')}
      ${button("false", "Lež", "outline", 'data-truth-choice data-shortcut="2"')}
      ${button("next-truth", "Přeskočit →", "quiet push")}
    </div>`}`);
}

function questionView(review = false) {
  const question = run.questions[run.index];
  const multi = run.mode === "multi";
  const { scores, maximum } = run.result ?? {};
  const title = review ? `Kontrola odpovědí · ${modes[run.mode].title}` : modes[run.mode].title;
  return panel(title, `
    ${progress(run.index, run.questions.length, "Otázka")}
    <p class="key-hint">
      ${review ? "" : `<kbd>1</kbd>–<kbd>${question.options.length}</kbd> výběr · <kbd>↑</kbd> <kbd>↓</kbd> pohyb · <kbd>Mezerník</kbd> výběr ·`}
      <kbd>←</kbd> <kbd>→</kbd> otázky
    </p>
    <p class="eyebrow">Kapitola ${question.chapter.id} · ${escapeText(question.chapter.title)}</p>
    <h2 class="statement">${review ? `Získané body ${number.format(scores[run.index])} / ${maximum}` :
      multi ? "Označ všechna pravdivá tvrzení" : "Označ dvě pravdivá tvrzení"}</h2>
    <div class="options" role="group" aria-label="Možnosti odpovědi">
      ${question.options.map(({ text, truth }, index) => {
        const checked = question.selected.has(index);
        return review ? `
          <div class="option review ${truth === checked ? "good" : "bad"}">
            <span aria-hidden="true">${truth === checked ? "✓" : "×"}</span>
            <span>${escapeText(text)}<small>${truth ? "Pravda" : "Lež"} · ${checked ? "Označeno" : "Neoznačeno"}</small></span>
          </div>` : `
          <label class="option">
            <input type="checkbox" data-option="${index}" data-shortcut="${index + 1}" ${checked ? "checked" : ""}>
            <kbd aria-hidden="true">${index + 1}</kbd>
            <span>${escapeText(text)}</span>
          </label>`;
      }).join("")}
    </div>
    <div class="actions">
      ${button("previous", "← Předchozí", "outline", run.index === 0 ? "disabled" : "")}
      ${button("next", "Další →", "outline", run.index + 1 === run.questions.length ? "disabled" : "")}
      ${review ? "" : button("submit", "Vyhodnotit", "primary push")}
    </div>`, review ? "results" : "home", review ? "← Výsledky" : "← Režimy kvízu");
}

function resultView() {
  const truth = run.mode === "truth";
  const { scores, maximum, total, percent: value } = run.result;
  const passed = value >= PASS_PERCENT;
  return panel(`Výsledky · ${modes[run.mode].title}`, `
    <div class="score-summary">
      <strong>${percent.format(value / 100)}</strong>
      <span class="verdict ${passed ? "good" : "bad"}">${passed ? "Splněno" : "Nesplněno"}</span>
      <p>${truth ? "Správné odpovědi" : "Získané body"} ${number.format(total)} / ${maximum * (run.questions?.length ?? 1)} · hranice ${PASS_PERCENT} %</p>
    </div>
    ${truth ? `<p class="muted">Přeskočená tvrzení ${run.cards.length - run.attempted}</p>` : `
      <h2>Body podle kapitol</h2>
      <div class="options">${run.questions.map(({ chapter }, index) => `
        <button class="option result-row" type="button" data-action="review" data-index="${index}">
          <span><span class="chapter-id">${chapter.id}.</span> ${escapeText(chapter.title)}</span>
          <strong>${number.format(scores[index])} / ${maximum} <span aria-hidden="true">↗</span></strong>
        </button>`).join("")}</div>
    `}
    <div class="actions">
      ${button("repeat", "Nový pokus", "primary")}
      ${truth ? "" : button("review", "Zkontrolovat odpovědi")}
      ${button("export", "Stáhnout TXT s pokrokem")}
    </div>`);
}

function render(focus = true) {
  const views = {
    home: homeView, chapters: chaptersView, truth: truthView,
    questions: questionView, results: resultView, review: () => questionView(true),
  };
  app.innerHTML = views[screen]();
  if (focus) app.querySelector("h1").focus();
}

function start(chapters) {
  try {
    run.activeChapters = chapters;
    run.index = 0;
    if (run.mode === "truth") {
      run.cards = truthCards(chapters, source.practiced);
      if (!run.cards.length) throw new Error("Ve vybraných kapitolách nejsou žádná tvrzení.");
      run.attempted = run.correct = 0;
      run.guess = undefined;
      screen = "truth";
    } else {
      run.questions = buildQuestions(chapters, run.mode === "multi", source.practiced);
      screen = "questions";
    }
  } catch (problem) {
    error = problem.message;
  }
}

function chooseMode(mode) {
  importVersion++;
  run = { mode, chapters: new Set(), index: 0 };
  if (modes[mode].select) screen = "chapters";
  else start(source.chapters);
}

async function importBank(file) {
  const version = ++importVersion;
  try {
    const bank = readBankFile(await file.text());
    if (version !== importVersion) return;
    source = { ...bank, name: file.name, custom: true };
    error = "";
  } catch (problem) {
    if (version !== importVersion) return;
    error = `Databanku se nepodařilo načíst. ${problem.message}`;
  }
  render();
}

function downloadBank() {
  const filename = source.custom ? source.name.replace(/(?:-s-pokrokem)?\.txt$/i, "") : "demo";
  const url = URL.createObjectURL(new Blob([writeBankFile(source)], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-s-pokrokem.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

document.addEventListener("click", event => {
  const control = event.target.closest("button[data-action]");
  if (!control) return;
  const { action, mode, index } = control.dataset;
  if (action === "settings") {
    settings.showModal();
    return;
  }
  if (action === "import") {
    app.querySelector("#bank-file").click();
    return;
  }
  if (action === "export") {
    downloadBank();
    return;
  }
  error = "";
  switch (action) {
    case "home":
      importVersion++;
      screen = "home";
      run = undefined;
      break;
    case "demo":
      importVersion++;
      source = demo;
      break;
    case "mode":
      chooseMode(mode);
      break;
    case "all":
      run.chapters = new Set(source.chapters.keys());
      break;
    case "none":
      run.chapters.clear();
      break;
    case "start":
      start(source.chapters.filter((_, i) => run.chapters.has(i)));
      break;
    case "true":
    case "false":
      run.guess = action === "true";
      run.attempted++;
      run.correct += Number(run.guess === run.cards[run.index].truth);
      markPracticed(source.practiced, [run.cards[run.index]]);
      render(false);
      app.querySelector('[data-action="next-truth"]').focus();
      return;
    case "next-truth":
      run.index++;
      run.guess = undefined;
      if (run.index === run.cards.length) {
        run.result = {
          maximum: run.attempted,
          total: run.correct,
          percent: run.attempted ? 100 * run.correct / run.attempted : 0,
        };
        screen = "results";
      } else {
        render(false);
        app.querySelector(".statement").focus();
        return;
      }
      break;
    case "previous":
      run.index--;
      break;
    case "next":
      run.index++;
      break;
    case "submit":
      run.result = scoreQuestions(run.questions, run.mode === "multi");
      for (const question of run.questions) {
        if (question.selected.size) markPracticed(source.practiced, question.options);
      }
      screen = "results";
      break;
    case "results":
      screen = "results";
      break;
    case "review":
      run.index = Number(index ?? 0);
      screen = "review";
      break;
    case "repeat":
      start(run.activeChapters);
      break;
  }
  render();
  if (action === "all" || action === "none") app.querySelector(`[data-action="${action}"]`).focus();
});

app.addEventListener("change", event => {
  const input = event.target;
  if (input.id === "bank-file" && input.files.length) {
    void importBank(input.files[0]);
    input.value = "";
  }
  if (input.dataset.chapter !== undefined) {
    const index = Number(input.dataset.chapter);
    if (input.checked) run.chapters.add(index);
    else run.chapters.delete(index);
    app.querySelector('[data-action="start"]').disabled = run.chapters.size === 0;
  }
  if (input.dataset.option !== undefined) {
    const selected = run.questions[run.index].selected;
    const index = Number(input.dataset.option);
    if (input.checked) selected.add(index);
    else selected.delete(index);
  }
});

function shortcutNumber(event) {
  // Physical keys work on Czech layouts even when the key value is "+", "ě", etc.
  const digit = /^Digit([1-5])$/.exec(event.code);
  if (digit) return digit[1];
  if (/^[1-5]$/.test(event.key)) return event.key;
  return ({ "+": "1", "ě": "2", "š": "3", "č": "4", "ř": "5" })[event.key];
}

document.addEventListener("keydown", event => {
  if (event.defaultPrevented || event.isComposing || settings.open ||
      event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest('select, textarea, [contenteditable], input:not([type="checkbox"])')) return;

  const shortcut = shortcutNumber(event);
  if (shortcut) {
    const control = app.querySelector(`[data-shortcut="${shortcut}"]`);
    if (!control) return;
    event.preventDefault();
    if (!event.repeat) {
      control.focus();
      control.click();
    }
    return;
  }
  if (event.shiftKey) return;

  const choices = [...app.querySelectorAll("[data-chapter], [data-option], [data-truth-choice]")];
  if (choices.length && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    event.preventDefault();
    const index = choices.indexOf(document.activeElement);
    const offset = event.key === "ArrowUp" ? -1 : 1;
    const next = index < 0 ? 0 : Math.max(0, Math.min(choices.length - 1, index + offset));
    choices[next].focus();
    return;
  }

  if (choices.length && event.key === " " && !event.target.closest("button, input, a")) {
    event.preventDefault();
    if (!event.repeat) {
      choices[0].focus();
      choices[0].click();
    }
    return;
  }

  let action;
  if (screen === "questions" || screen === "review") {
    if (event.key === "ArrowLeft") action = "previous";
    if (event.key === "ArrowRight") action = "next";
  } else if (screen === "truth" && event.key === "ArrowRight") {
    action = "next-truth";
  }
  if (action) {
    event.preventDefault();
    if (!event.repeat) app.querySelector(`[data-action="${action}"]:enabled`)?.click();
  }
});

document.querySelector("#font").addEventListener("change", event => {
  const family = fonts[event.target.value];
  if (family) document.documentElement.style.setProperty("--app-font", family);
  else document.documentElement.style.removeProperty("--app-font");
});

render(false);
