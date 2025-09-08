// src/pages/WordSearchPage.jsx
import React, { useEffect, useState } from "react";
import PageFrame from "./PageFrame.jsx";
import WordSearch from "../components/WordSearch.jsx";
import AnswerSheet from "../components/AnswerSheet.jsx";
import { exportPagesToPDF } from "../utils/exportPDF.js";
import { makeSeed, generateWordSearch } from "../utils/wordSearchGenerator.js";

const DEFAULT = {
  title: "Animals",
  words: ["ELEPHANT","GIRAFFE","DOLPHIN","BUTTERFLY","KANGAROO","SHEEP","HORSE","CAMEL","ZEBRA","MONKEY","PANDA","WHALE"]
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",").map(s => s.trim().toLowerCase());
  const themeIdx = header.indexOf("theme");
  const wordIdx = header.indexOf("word");
  const groups = new Map();
  for (let i=1;i<lines.length;i++) {
    const parts = lines[i].split(",").map(s => s.trim());
    if (!parts.length) continue;
    const theme = themeIdx >= 0 ? (parts[themeIdx] || "Untitled") : "Untitled";
    const word = wordIdx >= 0 ? (parts[wordIdx] || "") : (parts[0] || "");
    if (!word) continue;
    if (!groups.has(theme)) groups.set(theme, []);
    groups.get(theme).push(word);
  }
  return Array.from(groups.entries()).map(([title, words]) => ({ title, words }));
}

