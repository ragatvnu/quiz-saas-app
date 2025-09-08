// src/pages/KakuroPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PATTERNS } from "../utils/kakuroCore.js";
import KakuroGrid from "../components/KakuroGrid.jsx";

const k = (r,c)=>`${r},${c}`;

// Safe HTML escape
const HTML_ENTITIES = { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" };
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]); }

function defaultBudget(layout){
  if (layout==="RANDOM-9" || layout==="AUTO" || /9x9/.test(layout)) return 1400;
  return 750;
}

export default function KakuroPage(){
  const [layout, setLayout] = useState("RANDOM-7");
  const [randOrient, setRandOrient] = useState(true);
  const [strict, setStrict] = useState(true);
  const [budget, setBudget] = useState(defaultBudget("RANDOM-7"));

  const [puzzle, setPuzzle] = useState(null);
  const [entries, setEntries] = useState({});
  const [incorrect, setIncorrect] = useState(new Set());
  const [showAns, setShowAns] = useState(false);

  const [batchCount, setBatchCount] = useState(10);
  const [answersPerPage, setAnswersPerPage] = useState(4);
  const [includeInstrPage, setIncludeInstrPage] = useState(true);
  const [instrText, setInstrText] = useState(
`Fill white cells with digits 1–9. No repeats in a run.
Top-right number on a black cell is the sum for the row run to its right.
Bottom-left number is the sum for the column run below it.
Each crossing cell must satisfy both its across and down sums.
Use Check to highlight mismatches. Use Clear to erase entries.`
  );

  const [lastBatch, setLastBatch] = useState([]); // array of { puzzle, uniq, valid }
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const workerRef = useRef(null);

  const cellPx = (puzzle?.rows||0) >= 9 ? 40 : 46;
  const grid = useMemo(()=>{
    if (!puzzle) return null;
    const { rows, cols, cells, values } = puzzle;
    const g = Array.from({length:rows},()=>Array.from({length:cols},()=>({type:"block"})));
    for (const cell of cells){
      if (cell.type==="empty"){
        g[cell.r][cell.c] = { type:"empty", user: entries[k(cell.r,cell.c)] ?? "", answer: values?.[k(cell.r,cell.c)] ?? "" };
      }else{
        g[cell.r][cell.c] = { type:"block", right: cell.right ?? null, down: cell.down ?? null };
      }
    }
    return g;
  }, [puzzle, entries]);

  useEffect(()=>{
    const w = new Worker(new URL("../workers/kakuroUnique.worker.js", import.meta.url), { type:"module" });
    workerRef.current = w;
    w.onmessage = (e)=>{
      const { type, puzzle, uniq, valid, puzzles, message } = e.data || {};
      setBusy(false);
      if (type==="result" && puzzle){
        setPuzzle(puzzle); setEntries({}); setIncorrect(new Set()); setShowAns(false);
        setInfo(`size=${puzzle.rows}×${puzzle.cols} • unique=${uniq===1} • issues=${valid.ok? "none": valid.issues.join(", ")}`);
      } else if (type==="result" && puzzles){
        const good = puzzles.filter(x=>x?.puzzle);
        if (good.length){
          setPuzzle(good[0].puzzle);
          setLastBatch(good);
          setEntries({}); setIncorrect(new Set()); setShowAns(false);
          setInfo(`batch=${good.length} ready • first size=${good[0].puzzle.rows}×${good[0].puzzle.cols}`);
        } else {
          setInfo("No puzzles generated.");
        }
      } else if (type==="error"){
        setInfo(`Worker error: ${message}`);
      }
    };
    w.onerror = (err)=>{ setBusy(false); setInfo("Worker crashed"); console.error(err); };
    generateOne();
    return ()=> w.terminate();
  }, []);

  useEffect(()=>{ setBudget(defaultBudget(layout)); }, [layout]);

  function postGen(msg){
    if (!workerRef.current) return;
    setBusy(true); setInfo(msg);
    workerRef.current.postMessage({ type:"generate", opts:{
      patternName: layout,
      randomizeOrientation: randOrient,
      requireUnique: strict,
      timeBudgetMs: budget,
      maxAttempts: 140,
    }});
  }
  function generateOne(){ postGen("Generating…"); }
  function generateBatch(){
    if (!workerRef.current) return;
    const n = Math.max(1, Math.min(50, parseInt(batchCount||'10',10)));
    setBusy(true); setInfo("Batch…");
    workerRef.current.postMessage({ type:"batch", batch:{ n, opts:{
      patternName: layout,
      randomizeOrientation: randOrient,
      requireUnique: strict,
      timeBudgetMs: budget,
      maxAttempts: 140,
    }}});
  }

  function onEdit(r,c,val){
    setIncorrect(new Set());
    setEntries(m=>{ const cp={...m}; if (val) cp[k(r,c)]=val; else delete cp[k(r,c)]; return cp; });
  }
  function clearAll(){ setEntries({}); setIncorrect(new Set()); setShowAns(false); }
  function checkNow(){
    if (!puzzle) return;
    const wrong=new Set();
    for (const [pos, val] of Object.entries(entries)){
      const ans = puzzle.values?.[pos];
      if (!ans || String(ans)!==String(val)) wrong.add(pos);
    }
    setIncorrect(wrong);
  }

  // === PDF Export (answers can be multiple per page) ===
  function exportBatchPdf(){
    const items = lastBatch.length ? lastBatch : (puzzle ? [{puzzle}] : []);
    if (!items.length){ alert("No puzzles to export. Generate a batch first."); return; }

    // Serialize minimal data for building HTML now
    const serial = items
      .filter(it => it && it.puzzle)
      .map(({puzzle}) => ({
        rows: puzzle.rows,
        cols: puzzle.cols,
        cells: puzzle.cells.map(c => ({ type:c.type, r:c.r, c:c.c, right:c.right ?? null, down:c.down ?? null })),
        values: puzzle.values || {}
      }));

    const includeInstr = !!includeInstrPage;
    const instrLines = String(instrText).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

    // A4 constants + px conversion @ 96dpi
    const mmToPx = (mm)=> (mm/25.4)*96;
    const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12;
    const CONTENT_W_PX = Math.floor(mmToPx(PAGE_W_MM - 2*MARGIN_MM));
    const CONTENT_H_PX = Math.floor(mmToPx(PAGE_H_MM - 2*MARGIN_MM));
    const HEADER_H_PX = 100, FOOTER_H_PX = 44;
    const USABLE_H_PX = CONTENT_H_PX - HEADER_H_PX - FOOTER_H_PX;

    // Grid renderers (server-side string building)
    const renderGrid = (puz, showAnswers=false, forcedCellPx=null)=>{
      const R=puz.rows, C=puz.cols, v=puz.values||{};
      const cell = forcedCellPx ?? 46;
      const cells=[];
      for (let r=0;r<R;r++){
        for (let c=0;c<C;c++){
          const obj = puz.cells[r*C + c];
          if (obj.type==='empty'){
            const ans = showAnswers ? (v[`${r},${c}`]||"") : "";
            cells.push(`<div class="kcell" style="--cell:${cell}px">${ans ? `<div class="ans">${escapeHtml(ans)}</div>` : ""}</div>`);
          } else {
            const hasClue = (obj.right!=null) || (obj.down!=null);
            const diag = hasClue ? `<svg class="diag" width="${cell}" height="${cell}"><line x1="0" y1="0" x2="${cell}" y2="${cell}" stroke="#374151" stroke-width="2"/></svg>` : "";
            const rtxt = obj.right!=null ? `<div class="sumR">${obj.right}</div>` : "";
            const dtxt = obj.down !=null ? `<div class="sumD">${obj.down }</div>` : "";
            cells.push(`<div class="kcell blk" style="--cell:${cell}px">${diag}${rtxt}${dtxt}</div>`);
          }
        }
      }
      return `<div class="grid" style="grid-template-columns: repeat(${C}, ${cell}px); grid-template-rows: repeat(${R}, ${cell}px);">${cells.join('')}</div>`;
    };

    const pageOpen = (title) =>
      `<div class="_a4 page"><div class="content"><div class="headerbox"><div class="title">${escapeHtml(title)}</div></div>`;
    const pageClose = () => `<div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div></div></div>`;

    // Build HTML body
    let body = "";

    // Optional instructions page
    if (includeInstr){
      const items = instrLines.map(s=>`<li>${escapeHtml(s)}</li>`).join("");
      body += pageOpen("How to Play Kakuro") +
              `<div class="instr"><h2>Instructions</h2><ol>${items}</ol></div>` +
              pageClose();
    }

    // Puzzles (1 per page) with computed cell size to fit content area
    for (let i=0;i<serial.length;i++){
      const puz = serial[i];
      const cellW = Math.floor(CONTENT_W_PX / puz.cols);
      const cellH = Math.floor(USABLE_H_PX / puz.rows);
      const singleCell = Math.max(28, Math.min(56, Math.min(cellW, cellH)));
      body += pageOpen(`Kakuro #${i+1}`) + renderGrid(puz, false, singleCell) + pageClose();
    }

    // Answers tiled: multiple per page
    const per = Math.max(1, Math.min(12, Number(answersPerPage) || 1));
    for (let i=0; i<serial.length; i+=per){
      const group = serial.slice(i, i+per);

      // pick COLS 1..4 that maximizes min cell size across tiles
      let best = { cols:1, cell:24 };
      for (let cols=1; cols<=4; cols++){
        const rows = Math.ceil(group.length / cols);
        const tileW = (CONTENT_W_PX - (cols-1)*12) / cols;
        const tileH = (USABLE_H_PX - (rows-1)*12) / rows;
        let minCell = 999;
        for (const puz of group){
          const cW = Math.floor(tileW / puz.cols);
          const cH = Math.floor((tileH - 24) / puz.rows); // 24px title
          const cp = Math.max(18, Math.min(44, Math.min(cW, cH)));
          if (cp < minCell) minCell = cp;
        }
        if (minCell > best.cell) best = { cols, cell: minCell };
      }

      const COLS = best.cols, CELL = best.cell;
      const tiles = group.map((puz, j)=>{
        const idxGlobal = i + j + 1;
        return `<div class="ans-item"><div class="ans-title">Answer – #${idxGlobal}</div>${renderGrid(puz,true,CELL)}</div>`;
      }).join("");

      body += pageOpen("Answer Key") +
              `<div class="answers-wrap" style="grid-template-columns: repeat(${COLS}, auto); --gap:12px">${tiles}</div>` +
              pageClose();
    }

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Kakuro – Printable</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { height: 100%; }
  body { font-family: Inter, system-ui, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; }
  ._a4 { width: ${PAGE_W_MM}mm; min-height: ${PAGE_H_MM}mm; margin: 0 auto; box-sizing: border-box; padding: ${MARGIN_MM}mm; }
  .page { page-break-after: always; position: relative; background:#fff; }
  .content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height:${CONTENT_H_PX}px; }
  .headerbox { width:100%; max-width:${CONTENT_W_PX}px; min-height:${HEADER_H_PX}px; display:flex; align-items:center; justify-content:center; text-align:center;
               background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom:12px; }
  .title { font-size:22px; font-weight:800; text-align:center; }
  .grid { display:grid; gap:0; background:#111; }
  .kcell { display:grid; place-items:center; background:#fff; border:1px solid #000; width: var(--cell, 44px); height: var(--cell, 44px); }
  .blk { background:#111827; color:#fff; position:relative; }
  .blk .diag { position:absolute; inset:0; }
  .blk .sumR { position:absolute; top:4px; right:6px; font-size:calc(var(--cell,44px)*0.26); color:#e5e7eb; font-weight:700; }
  .blk .sumD { position:absolute; bottom:4px; left:6px; font-size:calc(var(--cell,44px)*0.26); color:#e5e7eb; font-weight:700; }
  .ans { font-weight:800; font-size:calc(var(--cell,44px)*0.42); }
  .footer { width:100%; display:flex; justify-content:center; margin-top:12px; }
  .footerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:6px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size:13px; font-weight:600; color:#374151; }
  .answers-wrap { display:grid; justify-content:center; align-content:start; gap: var(--gap, 12px); width:100%; max-width:${CONTENT_W_PX}px; }
  .ans-item { display:flex; flex-direction:column; align-items:center; }
  .ans-title { font-size:14px; font-weight:800; margin:6px 0; }
  .instr { width:100%; max-width:${CONTENT_W_PX}px; background: rgba(255,255,255,0.96);
           border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  .instr h2 { font-size:18px; font-weight:800; margin:0 0 8px; text-align:center; }
  .instr ol, .instr ul { margin:0; padding-left:18px; }
  .instr li { font-size:14px; line-height:1.5; margin:4px 0; }
</style>
</head><body><div id="doc">${body}
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script>(function(){
  const { jsPDF } = window.jspdf;
  const pages = Array.from(document.querySelectorAll('._a4'));
  const total = pages.length;
  const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });

  // Simple progress (optional)
  const overlay = document.createElement('div');
  overlay.id='pp-progress';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Inter,system-ui,sans-serif;';
  overlay.innerHTML='<div style="width:420px;max-width:90vw;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:16px;"><h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827">Exporting PDF…</h3><div style="width:100%;height:10px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin:10px 0"><div id="pp-bar" style="height:100%;width:0%;background:#2563eb;transition:width .2s"></div></div><div style="font-size:12px;color:#4b5563;display:flex;justify-content:space-between"><span id="pp-count">0/0</span><span id="pp-tip">Rendering…</span></div></div>';
  document.body.appendChild(overlay);
  const bar = document.getElementById('pp-bar');
  const count = document.getElementById('pp-count');
  const tip = document.getElementById('pp-tip');
  const isFirefox = /Firefox\\//.test(navigator.userAgent);
  const SCALE = isFirefox ? 1.5 : 2;
  const QUALITY = 0.92;
  function update(i){ bar.style.width = Math.round((i/total)*100) + '%'; count.textContent = i + '/' + total; }
  async function renderPage(el, index){
    tip.textContent = 'Rendering page ' + (index+1);
    await new Promise(r=>setTimeout(r,0));
    const canvas = await html2canvas(el, { scale:SCALE, backgroundColor:'#ffffff', useCORS:true, letterRendering:true, windowWidth: el.offsetWidth, windowHeight: el.offsetHeight });
    const imgData = canvas.toDataURL('image/jpeg', QUALITY);
    if (index===0) pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    else { pdf.addPage('a4','portrait'); pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297); }
  }
  (async function(){
    for (let i=0;i<total;i++){ await renderPage(pages[i], i); update(i+1); }
    tip.textContent='Saving PDF…'; await new Promise(r=>setTimeout(r,0)); pdf.save('kakuro-pack.pdf');
    setTimeout(()=>window.close(), 400);
  })().catch(err=>{ console.error(err); alert('Failed to generate PDF. See console.'); });
})();</script>
</div></body></html>`;

    const w = window.open("", "_blank");
    if (!w){ alert("Popup blocked — allow popups to export PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  return (
    <div className="container mx-auto p-4 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">🟧 Kakuro (Batch + PDF)</h1>
        <a href="/hub.html" className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 text-sm">← Hub</a>
      </div>

      <div className="grid md:grid-cols-[1fr_560px] gap-4">
        <div className="rounded-xl p-3 border bg-white min-h-[320px] relative">
          {!grid && !busy && <div className="text-sm text-gray-500">No puzzle yet.</div>}
          {grid && <KakuroGrid grid={grid} showAnswers={showAns} incorrect={incorrect} onEdit={showAns? undefined : onEdit} cell={cellPx} />}
          {busy && (
            <div className="absolute inset-0 bg-white/70 grid place-items-center">
              <div className="px-3 py-2 border rounded-lg bg-white shadow text-sm">Working…</div>
            </div>
          )}
        </div>

        <div className="rounded-xl p-3 border bg-white">
          <h3 className="font-semibold mb-2">Generator</h3>
          <div className="grid gap-2 mb-3">
            <label className="flex items-center gap-2">
              Layout
              <select className="border rounded px-2 py-1" value={layout} onChange={e=>setLayout(e.target.value)}>
                <option value="RANDOM-7">Random 7×7</option>
                <option value="RANDOM-9">Random 9×9</option>
                <option value="AUTO">Auto (mix sizes)</option>
                <option disabled>──────────</option>
                {Object.keys(PATTERNS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={randOrient} onChange={e=>setRandOrient(e.target.checked)} />
              Randomize orientation (rotate/flip)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={strict} onChange={e=>setStrict(e.target.checked)} />
              Require unique solution
            </label>
            <label className="flex items-center gap-2">
              Max time (ms)
              <input type="number" min="300" max="3000" step="50" value={budget}
                     onChange={e=>setBudget(parseInt(e.target.value||defaultBudget(layout),10))}
                     className="border rounded px-2 py-1 w-28" />
            </label>
          </div>

          <h3 className="font-semibold mb-2">Batch</h3>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              Count
              <input type="number" min="1" max="50" value={batchCount}
                     onChange={e=>setBatchCount(e.target.value)} className="border rounded px-2 py-1 w-24" />
            </label>
            <label className="flex items-center gap-2">
              Answers per page
              <select value={answersPerPage} onChange={e=>setAnswersPerPage(parseInt(e.target.value,10))}
                      className="border rounded px-2 py-1">
                {[1,2,3,4,5,6,8,9,10,12].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button onClick={generateBatch} disabled={busy} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              {busy ? "…" : "Generate Batch"}
            </button>
            <span className="text-xs text-gray-600">{lastBatch.length ? `${lastBatch.length} ready` : "–"}</span>
          </div>

          <div className="grid gap-2 mb-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeInstrPage} onChange={e=>setIncludeInstrPage(e.target.checked)} />
              Include instructions page in PDF
            </label>
            <textarea rows="5" value={instrText} onChange={e=>setInstrText(e.target.value)}
                      className="border rounded px-2 py-1 text-sm" />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={generateOne} disabled={busy} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              {busy ? "Working…" : "New Puzzle"}
            </button>
            <button onClick={()=>setShowAns(s=>!s)} disabled={!puzzle} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              {showAns ? "Hide Answers" : "Show Answers"}
            </button>
            <button onClick={checkNow} disabled={!puzzle || showAns} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              Check
            </button>
            <button onClick={clearAll} disabled={!puzzle} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              Clear
            </button>
            <button onClick={exportBatchPdf} disabled={busy || (!lastBatch.length && !puzzle)} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
              Export PDF (Answers end, multi/pg)
            </button>
          </div>

          <div className="text-xs text-gray-600 whitespace-pre-wrap mt-3">{info}</div>

          {/* --- How to Play (Instructions) --- */}
          <div className="rounded-xl p-3 border bg-white mt-4">
            <h3 className="font-semibold mb-2">How to Play Kakuro</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>
                Fill the <span className="font-semibold">white cells</span> with digits
                <span className="font-semibold"> 1–9</span>.
              </li>
              <li>
                A triangle/clue cell gives a <span className="font-semibold">sum</span>:
                the small number at the <span className="font-semibold">top-right</span> is the
                sum for the run to the right; the small number at the
                <span className="font-semibold"> bottom-left</span> is the sum for the run below.
              </li>
              <li>
                In each run, digits must add up to the sum and
                <span className="font-semibold"> cannot repeat</span>.
              </li>
              <li>
                Runs only interact where they cross—so a single cell must satisfy
                both its across and down sums.
              </li>
              <li>
                Use <span className="font-semibold">Check</span> to highlight mistakes.
                Use <span className="font-semibold">Clear</span> to erase entries.
                Toggle <span className="font-semibold">Show Answers</span> to reveal the solution.
              </li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              Tip: For 2–3-cell runs, list all digit sets that match the sum and eliminate
              any that clash at intersections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
