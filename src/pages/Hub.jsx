// src/pages/Hub.jsx
import React from "react";

function Tile({ title, desc, href }){
  return (
    <a href={href}
       className="block border rounded-2xl p-4 hover:shadow-md transition bg-white">
      <div className="text-lg font-bold">{title}</div>
      <div className="text-sm opacity-70">{desc}</div>
    </a>
  );
}

export default function Hub(){
  const base = (mode) => `/?mode=${encodeURIComponent(mode)}`;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold mb-6">PuzzlePacks Studio — Hub</h1>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Tile title="Word Search" desc="Create word search packs + answers" href={base("word")} />
          <Tile title="Quiz" desc="Multiple-choice quiz page" href={base("quiz")} />
          <Tile title="Crossword" desc="Crossword generator" href={base("crossword")} />
          <Tile title="Sudoku" desc="Sudoku pack" href={base("sudoku")} />
          <Tile title="Kakuro" desc="Kakuro pack" href={base("kakuro")} />
          <Tile title="Maze" desc="Maze quiz + answer key" href={base("maze")} />
        </div>
        <p className="text-xs mt-6 opacity-70">Tip: use <code>?mode=maze</code> to open the Maze page directly.</p>
      </div>
    </div>
  );
}
