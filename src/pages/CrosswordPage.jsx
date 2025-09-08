// src/pages/CrosswordPage.jsx
import React, { useEffect, useState } from "react";

/* ---------- CSV utilities ---------- */
function parseCSV(text){
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");
  const sample = lines.slice(0, 5).join("\n");
  const candidates = [",",";","\t"];
  let delim = ",";
  let best = -1;
  for (const d of candidates){
    const cnt = (sample.match(new RegExp(`\\${d}`, "g"))||[]).length;
    if (cnt > best){ best = cnt; delim = d; }
  }
  const rows = [];
  let i = 0;
  while (i < lines.length){
    let line = lines[i++];
    if (line === undefined) break;
    if (line === "" && i === lines.length) break;
    const out = [];
    let cur = "";
    let inQ = false;
    for (let j=0; j<line.length; j++){
      const ch = line[j];
      if (ch === '"'){
        if (inQ && line[j+1] === '"'){ cur += '"'; j++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ){
        out.push(cur); cur="";
      } else {
        cur += ch;
      }
    }
    if (inQ && i < lines.length){
      line += "\n" + lines[i];
      lines[i-1] = line;
      continue;
    }
    out.push(cur);
    rows.push(out.map(s=>s.trim()));
  }
  while (rows.length && rows[rows.length-1].every(x => x==="")) rows.pop();
  return rows;
}
function mapColumns(header){
  const idx = { name: -1, clue: -1, answer: -1 };
  const lower = header.map(h => h.toLowerCase().trim());
  for (let i=0;i<lower.length;i++){
    const h = lower[i];
    if (idx.name   === -1 && /^(name|title|pack|group)$/.test(h)) idx.name = i;
    if (idx.clue   === -1 && /^(clue|question|hint)$/.test(h)) idx.clue = i;
    if (idx.answer === -1 && /^(answer|solution|word)$/.test(h)) idx.answer = i;
  }
  return idx;
}
function normalizeRows(rows){
  if (!rows.length) return [];
  const header = rows[0];
  let start = 0;
  let idx = { name:-1, clue:1, answer:2 };
  if (header.some(h => /name|clue|answer|solution|question/i.test(h))){
    idx = mapColumns(header); start = 1;
  } else if (header.length === 2){
    idx = { name:-1, clue:0, answer:1 };
  }
  const out = [];
  for (let r=start; r<rows.length; r++){
    const row = rows[r];
    const name = (idx.name >= 0 ? row[idx.name] : "").trim();
    const clue = (row[idx.clue] ?? "").trim();
    const ans  = (row[idx.answer] ?? "").trim();
    if (clue && ans) out.push({ name, clue, answer: ans.toUpperCase().replace(/[^A-Z]/g,"") });
  }
  return out;
}

/* ---------- Crossword packer (safe bounds) ---------- */
function buildCrossword(words, rows=15, cols=15, timeBudgetMs=900){
  const start = Date.now();
  const grid = Array.from({length:rows}, () => Array(cols).fill(null));
  const placements = [];
  const sorted = [...words].sort((a,b)=>b.answer.length - a.answer.length);
  if (!sorted.length) return { rows, cols, grid, placements, remaining: [] };

  function canPlace(r,c,dir,answer){
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (dir==='A'){
      if (c + answer.length > cols) return false;
      if (c > 0 && grid[r][c-1] && grid[r][c-1] !== '#') return false;
      if (c + answer.length < cols && grid[r][c+answer.length] && grid[r][c+answer.length] !== '#') return false;
      for (let i=0;i<answer.length;i++){
        const rr=r, cc=c+i;
        const g = grid[rr][cc];
        if (g === '#') return false;
        if (g && g !== answer[i]) return false;
        const above = rr>0 ? grid[rr-1][cc] : null;
        const below = rr<rows-1 ? grid[rr+1][cc] : null;
        if (!g && ((above && above !== '#') || (below && below !== '#'))) return false;
      }
      return true;
    } else {
      if (r + answer.length > rows) return false;
      if (r > 0 && grid[r-1][c] && grid[r-1][c] !== '#') return false;
      if (r + answer.length < rows && grid[r+answer.length][c] && grid[r+answer.length][c] !== '#') return false;
      for (let i=0;i<answer.length;i++){
        const rr=r+i, cc=c;
        const g = grid[rr][cc];
        if (g === '#') return false;
        if (g && g !== answer[i]) return false;
        const left  = cc>0 ? grid[rr][cc-1] : null;
        const right = cc<cols-1 ? grid[rr][cc+1] : null;
        if (!g && ((left && left !== '#') || (right && right !== '#'))) return false;
      }
      return true;
    }
  }
  function place(r,c,dir,answer){
    for (let i=0;i<answer.length;i++){
      const rr = dir==='A' ? r : r+i;
      const cc = dir==='A' ? c+i : c;
      grid[rr][cc] = answer[i];
    }
  }
  function bestPlacement(answer){
    let best = null, bestScore = -1;
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const ch = grid[r][c];
        if (!ch || ch==='#') continue;
        for (let i=0;i<answer.length;i++){
          if (answer[i] !== ch) continue;
          const ac = c - i;
          if (ac >= 0 && canPlace(r, ac, 'A', answer) && 10 > bestScore){ bestScore=10; best={r, c:ac, dir:'A'}; }
          const ar = r - i;
          if (ar >= 0 && canPlace(ar, c, 'D', answer) && 10 > bestScore){ bestScore=10; best={r:ar, c, dir:'D'}; }
        }
      }
      if (Date.now()-start > timeBudgetMs) break;
    }
    if (!best){
      for (let r=0;r<rows;r++){
        for (let c=0;c<cols;c++){
          if (canPlace(r,c,'A',answer)) return { r, c, dir:'A' };
          if (canPlace(r,c,'D',answer)) return { r, c, dir:'D' };
        }
      }
    }
    return best;
  }

  const first = sorted.shift();
  if (first.answer.length <= cols){
    const startC = Math.max(0, Math.floor((cols - first.answer.length)/2));
    const startR = Math.floor(rows/2);
    place(startR, startC, 'A', first.answer);
    placements.push({ answer: first.answer, clue: first.clue, row:startR, col:startC, dir:'A' });
  } else {
    return { rows, cols, grid, placements, remaining: [first, ...sorted] };
  }

  const remaining = [];
  for (const w of sorted){
    if (Date.now()-start > timeBudgetMs){ remaining.push(w); continue; }
    const pos = bestPlacement(w.answer);
    if (pos){
      place(pos.r, pos.c, pos.dir, w.answer);
      placements.push({ answer: w.answer, clue: w.clue, row:pos.r, col:pos.c, dir:pos.dir });
    } else {
      remaining.push(w);
    }
  }
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) if (grid[r][c] === null) grid[r][c] = '#';
  return { rows, cols, grid, placements, remaining };
}
function numberCrossword(model){
  const { rows, cols, grid, placements } = model;
  const num = Array.from({length:rows}, () => Array(cols).fill(0));
  let next = 1;
  const across = [], down = [];
  const mapA = new Map(), mapD = new Map();
  for (const p of placements){
    const key = `${p.row},${p.col}`;
    (p.dir==='A' ? mapA : mapD).set(key, p);
  }
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (grid[r][c] === '#') continue;
      const startA = (c===0 || grid[r][c-1] === '#') && (c+1<cols && grid[r][c+1] !== '#');
      const startD = (r===0 || grid[r-1][c] === '#') && (r+1<rows && grid[r+1][c] !== '#');
      if (startA || startD){
        num[r][c] = next;
        if (startA){
          const p = mapA.get(`${r},${c}`);
          if (p) across.push({ no: next, clue: p.clue, answer: p.answer, row:r, col:c, len: p.answer.length });
          else {
            let cc=c, ans=""; while (cc<cols && grid[r][cc] !== '#'){ ans += grid[r][cc]; cc++; }
            across.push({ no: next, clue: "", answer: ans, row:r, col:c, len: ans.length });
          }
        }
        if (startD){
          const p = mapD.get(`${r},${c}`);
          if (p) down.push({ no: next, clue: p.clue, answer: p.answer, row:r, col:c, len: p.answer.length });
          else {
            let rr=r, ans=""; while (rr<rows && grid[rr][c] !== '#'){ ans += grid[rr][c]; rr++; }
            down.push({ no: next, clue: "", answer: ans, row:r, col:c, len: ans.length });
          }
        }
        next++;
      }
    }
  }
  return { numbers:num, across, down };
}

