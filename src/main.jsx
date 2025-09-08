// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

// Core pages
import WordSearchPage from "./pages/WordSearchPage.jsx";
import SudokuPage from "./pages/SudokuPage.jsx";
import CrosswordPage from "./pages/CrosswordPage.jsx";
import KakuroPage from "./pages/KakuroPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

// Optional Maze
let MazePage = null;
try { MazePage = (await import("./pages/MazePage.jsx")).default; } catch {}

// --------- Tiny Hub with tip ---------
function ModeTip() {
  return (
    <div style={{fontSize:14, background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 12px", margin:"10px 0"}}>
      Append <code>?mode=word</code>, <code>?mode=sudoku</code>, <code>?mode=crossword</code>, <code>?mode=kakuro</code>{MazePage ? <>, <code>?mode=maze</code></> : null} to the URL.
    </div>
  );
}
function Hub() {
  return (
    <div style={{padding:24, fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}}>
      <h1 style={{margin:"0 0 8px"}}>HMQUIZ Studio</h1>
      <ModeTip />
      <ul style={{marginTop:12, lineHeight:1.9}}>
        <li><a href="?mode=word">Word Search</a></li>
        <li><a href="?mode=sudoku">Sudoku</a></li>
        <li><a href="?mode=crossword">Crossword</a></li>
        <li><a href="?mode=kakuro">Kakuro</a></li>
        {MazePage ? <li><a href="?mode=maze">Maze</a></li> : null}
      </ul>
    </div>
  );
}

// --------- Route resolution ---------
const params = new URLSearchParams(location.search);
let mode = (params.get("mode") || "").toLowerCase();

if (!mode) {
  const p = location.pathname.toLowerCase();
  if (p.includes("sudoku")) mode = "sudoku";
  else if (p.includes("word")) mode = "word";
  else if (p.includes("crossword")) mode = "crossword";
  else if (p.includes("kakuro")) mode = "kakuro";
  else if (p.includes("maze")) mode = "maze";
}

const routes = {
  word: WordSearchPage,
  sudoku: SudokuPage,
  crossword: CrosswordPage,
  kakuro: KakuroPage,
  quiz: QuizPage,
  ...(MazePage ? { maze: MazePage } : {}),
};

const Page = routes[mode] || Hub;

ReactDOM.createRoot(document.getElementById("root")).render(<Page />);
