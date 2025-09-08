// src/pages/MazePage.jsx
import React, { useMemo, useState } from "react";
import { generateMaze, makeSeed } from "../utils/mazeGenerator.js";

export default function MazePage(){
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(20);
  const [seed, setSeed] = useState(makeSeed("maze-"+Date.now()));
  const [batch, setBatch] = useState([]);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [minAnswerCell, setMinAnswerCell] = useState(22);
  const [previewSolution, setPreviewSolution] = useState(false);

  const maze = useMemo(()=> generateMaze(rows, cols, seed), [rows, cols, seed]);
  function regen(){ setSeed(makeSeed("maze-"+Date.now())); }

  function addToBatch(count=1){
    const items = Array.from({length: Math.max(1, Number(count)||1)}, (_,i)=>({
      rows, cols, seed: makeSeed(String(seed) + "-"+ i + "-" + Math.random())
    }));
    setBatch(prev => [...prev, ...items]);
  }
  function clearBatch(){ setBatch([]); }

  function downloadJSON(obj, filename = "maze_batch.json") {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  function downloadBatchFile(){ downloadJSON({ version: 1, items: batch }, "maze_batch.json"); }
  function uploadBatchJSON(file){
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(obj.items)) {
          setBatch(obj.items.map(it => ({
            rows: Number(it.rows)||rows,
            cols: Number(it.cols)||cols,
            seed: Number(it.seed)||makeSeed(Math.random())
          })));
        }
      } catch (e) { alert("Invalid batch JSON"); }
    };
    reader.readAsText(file);
  }

  // === Exporter (self-contained, no shared PageFrame/_a4) ===
  function exportBatchPdfMaze(){
    const items = batch.length ? batch : [{ rows, cols, seed }];
    const serial = items.map(it => ({ ...it, data: generateMaze(it.rows, it.cols, it.seed) }));

    const mmToPx = (mm)=> (mm/25.4)*96;
    const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12;
    const CONTENT_W_PX = Math.floor(mmToPx(PAGE_W_MM - 2*MARGIN_MM));
    const CONTENT_H_PX = Math.floor(mmToPx(PAGE_H_MM - 2*MARGIN_MM));
    const HEADER_H_PX = 100, FOOTER_H_PX = 44;
    const USABLE_H_PX = CONTENT_H_PX - HEADER_H_PX - FOOTER_H_PX;

    const renderMazeSVG = (m, cell, stroke=2, showSolution=false)=>{
      const rows = m.rows, cols = m.cols;
      const W = cols*cell, H = rows*cell;
      let lines = "";
      for (let r=0;r<rows;r++){
        for (let c=0;c<cols;c++){
          const x=c*cell, y=r*cell, o = m.cells[r][c];
          if (o.N) lines += `<line x1="${x}" y1="${y}" x2="${x+cell}" y2="${y}" />`;
          if (o.W) lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+cell}" />`;
          if (r===rows-1 && o.S) lines += `<line x1="${x}" y1="${y+cell}" x2="${x+cell}" y2="${y+cell}" />`;
          if (c===cols-1 && o.E) lines += `<line x1="${x+cell}" y1="${y}" x2="${x+cell}" y2="${y+cell}" />`;
        }
      }
      let pathMarkup = "";
      if (showSolution && Array.isArray(m.path) && m.path.length > 1){
        const pts = m.path.map(([rr,cc]) => `${cc*cell + cell/2},${rr*cell + cell/2}`).join(" ");
        pathMarkup = `<polyline points="${pts}" fill="none" stroke="#f59e0b" stroke-width="${Math.max(2, stroke)}" stroke-linejoin="round" stroke-linecap="round"/>`;
      }
      const start = `<circle cx="${m.start[1]*cell + cell/2}" cy="${m.start[0]*cell + cell/2}" r="${Math.max(2, cell*0.18)}" fill="#10b981" />`;
      const end = `<circle cx="${m.end[1]*cell + cell/2}" cy="${m.end[0]*cell + cell/2}" r="${Math.max(2, cell*0.18)}" fill="#ef4444" />`;
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <g stroke="#111827" stroke-width="2" stroke-linecap="square">${lines}</g>${start}${end}${pathMarkup}</svg>`;
    };

    const pageOpen = (title, subtitle="") => `<div class="maze-a4 page"><div class="content"><div class="headerbox"><div class="title">${title}</div>${subtitle?`<div class="subtitle">${subtitle}</div>`:''}</div>`;
    const pageClose = () => `<div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div></div></div>`;

    // Puzzle pages (one per maze)
    let body = "";
    for (let i=0;i<serial.length;i++){
      const puz = serial[i];
      const gridH = Math.floor(USABLE_H_PX * 0.78);
      const cellW = Math.floor(CONTENT_W_PX / puz.data.cols);
      const cellH = Math.floor(gridH / puz.data.rows);
      const cell = Math.max(14, Math.min(32, Math.min(cellW, cellH)));
      const svg = renderMazeSVG(puz.data, cell, 2, false);
      body += pageOpen(`Maze — ${puz.data.rows} × ${puz.data.cols}`, "Start at the green dot and reach the red dot. Stay within the paths!") +
              `<div class="mz-wrap" style="display:flex;justify-content:center">${svg}</div>` +
              pageClose();
    }

    // Answer pages (optional)
    if (includeAnswers) {
      const MIN = Math.max(16, Math.min(42, Number(minAnswerCell) || 22));
      let idx = 0;
      while (idx < serial.length) {
        let bestCols = 1, bestCell = 0, take = 1;
        for (let tryTake = Math.min(12, serial.length - idx); tryTake >= 1; tryTake--) {
          const group = serial.slice(idx, idx + tryTake);
          const minCols = group.length >= 2 ? 2 : 1;
          let localBest = { cols:minCols, cell:0 };
          for (let cols=minCols; cols<=4 && cols<=group.length; cols++){
            const rows = Math.ceil(group.length / cols);
            const tileW = (CONTENT_W_PX - (cols-1)*12) / cols;
            const tileH = (USABLE_H_PX - (rows-1)*12) / rows;
            let minCell = 999;
            for (const puz of group){
              const cW = Math.floor(tileW / puz.data.cols);
              const cH = Math.floor(tileH / puz.data.rows);
              const cp = Math.max(12, Math.min(40, Math.min(cW, cH)));
              if (cp < minCell) minCell = cp;
            }
            if (minCell > localBest.cell) localBest = { cols, cell: minCell };
          }
          if (localBest.cell >= MIN) { bestCols = localBest.cols; bestCell = localBest.cell; take = tryTake; break; }
        }
        const group = serial.slice(idx, idx + take);
        const tiles = group.map((puz, j)=>{
          const idxGlobal = idx + j + 1;
          return `<div class="mz-ans-item"><div class="mz-ans-title">Solution – #${idxGlobal}</div>${renderMazeSVG(puz.data, bestCell||MIN, 2, true)}</div>`;
        }).join("");

        body += pageOpen("Maze — Answer Key") +
                `<div class="mz-answers" style="grid-template-columns: repeat(${Math.max(group.length>=2?2:1,bestCols)}, minmax(0, 1fr)); width:${CONTENT_W_PX}px; margin:0 auto; --gap:12px">${tiles}</div>` +
                pageClose();
        idx += take;
      }
    }

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Mazes — Printable</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { height: 100%; }
  body { font-family: Inter, system-ui, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; }
  .maze-a4 { width: 210mm; min-height: 297mm; margin: 0 auto; box-sizing: border-box; padding: 12mm; }
  .page { page-break-after: always; position: relative; background:#fff; }
  .content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height: calc(297mm - 24mm); }
  .headerbox { width:100%; max-width:100%; min-height:100px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
               background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom:12px; }
  .title { font-size:22px; font-weight:800; text-align:center; }
  .subtitle { font-size:13px; color:#4b5563; margin-top:4px; }
  .footer { width:100%; display:flex; justify-content:center; margin-top:12px; }
  .footerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:6px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size:13px; font-weight:600; color:#374151; }
  .mz-answers { display:grid; grid-auto-flow:row dense; justify-items:stretch; align-content:start; gap: var(--gap, 12px); width:100%; }
  .mz-ans-item { display:flex; flex-direction:column; align-items:center; width:100%; }
  .mz-ans-title { font-size:14px; font-weight:800; margin:6px 0; }
</style>
</head><body><div id="doc">${body}
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script>(function(){
  const { jsPDF } = window.jspdf;
  const pages = Array.from(document.querySelectorAll('.maze-a4'));
  const total = pages.length;
  const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });

  const overlay = document.createElement('div');
  overlay.id='pp-progress';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Inter,system-ui,sans-serif;';
  overlay.innerHTML='<div style="width:420px;max-width:90vw;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:16px;"><h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827">Exporting PDF…</h3><div style="width:100%;height:10px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin:10px 0"><div id="pp-bar" style="height:100%;width:0%;background:#2563eb;transition:width .2s"></div></div><div style="font-size:12px;color:#4b5563;display:flex;justify-content:space-between"><span id="pp-count">0/0</span><span id="pp-tip">Rendering…</span></div></div>';
  document.body.appendChild(overlay);
  const bar = document.getElementById('pp-bar'); const count = document.getElementById('pp-count'); const tip = document.getElementById('pp-tip');
  const dpr = window.devicePixelRatio || 1; const SCALE = Math.min(3, Math.max(2, dpr * 2));
  function update(i){ bar.style.width = Math.round((i/total)*100) + '%'; count.textContent = i + '/' + total; }
  async function renderPage(el, index){
    tip.textContent = 'Rendering page ' + (index+1);
    await new Promise(r=>setTimeout(r,0));
    const canvas = await html2canvas(el, { scale:SCALE, backgroundColor:'#ffffff', useCORS:true, windowWidth: el.offsetWidth, windowHeight: el.offsetHeight });
    const imgData = canvas.toDataURL('image/png');
    if (index===0) pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    else { pdf.addPage('a4','portrait'); pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); }
  }
  (async function(){ for (let i=0;i<total;i++){ await renderPage(pages[i], i); update(i+1); } tip.textContent='Saving PDF…'; await new Promise(r=>setTimeout(r,0)); pdf.save('mazes-pack.pdf'); setTimeout(()=>window.close(), 400); })().catch(err=>{ console.error(err); alert('Failed to generate PDF. See console.'); });
})();</script>
</div></body></html>`;

    const w = window.open("", "_blank");
    if (!w){ alert("Popup blocked — allow popups to export PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold">Maze Quiz</h1>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span>Rows</span>
              <input type="number" min={8} max={60} value={rows} onChange={e=>setRows(Number(e.target.value)||20)} className="w-16 border rounded px-2 py-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span>Cols</span>
              <input type="number" min={8} max={60} value={cols} onChange={e=>setCols(Number(e.target.value)||20)} className="w-16 border rounded px-2 py-1" />
            </label>
            <button onClick={regen} className="px-3 py-1 rounded-lg border text-sm">Regenerate</button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={previewSolution} onChange={e=>setPreviewSolution(e.target.checked)} />
              Preview solution
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeAnswers} onChange={e=>setIncludeAnswers(e.target.checked)} />
              Include Answer Key
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span>Min answer cell (px)</span>
              <input type="number" min={16} max={42} value={minAnswerCell} onChange={e=>setMinAnswerCell(Number(e.target.value)||22)} className="w-20 border rounded px-2 py-1" />
            </label>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={()=>addToBatch(1)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm">Add to Batch</button>
            <button onClick={()=>addToBatch(4)} className="px-3 py-1 rounded-lg border text-sm">+4</button>
            <button onClick={()=>addToBatch(8)} className="px-3 py-1 rounded-lg border text-sm">+8</button>
            <button onClick={()=>addToBatch(12)} className="px-3 py-1 rounded-lg border text-sm">+12</button>
            <button onClick={exportBatchPdfMaze} className="px-3 py-1 rounded-lg bg-black text-white text-sm">Export PDF (Kakuro-style)</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <details className="bg-white border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">Instructions</summary>
          <ol className="list-decimal ml-5 mt-3 space-y-1 text-sm">
            <li>Start at the <b>green</b> dot and reach the <b>red</b> dot without crossing walls.</li>
            <li>Use <b>Rows</b> and <b>Cols</b> to control maze size. Click <b>Regenerate</b> for a new layout.</li>
            <li>Use <b>Preview solution</b> to check the shortest path on the on‑screen maze.</li>
            <li>Add several to a <b>Batch</b>, then click <b>Export PDF (Kakuro‑style)</b>. This creates puzzle pages and, if enabled, an <b>Answer Key</b>.</li>
            <li>Answer pages auto-pack multiple solutions per page while keeping each grid big (tuned by <i>Min answer cell</i>).</li>
          </ol>
        </details>

        {/* Self-contained sheet (no shared PageFrame/_a4) */}
        <div className="maze-a4 relative bg-white mx-auto my-4 shadow-sm border border-gray-200">
          <div className="content px-[12mm] py-[12mm] text-center">
            <div className="mb-5 headerbox border border-gray-200 rounded-xl bg-white/95 shadow-sm px-4 py-3">
              <div className="title text-2xl font-extrabold">Maze — {rows} × {cols}</div>
              <div className="text-sm opacity-80 mt-1">Find a path from START (green) to END (red).</div>
            </div>
            <div className="flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: (()=>{
                const m = maze;
                const cell = 22, stroke = 2;
                const W = m.cols*cell, H = m.rows*cell;
                let lines = "";
                for (let r=0;r<m.rows;r++){ for (let c=0;c<m.cols;c++){
                  const x=c*cell, y=r*cell, o = m.cells[r][c];
                  if (o.N) lines += `<line x1="${x}" y1="${y}" x2="${x+cell}" y2="${y}" />`;
                  if (o.W) lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+cell}" />`;
                  if (r===m.rows-1 && o.S) lines += `<line x1="${x}" y1="${y+cell}" x2="${x+cell}" y2="${y+cell}" />`;
                  if (c===m.cols-1 && o.E) lines += `<line x1="${x+cell}" y1="${y}" x2="${x+cell}" y2="${y+cell}" />`;
                }};
                const start = `<circle cx="${m.start[1]*cell + cell/2}" cy="${m.start[0]*cell + cell/2}" r="${Math.max(2, cell*0.18)}" fill="#10b981" />`;
                const end = `<circle cx="${m.end[1]*cell + cell/2}" cy="${m.end[0]*cell + cell/2}" r="${Math.max(2, cell*0.18)}" fill="#ef4444" />`;
                let pathMarkup = "";
                if (previewSolution && Array.isArray(m.path) && m.path.length>1){
                  const pts = m.path.map(([rr,cc]) => `${cc*cell + cell/2},${rr*cell + cell/2}`).join(' ');
                  pathMarkup = `<polyline points="${pts}" fill="none" stroke="#f59e0b" stroke-width="${Math.max(2, stroke)}" stroke-linejoin="round" stroke-linecap="round"/>`;
                }
                return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
                  <g stroke="#111827" stroke-width="${stroke}" stroke-linecap="square">${lines}</g>${start}${end}${pathMarkup}</svg>`;
              })() }} />
            </div>
            <div className="absolute left-0 right-0 bottom-[8mm] px-[12mm] text-xs text-center opacity-70">Created with HMQUIZ Studio</div>
          </div>
        </div>
      </div>

      <style>{`
        .maze-a4 { width: 210mm; min-height: 297mm; box-sizing: border-box; background:#fff; }
        @media print { .maze-a4 { margin: 0 auto; box-shadow: none !important; border: none !important; } }
      `}</style>
    </div>
  );
}
