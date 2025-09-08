// src/utils/crosswordGenerator.js
// A simple crossword builder: places words by cross-matching letters.
// For bigger puzzles, swap with a stronger algorithm.

/**
 * Build a crossword from entries.
 * @param {number} rows
 * @param {number} cols
 * @param {{ answer: string, clue: string }[]} entries
 * @returns {{ grid: {type:"block"|"letter", ch?:string}[][], numbers:number[][], clues:{across: any[], down:any[]} }}
 */
export function buildCrossword(rows, cols, entries) {
  const words = entries
    .map(e => ({ answer: e.answer.toUpperCase().replace(/[^A-Z]/g, ""), clue: e.clue }))
    .filter(e => e.answer.length >= 2);

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "block" }))
  );

  const place = (r, c, dr, dc, word) => {
    const rr = r + dr * (word.length - 1);
    const cc = c + dc * (word.length - 1);
    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) return false;
    for (let i = 0; i < word.length; i++) {
      const y = r + dr * i;
      const x = c + dc * i;
      const cell = grid[y][x];
      if (cell.type === "letter" && cell.ch !== word[i]) return false;
    }
    for (let i = 0; i < word.length; i++) {
      const y = r + dr * i;
      const x = c + dc * i;
      grid[y][x] = { type: "letter", ch: word[i] };
    }
    return true;
  };

  if (words.length) {
    const w = words[0].answer;
    const r = Math.floor(rows / 2);
    const c = Math.max(0, Math.floor((cols - w.length) / 2));
    place(r, c, 0, 1, w);
  }

  for (let wi = 1; wi < words.length; wi++) {
    const w = words[wi].answer;
    let placed = false;
    outer:
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.type === "letter" && cell.ch === ch) {
            const r0 = r - i;
            if (place(r0, c, 1, 0, w)) { placed = true; break outer; }
            const c0 = c - i;
            if (place(r, c0, 0, 1, w)) { placed = true; break outer; }
          }
        }
      }
    }
    if (!placed) {
      for (let r = 0; r < rows && !placed; r++) {
        for (let c = 0; c < cols && !placed; c++) {
          if (place(r, c, 0, 1, w)) placed = true;
        }
      }
    }
  }

  const numbers = Array.from({ length: rows }, () => Array(cols).fill(null));
  let n = 1;
  const clues = { across: [], down: [] };

  const isLetter = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c].type === "letter";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isLetter(r, c)) continue;
      if (!isLetter(r, c - 1)) {
        numbers[r][c] = n;
        let cc = c, answer = "";
        while (isLetter(r, cc)) { answer += grid[r][cc].ch; cc++; }
        const original = entries.find(e => answer.includes(e.answer.toUpperCase().replace(/[^A-Z]/g, "")));
        clues.across.push({ num: n, answer, clue: original?.clue || "Across clue" });
        n++;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!isLetter(r, c)) continue;
      if (!isLetter(r - 1, c)) {
        numbers[r][c] = numbers[r][c] || n;
        const thisNum = numbers[r][c] || n;
        let rr = r, answer = "";
        while (isLetter(rr, c)) { answer += grid[rr][c].ch; rr++; }
        const original = entries.find(e => answer.includes(e.answer.toUpperCase().replace(/[^A-Z]/g, "")));
        clues.down.push({ num: thisNum, answer, clue: original?.clue || "Down clue" });
        if (!numbers[r][c]) n++;
      }
    }
  }

  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c].type !== "letter") grid[r][c] = { type: "block" };
  }

  return { grid, numbers, clues };
}

export const SAMPLE_ENTRIES = [
  { answer: "DELHI", clue: "Capital of India" },
  { answer: "RIVER", clue: "Ganga is one" },
  { answer: "LOTUS", clue: "National flower" },
  { answer: "TIGER", clue: "National animal" },
  { answer: "HINDI", clue: "Widely spoken language" },
];
