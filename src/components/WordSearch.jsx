// src/components/WordSearch.jsx
import React, { useMemo } from "react";
import { generateWordSearch } from "../utils/wordSearchGenerator.js";

function deriveWords(data) {
  if (!data) return ["DOG","CAT","WOLF","HORSE","SHEEP","MONKEY","BEAR","MOUSE"];
  if (Array.isArray(data.words)) return data.words;
  if (Array.isArray(data.entries)) return data.entries;
  if (Array.isArray(data.list)) return data.list.map(x => (x.text || x.word || x).toString());
  if (Array.isArray(data.items)) return data.items.map(x => (x.text || x.word || x).toString());
  if (data.puzzle && Array.isArray(data.puzzle.words)) return data.puzzle.words;
  return ["DOG","CAT","WOLF","HORSE","SHEEP","MONKEY","BEAR","MOUSE"];
}

export default function WordSearch({
  data,
  showAnswers = false,
  rows = 12,
  cols = 12,
  seed = undefined,
  cellPx = 38,
  showWordList = true,
}) {
  const words = useMemo(() => deriveWords(data).map(w => (w || '').toString().toUpperCase()), [data]);
  const { grid, placements } = useMemo(() => generateWordSearch(words, rows, cols, seed), [words, rows, cols, seed]);

  return (
    <div className="w-full">
      {/* GRID */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid border border-gray-300 rounded-md select-none"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
            gridAutoRows: `${cellPx}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((ch, c) => {
              let isAnswer = false;
              if (showAnswers) {
                for (const p of placements) {
                  for (const cell of p.cells) {
                    if (cell.r === r && cell.c === c) { isAnswer = true; break; }
                  }
                  if (isAnswer) break;
                }
              }
              return (
                <div
                  key={r + '-' + c}
                  className={`flex items-center justify-center border border-gray-200 text-lg md:text-xl ${isAnswer ? 'bg-yellow-200' : ''}`}
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", width: `${cellPx}px`, height: `${cellPx}px` }}
                >{ch}</div>
              );
            })
          )}
        </div>
      </div>

      {/* WORD LIST BELOW GRID (optional) */}
      {showWordList && (
        <div className="mt-5">
          <h3 className="font-semibold mb-2">Word List</h3>
          <ul className="columns-3 sm:columns-4 md:columns-5 text-sm leading-6 list-disc list-inside">
            {words.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