function downloadJSON(obj, filename = "batch.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function WordSearchPage(){
  const [current, setCurrent] = useState(DEFAULT);
  const [rows, setRows] = useState(14);
  const [cols, setCols] = useState(14);
  const [showAnswers, setShowAnswers] = useState(false);
  const [seed, setSeed] = useState(makeSeed("animals-" + Date.now()));
  const [batch, setBatch] = useState([]);
  const [minAnswerCell, setMinAnswerCell] = useState(28); // px, adaptive paging

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("../data/loadTheme.js");
        if (mod && typeof mod.loadTheme === "function") {
          const THEME = mod.loadTheme("animals");
          const p = (THEME?.puzzles || []).find(x => x.type === "word_search") || THEME?.puzzles?.[0];
          if (p) setCurrent(p);
        }
      } catch (_e) {}
    })();
  }, []);

  function onCSVFilesChosen(files, toBatch = false) {
    const fileArr = Array.from(files || []);
    if (!fileArr.length) return;
    fileArr.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => {
        const groups = parseCSV(String(reader.result || ""));
        if (!groups.length) return;
        if (toBatch) {
          setBatch(prev => [
            ...prev,
            ...groups.map(g => ({ title: g.title || f.name.replace(/\.csv$/i, ''), words: g.words, rows, cols, seed: makeSeed((g.title || f.name)+Date.now()) }))
          ]);
        } else {
          const g = groups[0];
          setCurrent({ title: g.title || f.name.replace(/\.csv$/i, ''), words: g.words });
          setSeed(makeSeed((g.title || f.name) + Date.now()));
        }
      };
      reader.readAsText(f);
    });
  }

  function addCurrentToBatch() { setBatch(prev => [...prev, { title: current.title || "Untitled", words: current.words || [], rows, cols, seed }]); }
  function clearBatch() { setBatch([]); }
  function onUploadBatchJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(obj.items)) {
          setBatch(obj.items.map(it => ({
            title: it.title || "Untitled",
            words: Array.isArray(it.words) ? it.words : [],
            rows: Number(it.rows) || rows,
            cols: Number(it.cols) || cols,
            seed: Number(it.seed) || makeSeed((it.title || "Untitled")+Math.random())
          })));
        }
      } catch (e) { alert("Invalid batch JSON"); }
    };
    reader.readAsText(file);
  }
  function downloadBatchFile() { downloadJSON({ version: 1, items: batch }, "wordsearch_batch.json"); }

  // === Adaptive Answer Key exporter ===
  function exportBatchPdfWS(){
    const items = batch.length ? batch : (current ? [{ title: current.title, words: current.words, rows, cols, seed }] : []);
    if (!items.length){ alert("No puzzles to export. Add to batch or load a CSV."); return; }

    const serial = items.map(it => {
      const { grid, placements } = generateWordSearch(it.words, it.rows||14, it.cols||14, it.seed);
      return { title: it.title || "Word Search", rows: it.rows || 14, cols: it.cols || 14, grid, placements, words: it.words || [] };
    });

    const mmToPx = (mm)=> (mm/25.4)*96;
    const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12;
    const CONTENT_W_PX = Math.floor(mmToPx(PAGE_W_MM - 2*MARGIN_MM));
    const CONTENT_H_PX = Math.floor(mmToPx(PAGE_H_MM - 2*MARGIN_MM));
    const HEADER_H_PX = 100, FOOTER_H_PX = 44;
    const USABLE_H_PX = CONTENT_H_PX - HEADER_H_PX - FOOTER_H_PX;

    const renderGrid = (obj, showAnswers=false, cellSize=null)=>{
      const R=obj.rows, C=obj.cols;
      const cell = cellSize ?? 38;
      const hi = new Set();
      if (showAnswers) for (const p of obj.placements){ for (const c of p.cells){ hi.add(`${c.r},${c.c}`); } }
      let html = `<div class="ws-grid" style="grid-template-columns: repeat(${C}, ${cell}px); grid-template-rows: repeat(${R}, ${cell}px);">`;
      for (let r=0;r<R;r++){ for (let c=0;c<C;c++){ const ch = obj.grid[r][c]; const isHi = hi.has(`${r},${c}`); html += `<div class="ws-cell${isHi?' hi':''}" style="--cell:${cell}px">${ch}</div>`; } }
      html += `</div>`; return html;
    };

    const pageOpen = (title, subtitle="") => `<div class="_a4 page"><div class="content"><div class="headerbox"><div class="title">${title}</div>${subtitle?`<div class="subtitle">${subtitle}</div>`:''}</div>`;
    const pageClose = () => `<div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div></div></div>`;

    // Puzzle pages first
    let body = "";
    for (let i=0;i<serial.length;i++){
      const puz = serial[i];
      const gridH = Math.floor(USABLE_H_PX * 0.62);
      const cellW = Math.floor(CONTENT_W_PX / puz.cols);
      const cellH = Math.floor(gridH / puz.rows);
      const cell = Math.max(26, Math.min(56, Math.min(cellW, cellH)));
      const wordList = `<div class="ws-list"><h3>Word List</h3><div class="ws-columns">${(puz.words||[]).map(w=>`<span>${w}</span>`).join("")}</div></div>`;

      body += pageOpen(`Word Search — ${puz.title}`, "Find all the words hidden horizontally and vertically. No diagonals, no reverse words.") +
              `<div class="ws-wrap">${renderGrid(puz, false, cell)}${wordList}</div>` +
              pageClose();
    }

    // Adaptive tiling for Answer pages
    const MIN_CELL = Math.max(18, Math.min(48, Number(minAnswerCell) || 28));
    let idx = 0;
    while (idx < serial.length) {
      // Try to pack as many as possible while keeping cell >= MIN_CELL
      let bestCols = 1, bestCell = 0, take = 1;
      // Start optimistic with up to 12 per page
      for (let tryTake = Math.min(12, serial.length - idx); tryTake >= 1; tryTake--) {
        const group = serial.slice(idx, idx + tryTake);
        // choose columns: never less than 2 if we have ≥2 tiles
        const minCols = group.length >= 2 ? 2 : 1;
        let localBest = { cols:minCols, cell:0 };
        for (let cols=minCols; cols<=4 && cols<=group.length; cols++){
          const rows = Math.ceil(group.length / cols);
          const tileW = (CONTENT_W_PX - (cols-1)*12) / cols;
          const tileH = (USABLE_H_PX - (rows-1)*12) / rows;
          let minCell = 999;
          for (const puz of group){
            const cW = Math.floor(tileW / puz.cols);
            const cH = Math.floor((tileH - 22) / puz.rows);
            const cp = Math.max(16, Math.min(64, Math.min(cW, cH)));
            if (cp < minCell) minCell = cp;
          }
          if (minCell > localBest.cell) localBest = { cols, cell: minCell };
        }
        // accept this try if we meet the minimum cell requirement
        if (localBest.cell >= MIN_CELL) {
          bestCols = localBest.cols; bestCell = localBest.cell; take = tryTake;
          break; // largest tryTake that meets MIN_CELL (because we go descending)
        }
        // else continue with smaller tryTake
      }
      const group = serial.slice(idx, idx + take);
      const tiles = group.map((puz, j)=>{
        const idxGlobal = idx + j + 1;
        return `<div class="ws-ans-item"><div class="ws-ans-title">Answer – #${idxGlobal}</div>${renderGrid(puz,true,bestCell||MIN_CELL)}</div>`;
      }).join("");

      body += pageOpen("Answer Key") +
              `<div class="ws-answers" style="grid-template-columns: repeat(${Math.max( group.length>=2 ? 2 : 1, bestCols )}, minmax(0, 1fr)); width:${CONTENT_W_PX}px; margin:0 auto; --gap:12px">${tiles}</div>` +
              pageClose();
      idx += take;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Word Search – Printable</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { height: 100%; }
  body { font-family: Inter, system-ui, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; }
  ._a4 { width: 210mm; min-height: 297mm; margin: 0 auto; box-sizing: border-box; padding: 12mm; }
  .page { page-break-after: always; position: relative; background:#fff; }
  .content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height: calc(297mm - 24mm); }
  .headerbox { width:100%; max-width:100%; min-height:100px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
               background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom:12px; }
  .title { font-size:22px; font-weight:800; text-align:center; }
  .subtitle { font-size:13px; color:#4b5563; margin-top:4px; }
  .footer { width:100%; display:flex; justify-content:center; margin-top:12px; }
  .footerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:6px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size:13px; font-weight:600; color:#374151; }
  .ws-wrap { width:100%; max-width:100%; display:flex; flex-direction:column; align-items:center; gap:16px; }
  .ws-grid { display:grid; gap:0; background:#111827; }
  .ws-cell { display:grid; place-items:center; background:#fff; border:1px solid #111827; width: var(--cell, 38px); height: var(--cell, 38px); font-weight:800; font-size: calc(var(--cell,38px) * 0.48); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .ws-cell.hi { background:#FEF3C7; }
  .ws-list { width:100%; max-width:100%; }
  .ws-list h3 { font-size:16px; font-weight:800; margin: 0 0 6px; text-align:left; }
  .ws-columns { column-count: 4; column-gap: 12px; }
  .ws-columns span { display:block; font-size:13px; line-height:1.5; break-inside: avoid; }
  .ws-answers { display:grid; grid-auto-flow: row dense; justify-items:stretch; align-content:start; gap: var(--gap, 12px); width:100%; }
  .ws-ans-item { display:flex; flex-direction:column; align-items:center; width:100%; }
  .ws-ans-title { font-size:14px; font-weight:800; margin:6px 0; }
</style>
</head><body><div id="doc">${body}
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script>(function(){
  const { jsPDF } = window.jspdf;
  const pages = Array.from(document.querySelectorAll('._a4'));
  const total = pages.length;
  const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });

  const overlay = document.createElement('div');
  overlay.id='pp-progress';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Inter,system-ui,sans-serif;';
  overlay.innerHTML='<div style="width:420px;max-width:90vw;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:16px;"><h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827">Exporting PDF…</h3><div style="width:100%;height:10px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin:10px 0"><div id="pp-bar" style="height:100%;width:0%;background:#2563eb;transition:width .2s"></div></div><div style="font-size:12px;color:#4b5563;display:flex;justify-content:space-between"><span id="pp-count">0/0</span><span id="pp-tip">Rendering…</span></div></div>';
  document.body.appendChild(overlay);
  const bar = document.getElementById('pp-bar');
  const count = document.getElementById('pp-count');
  const tip = document.getElementById('pp-tip');
  const dpr = window.devicePixelRatio || 1;
  const SCALE = Math.min(3, Math.max(2, dpr * 2));
  function update(i){ bar.style.width = Math.round((i/total)*100) + '%'; count.textContent = i + '/' + total; }
  async function renderPage(el, index){
    tip.textContent = 'Rendering page ' + (index+1);
    await new Promise(r=>setTimeout(r,0));
    const canvas = await html2canvas(el, { scale:SCALE, backgroundColor:'#ffffff', useCORS:true, windowWidth: el.offsetWidth, windowHeight: el.offsetHeight });
    const imgData = canvas.toDataURL('image/png');
    if (index===0) pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    else { pdf.addPage('a4','portrait'); pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); }
  }
  (async function(){
    for (let i=0;i<total;i++){ await renderPage(pages[i], i); update(i+1); }
    tip.textContent='Saving PDF…'; await new Promise(r=>setTimeout(r,0)); pdf.save('wordsearch-pack.pdf');
    setTimeout(()=>window.close(), 400);
  })().catch(err=>{ console.error(err); alert('Failed to generate PDF. See console.'); });
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
          <h1 className="text-lg font-bold">Word Search</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span>Rows</span>
              <input type="number" value={rows} min={8} max={30} onChange={e=>setRows(Number(e.target.value)||14)} className="w-16 border rounded px-2 py-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span>Cols</span>
              <input type="number" value={cols} min={8} max={30} onChange={e=>setCols(Number(e.target.value)||14)} className="w-16 border rounded px-2 py-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)} />
              Show answers
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span>Min answer cell (px)</span>
              <input type="number" min={18} max={48} value={minAnswerCell} onChange={e=>setMinAnswerCell(Number(e.target.value)||28)} className="w-20 border rounded px-2 py-1" />
            </label>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={()=>window.print()} className="px-3 py-1 rounded-xl border text-sm">Print</button>
            <button onClick={() => exportPagesToPDF({ filename: 'word-search.pdf', marginMM: 10, imageFit: 'contain', footer: true })} className="px-3 py-1 rounded-xl border text-sm">Export PDF (DOM)</button>
            <button onClick={exportBatchPdfWS} className="px-3 py-1 rounded-xl bg-black text-white text-sm">Export PDF (Kakuro-style)</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <details className="bg-white border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">Instructions</summary>
          <ol className="list-decimal ml-5 mt-3 space-y-1 text-sm">
            <li>Use <b>Browse CSV</b> to load words from a file with headers <code>theme,word</code>. The first theme becomes the puzzle title.</li>
            <li>Words are placed left→right and top→bottom only (no diagonals, no reverse).</li>
            <li>Adjust <b>Rows/Cols</b> to resize the grid.</li>
            <li>Click <b>Add to Batch</b> or use <b>Browse CSV to Batch</b> for multiple puzzles.</li>
            <li><b>Answer Sheets</b> are auto-sized to keep grids readable (uses your <i>Min answer cell</i>).</li>
            <li>Export via <b>Export PDF (Kakuro-style)</b> for the same pipeline/look as Kakuro.</li>
          </ol>
        </details>

        <PageFrame
          title={`Word Search — ${current?.title || "Puzzle"}`}
          subtitle="Find all the words hidden horizontally and vertically. No diagonals, no reverse words."
          footer="Created with HMQUIZ Studio"
        >
          <WordSearch data={current} showAnswers={showAnswers} rows={rows} cols={cols} seed={seed} cellPx={38} showWordList={true} />
        </PageFrame>

        {/* Batch controls */}
        <div className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-4 print:hidden">
          <div className="space-y-2">
            <div className="font-medium">Load a CSV for the current puzzle</div>
            <input type="file" accept=".csv" onChange={e=>onCSVFilesChosen(e.target.files, false)} />
            <div className="text-xs opacity-70">Expected headers: <code>theme,word</code>.</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Add one or more CSVs to Batch</div>
            <input type="file" accept=".csv" multiple onChange={e=>onCSVFilesChosen(e.target.files, true)} />
            <div className="text-xs opacity-70">Each theme forms a separate puzzle entry.</div>
          </div>
          <div className="space-y-2">
            <button onClick={()=>addCurrentToBatch()} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm">Add current to Batch</button>
            <button onClick={()=>downloadBatchFile()} className="ml-2 px-3 py-1 rounded-lg border text-sm">Download Batch File</button>
            <label className="ml-2 text-sm inline-flex items-center gap-2">
              <span className="border rounded px-2 py-1">Upload Batch JSON</span>
              <input type="file" accept="application/json" className="hidden" onChange={e=> e.target.files?.[0] && onUploadBatchJSON(e.target.files[0])} />
            </label>
          </div>
          <div className="space-y-2">
            <button onClick={()=>clearBatch()} className="px-3 py-1 rounded-lg border text-sm">Clear Batch</button>
            <div className="text-xs opacity-70">Batch size: {batch.length}</div>
          </div>
        </div>

        {/* Preview answer pages (optional) */}
        {batch.length > 0 && (
          <div className="opacity-70 text-sm">Answer Key pages will be auto-sized during export to keep cells ≥ {minAnswerCell}px.</div>
        )}
      </div>

      <style>{`@page{size:A4;margin:0} @media print{.sticky{display:none!important}}`}</style>
    </div>
  );
}