/* ---------- UI grid ---------- */
function CrosswordGrid({ model, numbers, showAnswers }){
  if (!model) return null;
  const { rows, cols, grid } = model;
  const cell = (rows>=17 || cols>=17) ? 28 : (rows>=15 ? 32 : 36);
  const cells = [];
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const v = grid[r][c];
      if (v === '#'){
        cells.push(<div key={`${r},${c}`} className="kcell blk" style={{["--cell"]: `${cell}px`}} />);
      } else {
        cells.push(
          <div key={`${r},${c}`} className="kcell" style={{["--cell"]: `${cell}px`, position:'relative'}}>
            {numbers[r][c] ? <div className="num">{numbers[r][c]}</div> : null}
            {showAnswers ? <div className="ans">{v}</div> : null}
          </div>
        );
      }
    }
  }
  return (
    <div className="grid" style={{
      gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
      gridTemplateRows: `repeat(${rows}, ${cell}px)`
    }}>
      {cells}
      <style>{`
        .grid { display:grid; gap:0; background:#111; }
        .kcell { display:grid; place-items:center; background:#fff; border:1px solid #000; width: var(--cell, 36px); height: var(--cell, 36px); }
        .blk { background:#111827; color:#fff; }
        .num { position:absolute; top:2px; left:3px; font-size:10px; color:#111827; }
        .ans { font-weight:800; font-size:calc(var(--cell,36px)*0.46); color:#111827; }
      `}</style>
    </div>
  );
}

