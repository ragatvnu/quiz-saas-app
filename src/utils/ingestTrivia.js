// src/utils/ingestTrivia.js
export async function parseTriviaCSV(file) {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  const col = (name) => headers.indexOf(name);
  const iCat  = col("category");
  const iQ    = col("question");
  const iCorr = col("correct");
  const iHint = col("hint");             // ✨ NEW

  const rows = lines.slice(1);
  return rows.map((row) => {
    const cols = row.split(",").map(c => c.trim());
    const distractors = [];
    for (let i = 0; i < cols.length; i++) {
      const h = headers[i];
      if (h && h.startsWith("distractor")) distractors.push(cols[i]);
    }
    return {
      category: iCat >= 0 ? cols[iCat] : "",
      question: iQ   >= 0 ? cols[iQ]   : "",
      correct:  iCorr>= 0 ? cols[iCorr]: "",
      hint:     iHint>= 0 ? cols[iHint]: "",   // ✨
      distractors: distractors.filter(Boolean),
    };
  });
}

export async function parseTriviaJSON(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  return data.map((q) => ({
    category: q.category || "",
    question: q.question || "",
    correct:  q.correct  || "",
    hint:     q.hint     || "",           // ✨
    distractors: Array.isArray(q.distractors) ? q.distractors : [],
  }));
}

