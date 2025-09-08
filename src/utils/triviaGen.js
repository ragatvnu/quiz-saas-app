import { nanoid } from "nanoid";

export function normalize(rawItems, choicesCount = 4, shuffleChoices = true) {
  return rawItems.map((item) => {
    let choices = [item.correct, ...item.distractors];
    if (choices.length < choicesCount) {
      // pad with blanks
      while (choices.length < choicesCount) choices.push("—");
    }
    if (shuffleChoices) choices = shuffleArray(choices);
    return { id: nanoid(), question: item.question, correct: item.correct, choices };
  });
}

export function shuffleQuestions(items) {
  return shuffleArray(items);
}

export function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function buildAnswerKey(pages) {
  const key = [];
  let qCounter = 1;
  pages.forEach((page) => {
    page.forEach((item) => {
      const answerIndex = item.choices.indexOf(item.correct);
      key.push({ q: qCounter, answer: String.fromCharCode(65 + answerIndex) });
      qCounter++;
    });
  });
  return key;
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
