// src/pages/MazeQuizPage.jsx
import React, { useMemo, useState } from "react";
import PageFrame from "./PageFrame.jsx";
import MazeSVG from "../components/MazeSVG.jsx";
import { makeSeed } from "../utils/mazeGenerator.js";
import { exportPagesToPDF } from "../utils/exportPDF.js";

const SAMPLE_Q = [
  { q: "What is 7 × 8?", options: ["54","56","58","64"], answer: "B" },
  { q: "Capital of Japan?", options: ["Kyoto","Tokyo","Osaka","Sapporo"], answer: "B" },
  { q: "Largest planet?", options: ["Earth","Mars","Jupiter","Saturn"], answer: "C" },
  { q: "Prime number?", options: ["21","27","29","35"], answer: "C" },
];

function parseCSV(text){
  // Headers: question,A,B,C,D,answer
  const lines = text.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",").map(s=>s.trim().toLowerCase());
  const qi = header.indexOf("question");
  const ai = [header.indexOf("a"), header.indexOf("b"), header.indexOf("c"), header.indexOf("d")];
  const ans = header.indexOf("answer");
  const out = [];
  for (let i=1;i<lines.length;i++){
    const parts = lines[i].split(",").map(s=>s.trim());
    if (!parts.length) continue;
    const q = qi>=0 ? parts[qi] : parts[0];
    const opts = ai.map(idx => idx>=0 ? parts[idx] : "");
    const a = ans>=0 ? (parts[ans]||"").toUpperCase().replace(/[^ABCD]/g,"") : "";
    if (q) out.push({ q, options: opts, answer: a || "" });
  }
  return out;
}

export default function MazeQuizPage(){
  const [rows, setRows] = useState(21);
  const [cols, setCols] = useState(21);
  const [seed, setSeed] = useState(makeSeed("maze-"+Date.now()));
  const [title, setTitle] = useState("Maze Quiz");
  const [questions, setQuestions] = useState(SAMPLE_Q);
  const [showSolution, setShowSolution] = useState(false);

  const cellPx = 12; // for preview; export uses DOM capture so it's crisp

  function onCSV(e){
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const list = parseCSV(String(r.result||"")); if (list.length) setQuestions(list); };
    r.readAsText(f);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold">Maze Quiz</h1>
          <label className="flex items-center gap-2 text-sm">
            <span>Rows</span>
            <input type="number" min={5} max={99} value={rows} onChange={e=>setRows(Number(e.target.value)||21)} className="w-16 border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Cols</span>
            <input type="number" min={5} max={99} value={cols} onChange={e=>setCols(Number(e.target.value)||21)} className="w-16 border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showSolution} onChange={e=>setShowSolution(e.target.checked)} />
            Show solution (preview)
          </label>
          <div className="ml-auto flex gap-2">
            <button onClick={()=>exportPagesToPDF({ filename: 'maze-quiz.pdf', marginMM: 10, imageFit: 'contain', footer: true })} className="px-3 py-1 rounded-xl border text-sm">Export PDF</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <details className="bg-white border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">Instructions</summary>
          <ol className="list-decimal ml-5 mt-3 space-y-1 text-sm">
            <li>Find your way from <b>Start</b> (top-left) to <b>Finish</b> (bottom-right).</li>
            <li>Answer the quiz below as you go. Use it for checkpoints or to award points.</li>
            <li>Use the CSV loader for large sets (headers: <code>question,A,B,C,D,answer</code>).</li>
            <li>Export uses the same A4 layout and PDF method as your other puzzles.</li>
          </ol>
        </details>

        {/* Puzzle page */}
        <PageFrame title={`${title}`} subtitle="Solve the maze, then answer the questions below." footer="Created with HMQUIZ Studio" center>
          <div className="mb-3 text-sm opacity-70">Start = top-left • Finish = bottom-right</div>
          <MazeSVG rows={rows} cols={cols} seed={seed} cell={cellPx} stroke={2} showSolution={showSolution} />
          {/* Questions under the maze */}
          {questions?.length>0 && (
            <div className="mt-5 w-full max-w-3xl text-left mx-auto">
              <h3 className="font-semibold mb-2 text-center">Quiz</h3>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                {questions.map((q,i)=>(
                  <li key={i}>
                    <div className="font-medium">{q.q}</div>
                    <ul className="grid grid-cols-2 gap-2 mt-1">
                      {q.options.map((op,j)=>(<li key={j} className="border rounded px-3 py-1">{String.fromCharCode(65+j)}. {op}</li>))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </PageFrame>

        {/* Answer page */}
        <PageFrame title="Answer Key" subtitle="Maze solution path + answer letters." footer="Created with HMQUIZ Studio" center>
          <MazeSVG rows={rows} cols={cols} seed={seed} cell={cellPx} stroke={2} showSolution={true} />
          {questions?.length>0 && (
            <div className="mt-5 w-full max-w-3xl text-left mx-auto">
              <h3 className="font-semibold mb-2 text-center">Quiz Answers</h3>
              <ol className="list-decimal ml-5 space-y-1 text-sm">
                {questions.map((q,i)=>(
                  <li key={i} className="font-medium">Answer: <b>{(q.answer||"").toUpperCase()||"—"}</b></li>
                ))}
              </ol>
            </div>
          )}
        </PageFrame>

        {/* Loader for questions */}
        <div className="bg-white border rounded-xl p-4 print:hidden">
          <div className="font-medium mb-2">Load questions (CSV)</div>
          <input type="file" accept=".csv" onChange={onCSV} />
          <div className="text-xs opacity-70 mt-1">Headers: <code>question,A,B,C,D,answer</code></div>
        </div>
      </div>

      <style>{`@page{size:A4;margin:0} @media print{.sticky{display:none!important}}`}</style>
    </div>
  );
}