/* ---------- Page ---------- */
export default function CrosswordPage(){
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(15);
  const [budget, setBudget] = useState(900);
  const [csvRows, setCsvRows] = useState([]);
  const [groupMode, setGroupMode] = useState("name");
  const [chunkSize, setChunkSize] = useState(20);
  const [puzzle, setPuzzle] = useState(null);
  const [numbers, setNumbers] = useState(null);
  const [batch, setBatch] = useState([]);
  const [showAns, setShowAns] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [includeInstrPage, setIncludeInstrPage] = useState(true);
  const [answersPerPage, setAnswersPerPage] = useState(6);
  const [instrText, setInstrText] = useState(
`Fill the white squares with letters to solve the crossword.
Numbers mark the start of Across (→) and Down (↓) answers.
Across clues answer left-to-right; Down clues answer top-to-bottom.
Black squares (#) separate answers. Letters must match at crossings.
Tip: Start with the longest clues and use crossings to narrow options.`
  );

  function handleCSVFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const rows = parseCSV(String(reader.result||""));
        const norm = normalizeRows(rows);
        setCsvRows(norm);
        setInfo(`CSV loaded: ${norm.length} rows`);
      }catch(err){
        console.error(err);
        setInfo("Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  }

  function groupIntoPuzzles(){
    if (!csvRows.length){ setInfo("Load CSV first."); return []; }
    if (groupMode==='name'){
      const groups = new Map();
      for (const r of csvRows){
        const g = r.name || "Puzzle";
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push({ clue:r.clue, answer:r.answer });
      }
      return Array.from(groups.entries()).map(([name, list]) => ({ name, list }));
    } else {
      const size = Math.max(3, Math.min(64, parseInt(chunkSize||'20',10)));
      const list = csvRows.map(r=>({ clue:r.clue, answer:r.answer }));
      const out = [];
      for (let i=0;i<list.length;i+=size){
        out.push({ name: `Puzzle ${Math.floor(i/size)+1}`, list: list.slice(i, i+size) });
      }
      return out;
    }
  }

  function generateFromCSV(){
    const groups = groupIntoPuzzles();
    if (!groups.length){ setInfo("No groups to build."); return; }
    setBusy(true);
    setTimeout(() => {
      const produced = [];
      for (const g of groups){
        const model = buildCrossword(g.list, rows, cols, budget);
        const numbering = numberCrossword(model);
        produced.push({ name:g.name, model, numbering });
      }
      setBatch(produced);
      if (produced.length){
        setPuzzle(produced[0].model);
        setNumbers(produced[0].numbering.numbers);
        setInfo(`Generated ${produced.length} crossword(s). Previewing first.`);
      }
      setBusy(false);
    }, 0);
  }

  function exportPDF(){
    const produced = batch.length ? batch : (puzzle ? [{ name: "Crossword", model: puzzle, numbering: numberCrossword(puzzle) }] : []);
    if (!produced.length){ alert("Nothing to export. Generate from CSV first."); return; }

    const serial = produced.map(p => ({
      name: p.name,
      rows: p.model.rows,
      cols: p.model.cols,
      grid: p.model.grid,
      numbering: p.numbering || numberCrossword(p.model)
    }));

    const mmToPx = (mm)=> (mm/25.4)*96;
    const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12;
    const CONTENT_W_PX = Math.floor(mmToPx(PAGE_W_MM - 2*MARGIN_MM));
    const CONTENT_H_PX = Math.floor(mmToPx(PAGE_H_MM - 2*MARGIN_MM));
    const HEADER_H_PX = 90, FOOTER_H_PX = 44;
    const USABLE_H_PX = CONTENT_H_PX - HEADER_H_PX - FOOTER_H_PX;

    const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
    const colsFor = (n) => (n<=1?1 : n===2?1 : n===3?3 : n===4?2 : n===5?3 : n===6?3 : n<=8?4 : 3);
    const gapFor  = (n) => n<=4 ? mmToPx(10) : n<=8 ? mmToPx(8) : mmToPx(6);

    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    function renderGrid(puz, numbers=null, showLetters=false, cellPx=null){
      const R=puz.rows, C=puz.cols;
      const cell = cellPx ?? Math.max(22, Math.min(40, Math.floor(Math.min(CONTENT_W_PX/C, (USABLE_H_PX-260)/R))));
      const cells=[];
      for (let r=0;r<R;r++){
        for (let c=0;c<C;c++){
          const v = puz.grid[r][c];
          if (v === '#'){
            cells.push(`<div class="kcell blk" style="--cell:${cell}px"></div>`);
          } else {
            const num = numbers ? (numbers[r][c]||0) : 0;
            const numHTML = num ? `<div class="num">${num}</div>` : "";
            const letter = showLetters ? `<div class="ans">${escapeHtml(v)}</div>` : "";
            cells.push(`<div class="kcell" style="--cell:${cell}px;position:relative">${numHTML}${letter}</div>`);
          }
        }
      }
      return { html: `<div class="grid" style="grid-template-columns: repeat(${C}, ${cell}px); grid-template-rows: repeat(${R}, ${cell}px);">${cells.join('')}</div>`, cell };
    }

    let html = `<!doctype html><html><head><meta charset="utf-8">
<title>Crossword – Printable</title>
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
  .kcell { display:grid; place-items:center; background:#fff; border:1px solid #000; width: var(--cell, 34px); height: var(--cell, 34px); }
  .blk { background:#111827; color:#fff; }
  .num { position:absolute; top:2px; left:3px; font-size:10px; color:#111827; }
  .ans { font-weight:800; font-size:calc(var(--cell,34px)*0.46); color:#111827; }
  .footer { width:100%; display:flex; justify-content:center; margin-top:12px; }
  .footerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:6px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size:13px; font-weight:600; color:#374151; }
  .clues { width:100%; max-width:${CONTENT_W_PX}px; display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .clues h3 { font-size:16px; font-weight:800; margin: 2px 0 4px; }
  .clues ol { margin:0; padding-left:18px; font-size:13px; line-height:1.35; }
  .answers-wrap { display:grid; justify-content:center; align-content:center; gap: 12px; width:100%; max-width:${CONTENT_W_PX}px; }
  .ans-item { display:flex; flex-direction:column; align-items:center; }
  .ans-title { font-size:14px; font-weight:800; margin:6px 0; }
</style>
</head><body><div id="doc">`;

    // Optional: instructions page
    if (includeInstrPage){
      const items = String(instrText).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<li>${escapeHtml(s)}</li>`).join("");
      html += `<div class="_a4 page"><div class="content"><div class="headerbox"><div class="title">How to Play Crossword</div></div><div class="instr" style="width:100%;max-width:${CONTENT_W_PX}px;background:rgba(255,255,255,.96);border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.06)"><h2 style="font-size:18px;font-weight:800;margin:0 0 8px;text-align:center">Instructions</h2><ol style="margin:0;padding-left:18px">${items}</ol></div><div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div></div></div>`;
    }

    // Puzzles (one per page)
    serial.forEach((g, i) => {
      const R = renderGrid({ rows:g.rows, cols:g.cols, grid:g.grid }, g.numbering.numbers, false);
      const ac = g.numbering.across.map(x => `<li><b>${x.no}.</b> ${escapeHtml(x.clue||"")}</li>`).join("");
      const dn = g.numbering.down.map(x => `<li><b>${x.no}.</b> ${escapeHtml(x.clue||"")}</li>`).join("");
      const clues = `<div class="clues"><div><h3>Across</h3><ol>${ac}</ol></div><div><h3>Down</h3><ol>${dn}</ol></div></div>`;
      html += `<div class="_a4 page"><div class="content"><div class="headerbox"><div class="title">Crossword #${i+1}</div></div>${R.html}${clues}<div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div></div></div>`;
    });

    // --- Adaptive Answers section (auto-fit like Kakuro/Sudoku) ---
    const MIN_CELL_PX = 12;
    const MAX_CELL_PX = 40;
    const titleH = 24;

    function fitLayout(group) {
      const colCandidates = [4,3,2,1].filter(c => c <= group.length);
      for (const COLS of colCandidates) {
        const ROWS = Math.ceil(group.length / COLS);
        const GAP  = gapFor(group.length);
        const tileW = (CONTENT_W_PX - (COLS - 1) * GAP) / COLS;
        const tileH = (USABLE_H_PX  - (ROWS - 1) * GAP - ROWS * titleH);

        let cell = Infinity;
        for (const g of group) {
          const byW = Math.floor((tileW - 2) / g.cols);
          const byH = Math.floor((tileH - 6) / g.rows);
          cell = Math.min(cell, byW, byH, MAX_CELL_PX);
        }
        cell = Math.max(MIN_CELL_PX, Math.floor(cell));

        let ok = true;
        for (const g of group) {
          if (g.cols * cell > tileW || (g.rows * cell) + titleH > tileH) { ok = false; break; }
        }
        if (ok) return { COLS, ROWS, GAP, CELL: cell };
      }
      return null;
    }

    const perRequested = clamp(parseInt(answersPerPage || "1", 10), 1, 12);
    let index = 0;
    while (index < serial.length) {
      let count = Math.min(perRequested, serial.length - index);
      let group = serial.slice(index, index + count);
      let layout = fitLayout(group);

      while (!layout && group.length > 1) {
        group = group.slice(0, group.length - 1);
        layout = fitLayout(group);
      }

      const N = group.length;
      const { COLS, GAP, CELL } = layout || { COLS: 1, GAP: gapFor(1), CELL: MIN_CELL_PX };

      const tiles = group.map((g, j) => {
        const idx = index + j + 1;
        const gridHtml = renderGrid({ rows:g.rows, cols:g.cols, grid:g.grid }, null, true, CELL).html;
        return `<div class="ans-item">
                  <div class="ans-title">Answer – #${idx}</div>
                  ${gridHtml}
                </div>`;
      }).join("");

      html += `<div class="_a4 page">
        <div class="content">
          <div class="headerbox"><div class="title">Answer Key</div></div>
          <div class="answers-wrap"
               style="grid-template-columns: repeat(${COLS}, auto); column-gap:${GAP}px; row-gap:${GAP}px">
            ${tiles}
          </div>
          <div class="footer"><div class="footerbox">Created with HMQUIZ Studio</div></div>
        </div>
      </div>`;

      index += N;
    }
    // --- End Adaptive Answers ---
    html += `</div>
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
    tip.textContent='Saving PDF…'; await new Promise(r=>setTimeout(r,0)); pdf.save('crossword-pack.pdf');
    setTimeout(()=>window.close(), 400);
  })().catch(err=>{ console.error(err); alert('Failed to generate PDF. See console.'); });
})();</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w){ alert("Popup blocked — allow popups to export PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  function loadSample(){
    const sample = [
      { clue:"Capital of France", answer:"PARIS" },
      { clue:"Capital of Japan", answer:"TOKYO" },
      { clue:"Capital of Italy", answer:"ROME" },
      { clue:"Capital of Spain", answer:"MADRID" },
      { clue:"Capital of Egypt", answer:"CAIRO" },
      { clue:"Capital of Canada", answer:"OTTAWA" },
      { clue:"Capital of India", answer:"DELHI" },
      { clue:"Capital of China", answer:"BEIJING" },
      { clue:"Capital of Kenya", answer:"NAIROBI" },
      { clue:"Capital of Peru", answer:"LIMA" }
    ];
    setCsvRows(sample.map(x => ({ name:"Sample", clue:x.clue, answer:x.answer })));
    setInfo("Loaded sample set. Click Generate.");
  }

  useEffect(()=>{
    if (puzzle){
      const { numbers } = numberCrossword(puzzle);
      setNumbers(numbers);
    } else {
      setNumbers(null);
    }
  }, [puzzle]);

  return (
    <div className="container mx-auto p-4 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">🧩 Crossword (CSV + Batch + PDF)</h1>
        <a href="/hub.html" className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 text-sm">← Hub</a>
      </div>

      <div className="grid md:grid-cols-[1fr_560px] gap-4">
        <div className="rounded-xl p-3 border bg-white min-h-[320px]">
          {puzzle && numbers
            ? <CrosswordGrid model={puzzle} numbers={numbers} showAnswers={showAns} />
            : <div className="text-sm text-gray-500">Load CSV and click Generate to preview the first crossword.</div>}
        </div>

        <div className="rounded-xl p-3 border bg-white">
          <h3 className="font-semibold mb-2">Data</h3>
          <div className="grid gap-2 mb-3">
            <input type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0] && handleCSVFile(e.target.files[0])} />
            <div className="text-xs text-gray-600">CSV headers: <code>Name</code>, <code>Clue</code>, <code>Answer</code> (case-insensitive). If no <code>Name</code>, use chunking.</div>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="group" checked={groupMode==='name'} onChange={()=>setGroupMode('name')} /> Group by <b className="ml-1">Name</b>
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="group" checked={groupMode==='chunk'} onChange={()=>setGroupMode('chunk')} /> Chunk size
              </label>
              <input type="number" min="3" max="64" value={chunkSize} onChange={e=>setChunkSize(e.target.value)} className="border rounded px-2 py-1 w-24" />
              <button onClick={loadSample} className="px-2 py-1 border rounded bg-white hover:bg-gray-50 text-sm">Load sample</button>
            </div>
          </div>

          <h3 className="font-semibold mb-2">Generator</h3>
          <div className="grid gap-2 mb-3">
            <div className="flex items-center gap-2">
              Size
              <input type="number" min="7" max="21" value={rows} onChange={e=>setRows(parseInt(e.target.value,10)||15)} className="border rounded px-2 py-1 w-20" />
              ×
              <input type="number" min="7" max="21" value={cols} onChange={e=>setCols(parseInt(e.target.value,10)||15)} className="border rounded px-2 py-1 w-20" />
            </div>
            <label className="flex items-center gap-2">
              Time budget (ms)
              <input type="number" min="200" max="2000" step="50" value={budget} onChange={e=>setBudget(parseInt(e.target.value,10)||900)} className="border rounded px-2 py-1 w-28" />
            </label>
            <div className="flex gap-2">
              <button onClick={generateFromCSV} disabled={busy || !csvRows.length} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
                {busy ? "Working…" : "Generate"}
              </button>
              <button onClick={()=>setShowAns(s=>!s)} disabled={!puzzle} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
                {showAns ? "Hide Answers" : "Show Answers"}
              </button>
              <button onClick={exportPDF} disabled={busy || !(batch.length || puzzle)} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
                Export PDF
              </button>
            </div>
            <div className="text-xs text-gray-600 mt-1">{batch.length ? `${batch.length} puzzle(s) ready in batch` : (csvRows.length ? `${csvRows.length} row(s) loaded` : "–")}</div>
          </div>

          <h3 className="font-semibold mb-2">PDF Options</h3>
          <div className="grid gap-2 mb-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeInstrPage} onChange={e=>setIncludeInstrPage(e.target.checked)} />
              Include instructions page
            </label>
            <label className="flex items-center gap-2">
              Answers per page
              <select value={answersPerPage} onChange={e=>setAnswersPerPage(parseInt(e.target.value,10))} className="border rounded px-2 py-1">
                {[1,2,3,4,6,8,9,10,12].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <textarea rows="5" value={instrText} onChange={e=>setInstrText(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>

          <div className="rounded-xl p-3 border bg-white mt-4">
            <h3 className="font-semibold mb-2">How to Play Crossword</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Fill the white squares with letters to solve the crossword.</li>
              <li>Numbers mark the start of <b>Across</b> (→) and <b>Down</b> (↓) answers.</li>
              <li>Across clues answer left-to-right; Down clues answer top-to-bottom.</li>
              <li>Black squares (#) separate answers. Letters must match at crossings.</li>
              <li>Tip: Start with the longest clues and use crossings to narrow options.</li>
            </ol>
          </div>

          <div className="text-xs text-gray-600 whitespace-pre-wrap mt-3">{info}</div>
        </div>
      </div>
    </div>
  );
}

