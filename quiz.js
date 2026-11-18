"use strict";

const PASS_PERCENT = 75;
const PROGRESS_PREFIX = "# QUIZLET_PROGRESS ";
const statementEncoder = new TextEncoder();

function statementId(chapter, truth, text) {
  // FNV-1a over UTF-8. The chapter number stays stable when content is
  // inserted or reordered, or when a chapter title changes.
  let hash = 0xcbf29ce484222325n;
  const key = JSON.stringify([chapter, truth, text.normalize("NFC")]);
  for (const byte of statementEncoder.encode(key)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function parseBank(raw) {
  const bank = new Map();
  let chapter;
  let kind;
  // Accept UTF-8 BOM, Windows/Unix line endings and wrapped statements.
  for (const [index, rawLine] of raw.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const heading = /^(\d+)\.\s+(.+)$/.exec(line);
    if (heading) {
      const id = Number(heading[1]);
      if (!Number.isSafeInteger(id)) throw new Error(`Řádek ${index + 1}: příliš vysoké číslo kapitoly.`);
      if (bank.has(id)) throw new Error(`Řádek ${index + 1}: kapitola ${id} je uvedena dvakrát.`);
      chapter = { id, title: heading[2], OK: [], NOK: [] };
      bank.set(id, chapter);
      kind = undefined;
      continue;
    }

    const answer = /^(OK|NOK)\s*=\s*(.*)$/.exec(line);
    if (answer) {
      if (!chapter) throw new Error(`Řádek ${index + 1}: tvrzení nemá nadpis kapitoly.`);
      kind = answer[1];
      if (!answer[2]) throw new Error(`Řádek ${index + 1}: prázdné tvrzení ${kind}.`);
      chapter[kind].push({ text: answer[2], truth: kind === "OK" });
    } else if (kind) {
      chapter[kind].at(-1).text += ` ${line}`;
    } else {
      throw new Error(`Řádek ${index + 1}: nerozpoznaný text „${line.slice(0, 90)}“.`);
    }
  }
  if (!bank.size) throw new Error("Soubor nemá žádné kapitoly. Zkontroluj formát TXT.");
  for (const { id, OK, NOK } of bank.values()) {
    for (const option of [...OK, ...NOK]) {
      option.id = statementId(id, option.truth, option.text);
    }
  }
  return [...bank.values()].sort((a, b) => a.id - b.id);
}

function readBankFile(raw) {
  const chapters = parseBank(raw);
  const eol = raw.match(/\r\n|\n|\r/)?.[0] ?? "\n";
  const lines = raw.split(/\r\n|\n|\r/);
  const saved = lines.filter(line => /^\s*# QUIZLET_PROGRESS(?:\s|$)/.test(line));
  const practiced = new Map();

  if (saved.length > 1) throw new Error("Soubor obsahuje více bloků s pokrokem.");
  if (saved.length) {
    let data;
    try {
      data = JSON.parse(saved[0].trimStart().slice(PROGRESS_PREFIX.trimEnd().length));
    } catch {
      throw new Error("Blok s pokrokem obsahuje neplatný JSON.");
    }
    if (data?.version !== 1 || !data.practiced || typeof data.practiced !== "object" || Array.isArray(data.practiced)) {
      throw new Error("Blok s pokrokem má neznámou verzi nebo neplatný formát.");
    }
    for (const [id, count] of Object.entries(data.practiced)) {
      if (!/^[0-9a-f]{16}$/.test(id) || !Number.isSafeInteger(count) || count < 1) {
        throw new Error("Blok s pokrokem obsahuje neplatný záznam.");
      }
      practiced.set(id, count);
    }
    lines.splice(lines.indexOf(saved[0]), 1);
  }
  return { chapters, text: lines.join(eol), eol, practiced };
}

function writeBankFile({ text, eol, practiced }) {
  const data = JSON.stringify({ version: 1, practiced: Object.fromEntries(practiced) });
  return text.replace(/[\r\n]+$/, "") + eol + eol + PROGRESS_PREFIX + data + eol;
}

function markPracticed(practiced, options) {
  for (const id of new Set(options.map(option => option.id))) {
    practiced.set(id, Math.min((practiced.get(id) ?? 0) + 1, Number.MAX_SAFE_INTEGER));
  }
}

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sortByPractice(options, practiced) {
  return shuffle(options).sort((a, b) => (practiced.get(a.id) ?? 0) - (practiced.get(b.id) ?? 0));
}

function truthCards(chapters, practiced) {
  return sortByPractice(chapters.flatMap(chapter =>
    [...chapter.OK, ...chapter.NOK].map(option => ({ ...option, chapter }))
  ), practiced);
}

function buildQuestions(chapters, multi, practiced) {
  const targets = shuffle([1, 2, 3, 4]);
  return chapters.map((chapter, index) => {
    const count = multi ? 4 : 5;
    const possible = (multi ? targets : [2]).filter(number =>
      chapter.OK.length >= number && chapter.NOK.length >= count - number
    );
    if (!possible.length) {
      const rule = multi ? "4 tvrzení, z toho aspoň jedno OK" : "alespoň 2 OK a 3 NOK tvrzení";
      throw new Error(`Kapitola ${chapter.id} (${chapter.title}) potřebuje ${rule}.`);
    }
    const ok = sortByPractice(chapter.OK, practiced);
    const nok = sortByPractice(chapter.NOK, practiced);
    const newOK = ok.filter(option => !practiced.has(option.id)).length;
    const newNOK = nok.filter(option => !practiced.has(option.id)).length;
    const newOptions = positives => Math.min(positives, newOK) + Math.min(count - positives, newNOK);
    const mostNew = Math.max(...possible.map(newOptions));
    const best = possible.filter(positives => newOptions(positives) === mostNew);
    const target = multi ? targets[index % targets.length] : 2;
    const positives = best.includes(target) ? target : best[Math.floor(Math.random() * best.length)];
    const options = shuffle([
      ...ok.slice(0, positives),
      ...nok.slice(0, count - positives),
    ]);
    return { chapter, options, selected: new Set() };
  });
}

function pointsFor(question, multi) {
  const { options, selected } = question;
  if (!selected.size) return 0;
  if (!multi) {
    if (selected.size > 2) return 0;
    return [...selected].reduce((total, index) => total + (options[index].truth ? 0.5 : -0.25), 0);
  }
  if ([...selected].some(index => !options[index].truth)) return -1;
  return options.every((option, index) => !option.truth || selected.has(index)) ? 4 : 2;
}

function scoreQuestions(questions, multi) {
  const maximum = multi ? 4 : 1;
  const scores = questions.map(question => pointsFor(question, multi));
  const total = scores.reduce((sum, points) => sum + points, 0);
  return { scores, maximum, total, percent: questions.length ? 100 * total / (maximum * questions.length) : 0 };
}
