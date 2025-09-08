// src/pages/MazeBatchPage.jsx
import React, { useMemo, useState } from "react";
import PageFrame from "./PageFrame.jsx";
import { makeSeed, generateMaze } from "../utils/mazeGenerator.js";
import { exportMazesPack } from "../utils/exportPDF.js";

export default function MazeBatchPage(){
  const [rows, setRows] = useState(21);
  const [cols, setCols] = useState(21);
  const [minAnswerCell, setMinAnswerCell] = useState(22);
  const [batch, setBatch] = useState([]);

  function add(count=4){
    const c = Math.max(1, Number(count)||1);
    const items = Array.from({length:c}, (_,i)=>{
      return { rows, cols, seed: makeSeed(String(Date.now()) + "-" + i + "-" + Math.random()) };
    });
    setBatch(prev => [...prev, ...items.map(it => generateMaze(it.rows, it.cols, it.seed))]);
  }
  function clear(){ setBatch([]); }

  function exportPack(){
    const items = batch.length ? batch : [generateMaze(rows, cols, makeSeed("maze"))];
    exportMazesPack({ items, title: "Mazes Pack", minAnswerCell });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold">Maze Batch Pack</h1>
          <label className="flex items-center gap-2 text-sm">
            <span>Rows</span>
            <input type="number" min={8} max={80} value={rows} onChange={e=>setRows(Number(e.target.value)||21)} className="w-16 border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Cols</span>
            <input type="number" min={8} max={80} value={cols} onChange={e=>setCols(Number(e.target.value)||21)} className="w-16 border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Min answer cell (px)</span>
            <input type="number" min={16} max={42} value={minAnswerCell} onChange={e=>setMinAnswerCell(Number(e.target.value)||22)} className="w-20 border rounded px-2 py-1" />
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={()=>add(4)} className="px-3 py-1 rounded-lg border text-sm">+4</button>
            <button onClick={()=>add(8)} className="px-3 py-1 rounded-lg border text-sm">+8</button>
            <button onClick={()=>add(12)} className="px-3 py-1 rounded-lg border text-sm">+12</button>
            <button onClick={clear} className="px-3 py-1 rounded-lg border text-sm">Clear</button>
            <button onClick={exportPack} className="px-3 py-1 rounded-lg bg-black text-white text-sm">Export PDF (Mazes pack)</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <details className="bg-white border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">Instructions</summary>
          <ol className="list-decimal ml-5 mt-3 space-y-1 text-sm">
            <li>Set <b>Rows</b> and <b>Cols</b> for maze size.</li>
            <li>Click <b>+4 / +8 / +12</b> to add that many mazes to the batch.</li>
            <li>Use <b>Min answer cell</b> to keep solution grids big on the combined Answer Key pages.</li>
            <li>Click <b>Export PDF (Mazes pack)</b> to generate puzzle pages and then a combined Answer Key section.</li>
          </ol>
        </details>

        <PageFrame title="Preview (first 2 mazes)" subtitle="The export uses A4 pages with large puzzle grids; answers are tiled later." footer="Created with HMQUIZ Studio" center>
          <div className="grid md:grid-cols-2 gap-4">
            {(batch.slice(0,2)).map((m,i)=>{
              const cell=10; // small preview only
              const W=m.cols*cell, H=m.rows*cell;
              let lines=""; for(let r=0;r<m.rows;r++){ for(let c=0;c<m.cols;c++){ const x=c*cell, y=r*cell, o=m.walls[r][c]; if(o[0]) lines+=`<line x1="${x}" y1="${y}" x2="${x+cell}" y2="${y}" />`; if(o[1]) lines+=`<line x1="${x}" y1="${y+cell}" x2="${x+cell}" y2="${y+cell}" />`; if(o[2]) lines+=`<line x1="${x+cell}" y1="${y}" x2="${x+cell}" y2="${y+cell}" />`; if(o[3]) lines+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+cell}" />`; }};
              const start = `<circle cx="${cell/2}" cy="${cell/2}" r="${Math.max(2, cell*0.18)}" fill="#10b981" />`;
              const end = `<circle cx="${(m.cols-1)*cell + cell/2}" cy="${(m.rows-1)*cell + cell/2}" r="${Math.max(2, cell*0.18)}" fill="#ef4444" />`;
              const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g stroke="#111827" stroke-width="2" stroke-linecap="square">${lines}</g>${start}${end}</svg>`;
              return <div key={i} className="border rounded p-3" dangerouslySetInnerHTML={{__html: svg}} />;
            })}
          </div>
        </PageFrame>
      </div>

      <style>{`@page{size:A4;margin:0} @media print{.sticky{display:none!important}}`}</style>
    </div>
  );
}
