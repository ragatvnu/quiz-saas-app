import fs from "node:fs";

const SEED = "src/data/themes/trivia_christmas_seed.json";
const OUT  = "src/data/themes/trivia_christmas_pack.json";

const PAGES = 30;        // total pages
const PER_PAGE = 10;     // questions per page
const CHOICES = 4;       // A-D

function readSeed() {
  const raw = fs.readFileSync(SEED, "utf8");
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Seed is empty or invalid.");
  }
  return items.map((q, i) => ({
    id: `seed-${i}`,
    category: q.category || "Christmas",
    question: q.question,
    correct: q.correct,
    distractors: Array.isArray(q.distractors) ? q.distractors.slice(0, CHOICES-1) : []
  }));
}

function choiceShuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function padChoices(correct, distractors) {
  let pool = [correct, ...distractors];
  while (pool.length < CHOICES) pool.push("—");
  return choiceShuffle(pool);
}

function buildPack(seed) {
  const pages = [];
  const totalNeeded = PAGES * PER_PAGE;
  for (let i = 0; i < totalNeeded; i++) {
    const base = seed[Math.floor(Math.random() * seed.length)];
    const choices = padChoices(base.correct, base.distractors);
    pages.push({
      id: `q-${i+1}`,
      category: base.category,
      question: base.question,
      correct: base.correct,
      choices
    });
  }
  // chunk per page
  const chunked = [];
  for (let i = 0; i < pages.length; i += PER_PAGE) {
    chunked.push(pages.slice(i, i + PER_PAGE));
  }
  return {
    meta: {
      title: "Christmas Trivia",
      subtitle: "Family Edition",
      pages: PAGES,
      perPage: PER_PAGE
    },
    pages: chunked
  };
}

function main() {
  const seed = readSeed();
  const pack = buildPack(seed);
  fs.writeFileSync(OUT, JSON.stringify(pack, null, 2));
  console.log(`Wrote ${OUT} with ${pack.pages.length} pages of ${pack.pages[0].length} questions.`);
}
main();
