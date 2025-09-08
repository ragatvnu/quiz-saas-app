// src/pages/SudokuPage.jsx
import { useEffect, useRef } from "react";
import { Sudoku } from "../sudoku/engine.js";
import "../common/style.css";

export default function SudokuPage() {
  const rootRef   = useRef(null);
  const mountRef  = useRef(null);
  const digitsRef = useRef(null);
  const noteRef   = useRef(null);

  // Export/session options (in-memory)
  let lastBatch = []; // array of { model, diff }
  let logoDataURL = "";
  let bgDataURL   = "";
  let wmText      = "";
  let footerText  = "";

  useEffect(() => {
    const s = new Sudoku({ mount: mountRef.current });
    s.render();

    // Digit buttons (1..9)
    const digitsHost = digitsRef.current;
    while (digitsHost.firstChild) digitsHost.removeChild(digitsHost.firstChild);
    let activeDigit = null;
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement("button");
      b.textContent = d;
      b.onclick = () => {
        activeDigit = d;
        Array.from(digitsHost.children).forEach(el => el.classList.remove("active"));
        b.classList.add("active");
      };
      b.classList.add("btn","ghost");
      digitsHost.appendChild(b);
    }

    const $ = (sel) => rootRef.current.querySelector(sel);
    const readFileAsDataURL = (file) =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });

    // Single puzzle controls
    $("#new-easy").onclick = () => s.newPuzzle("easy");
    $("#new-med").onclick  = () => s.newPuzzle("medium");
    $("#new-hard").onclick = () => s.newPuzzle("hard");
    $("#solve").onclick    = () => s.solve();
    $("#clear").onclick    = () => s.clear();
    $("#check").onclick    = () => s.check();
    $("#export").onclick   = () => s.exportJSON();
    $("#import").onchange  = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      const txt = await f.text();
      s.loadJSON(JSON.parse(txt));
    };
    noteRef.current.onchange = (e) => { s.noteMode = e.target.checked; };
    $("#show-answers").onclick = () => s.revealAnswers();

    // Branding inputs
    $("#logo-file").onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      logoDataURL = await readFileAsDataURL(f);
      $("#logo-name").textContent = f.name;
    };
    $("#bg-file").onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      bgDataURL = await readFileAsDataURL(f);
      $("#bg-name").textContent = f.name;
    };
    $("#wm-text").oninput = (e) => { wmText = e.target.value; };
    $("#footer-text").oninput = (e) => { footerText = e.target.value; };

    // Batch generator (supports "all" mixed)
    $("#gen-batch").onclick = () => {
      const diffSel  = /** @type {HTMLSelectElement} */($("#batch-diff")).value;
      const count    = Math.max(1, Math.min(200, parseInt(/** @type {HTMLInputElement} */($("#batch-count")).value || "10", 10)));

      const items = [];
      if (diffSel === "all") {
        const order = ["easy","medium","hard"];
        for (let i=0;i<count;i++) {
          const d = order[i % order.length];
          items.push({ model: s.newPuzzleModel(d), diff: d });
        }
      } else {
        for (let i=0;i<count;i++) items.push({ model: s.newPuzzleModel(diffSel), diff: diffSel });
      }
      lastBatch = items;
      s.renderModel(lastBatch[0].model);
      alert(`Generated ${lastBatch.length} puzzle(s): ${diffSel === "all" ? "mixed" : diffSel}. Ready to export.`);
    };

    // Export PDF
    $("#export-pdf").onclick = () => {
      const includeAnswers = /** @type {HTMLInputElement} */($("#include-answers")).checked;
      const diffSel = /** @type {HTMLSelectElement} */ ($("#batch-diff")).value;
      const ansPer = parseInt(/** @type {HTMLSelectElement} */($("#answers-per-page")).value, 10) || 1;
      const hideFooter = /** @type {HTMLInputElement} */($("#footer-hide")).checked;

      // Cover options
      const includeCover = /** @type {HTMLInputElement} */($("#include-cover")).checked;
      const coverTitle   = /** @type {HTMLInputElement} */($("#cover-title")).value || "Sudoku Puzzle Pack";
      const coverSub     = /** @type {HTMLInputElement} */($("#cover-subtitle")).value || "";
      const coverNotes   = /** @type {HTMLTextAreaElement} */($("#cover-notes")).value || "";

      // Page numbers
      const includePageNum = /** @type {HTMLInputElement} */($("#include-pagenum")).checked;

      // NEW: Optional Content page + Fun Facts page
      const includeContent = /** @type {HTMLInputElement} */($("#include-content")).checked;
      const contentTitle   = /** @type {HTMLInputElement} */($("#content-title")).value || "Contents";
      const contentBody    = /** @type {HTMLTextAreaElement} */($("#content-body")).value || "";

      const includeFun     = /** @type {HTMLInputElement} */($("#include-fun")).checked;
      const funTitle       = /** @type {HTMLInputElement} */($("#fun-title")).value || "Fun Facts";
      const funLinesRaw    = /** @type {HTMLTextAreaElement} */($("#fun-lines")).value || "";
      const funLines       = funLinesRaw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

      const modelsWithMeta = lastBatch.length
        ? lastBatch
        : [{ model: s.newPuzzleModel(diffSel === "all" ? "medium" : diffSel), diff: (diffSel === "all" ? "medium" : diffSel) }];

      openPdfPrintWindow(modelsWithMeta, includeAnswers, ansPer, s, {
        logoDataURL, bgDataURL, wmText, footerText, footerHide: hideFooter,
        includeCover, coverTitle, coverSub, coverNotes,
        includePageNum,
        // NEW in opts:
        includeContent, contentTitle, contentBody,
        includeFun, funTitle, funLines
      });
    };

    // Canvas interactions
    s.onCellClick = (r,c)=> { if (activeDigit != null) s.place(r,c,activeDigit); };
    s.newPuzzle("easy");

    return ()=> { s.onCellClick = null; };

    /* ------------ helpers (strict rasterized exporter with progress + cancel) ------------ */
    function openPdfPrintWindow(items, includeAnswers, answersPerPage, engine, opts) {
      const w = window.open("", "_blank");
      if (!w) { alert("Popup blocked—allow popups to export PDF."); return; }

      const styles = `
<!doctype html><html><head><meta charset="utf-8">
<title>Sudoku – Printable</title>
<style>
  @page { size: A4; margin: 12mm; }
  html, body { height: 100%; }
  body { font-family: Inter, system-ui, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; }
  h1 { font-size: 26px; font-weight: 800; margin: 0 0 10px; text-align:center; }
  h2 { font-size: 18px; font-weight: 600; margin: 8px 0 6px; }
  ol { margin: 0 0 12px 18px; }
  ul { margin: 0 0 12px 18px; }
  .page { page-break-after: always; position: relative; min-height: 90vh; overflow:hidden; background:#fff; }
  .bgimg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .wm { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:1; pointer-events:none; }
  .wm span { font-size:72px; font-weight:800; color:#111827; opacity:.07; transform: rotate(-30deg); white-space:nowrap; }
  .content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding-bottom:22mm; }

  .headerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:14px; }
  .logo { max-height: 64px; }
  .title { font-size:26px; font-weight:800; text-align:center; }

  .instructions { max-width:80%; margin:0 auto 12px; font-size:14px; line-height:1.4; text-align:left; background: rgba(255,255,255,0.95); padding:10px 12px; border-radius:8px; border:1px solid #e5e7eb; }

  .grid { display: grid; grid-template-columns: repeat(9, var(--cell, 60px)); grid-template-rows: repeat(9, var(--cell, 60px)); gap: 0; margin: 8px auto; background:#000; }
  .cell { width:var(--cell, 60px); height:var(--cell, 60px); display:grid; place-items:center; border:1px solid #000; font-size:calc(var(--cell,60px) * 0.5); font-weight:800; background: #fff; }
  .cell.bt { border-top-width:3px; } .cell.bb { border-bottom-width:3px; }
  .cell.bl { border-left-width:3px; } .cell.br { border-right-width:3px; }
  .fixed { color:#047857; }
  .answer { background: #fff3bf !important; }

  .footer { position:absolute; left:0; right:0; bottom:8mm; display:flex; justify-content:center; z-index:2; }
  .footerbox { background: rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:6px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size:13px; font-weight:600; color:#374151; }

  .answers-wrap { display:grid; gap: var(--gap, 12mm); justify-content:center; align-content:center; }
  .ans-item { display:flex; flex-direction:column; align-items:center; }
  .ans-title { font-size:16px; font-weight:800; margin:6px 0; }

  ._a4 { width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 12mm; background:#fff; }

  .cover-wrap { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; gap:12px; }
  .cover-title { font-size:40px; font-weight:900; letter-spacing:0.4px; }
  .cover-sub   { font-size:20px; font-weight:600; color:#374151; }
  .cover-notes { max-width:75%; margin:10px auto 0; font-size:14px; line-height:1.5; color:#4b5563; background:rgba(255,255,255,0.95); border:1px solid #e5e7eb; border-radius:12px; padding:10px 14px; }
  .cover-brandbox{ background:rgba(255,255,255,0.96); border:1px solid #e5e7eb; border-radius:12px; padding:10px 14px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .cover-logo  { max-height:80px; }

  .pagenum {
    position:absolute; right:12mm; bottom:6mm; z-index:2;
  }
  .pagenum .pbox{
    background: rgba(255,255,255,0.96);
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:4px 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    font-size:12px; font-weight:700; color:#374151;
  }

  /* Progress overlay in popup */
  #pp-progress {
    position: fixed; inset: 0; background: rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: Inter, system-ui, sans-serif;
  }
  #pp-progress .card {
    width: 420px; max-width: 90vw; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    padding: 16px;
  }
  #pp-progress h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color:#111827; }
  #pp-progress .bar { width: 100%; height: 10px; background:#f3f4f6; border-radius: 999px; overflow: hidden; margin: 10px 0; }
  #pp-progress .bar > div { height: 100%; width: 0%; background:#2563eb; transition: width .2s ease; }
  #pp-progress .meta { font-size: 12px; color:#4b5563; display:flex; justify-content: space-between; }
  #pp-progress .actions { margin-top: 12px; display:flex; justify-content:flex-end; gap:8px; }
  #pp-progress button { padding: 6px 10px; border-radius: 8px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; }
  #pp-progress button.stop { background:#fee2e2; border-color:#fecaca; color:#991b1b; }
</style>
</head><body>
<div id="doc">
`;

      const cap = (s)=> s ? s.charAt(0).toUpperCase()+s.slice(1) : "";

      const cellClass = (r,c,isFixed,highlightNonFixed) => {
        const cls = ["cell"];
        if (isFixed) cls.push("fixed");
        if (highlightNonFixed && !isFixed) cls.push("answer");
        if (r % 3 === 0) cls.push("bt");
        if (r % 3 === 2) cls.push("bb");
        if (c % 3 === 0) cls.push("bl");
        if (c % 3 === 2) cls.push("br");
        return cls.join(" ");
      };

      const renderGrid = (model, highlightNonFixed=false, cellPx=60) => {
        const cells = [];
        for (let r=0;r<9;r++){
          for (let c=0;c<9;c++){
            const v = model.grid[r][c];
            const isFixed = model.fixed[r][c];
            cells.push(`<div class="${cellClass(r,c,isFixed,highlightNonFixed)}">${v||''}</div>`);
          }
        }
        return `<div class="grid" style="--cell:${cellPx}px">${cells.join('')}</div>`;
      };

      const instructionsHTML = `
        <div class="instructions">
          <h2>Instructions</h2>
          <ol>
            <li>Fill each row, column, and 3×3 box with digits 1–9.</li>
            <li>Do not repeat a digit within any row, column, or box.</li>
            <li>Given digits (in green) are fixed.</li>
          </ol>
        </div>`;

      const pageOpen = (title) => {
        const bg = opts.bgDataURL ? `<img class="bgimg" src="${opts.bgDataURL}" alt="bg"/>` : "";
        const wm = opts.wmText ? `<div class="wm"><span>${escapeHtml(opts.wmText)}</span></div>` : "";
        const logo = opts.logoDataURL ? `<img class="logo" src="${opts.logoDataURL}" alt="logo"/>` : "";
        const header = `<div class="headerbox">${logo}<div class="title">${title}</div></div>`;
        return `<div class="_a4 page">${bg}${wm}<div class="content">${header}`;
      };

      const pageClose = (pageIndex) => {
        const pnum = opts.includePageNum
          ? `<div class="pagenum"><div class="pbox">${pageIndex}</div></div>`
          : "";
        if (opts.footerHide) return `${pnum}</div></div>`;
        const text = (opts.footerText && opts.footerText.trim().length)
          ? opts.footerText
          : "Created with HMQUIZ Studio";
        const foot = `<div class="footer"><div class="footerbox">${escapeHtml(text)}</div></div>`;
        return `${foot}${pnum}</div></div>`;
      };

      // Cover page render
      const coverPage = (pageIndex) => {
        const bg = opts.bgDataURL ? `<img class="bgimg" src="${opts.bgDataURL}" alt="bg"/>` : "";
        const wm = opts.wmText ? `<div class="wm"><span>${escapeHtml(opts.wmText)}</span></div>` : "";
        const logo = opts.logoDataURL ? `<img class="cover-logo" src="${opts.logoDataURL}" alt="logo"/>` : "";
        const brand = logo ? `<div class="cover-brandbox">${logo}</div>` : "";
        const notes = opts.coverNotes ? `<div class="cover-notes">${escapeHtml(opts.coverNotes)}</div>` : "";
        const pnum = opts.includePageNum
          ? `<div class="pagenum"><div class="pbox">${pageIndex}</div></div>` : "";

        return `
          <div class="_a4 page">
            ${bg}${wm}
            <div class="cover-wrap">
              ${brand}
              <div class="cover-title">${escapeHtml(opts.coverTitle || "Sudoku Puzzle Pack")}</div>
              ${opts.coverSub ? `<div class="cover-sub">${escapeHtml(opts.coverSub)}</div>` : ""}
              ${notes}
            </div>
            ${opts.footerHide ? "" : `<div class="footer"><div class="footerbox">${
              escapeHtml((opts.footerText && opts.footerText.trim().length) ? opts.footerText : "Created with HMQUIZ Studio")
            }</div></div>`}
            ${pnum}
          </div>
        `;
      };

      // NEW: Simple rich text to paragraphs (for Content page)
      const renderParagraphs = (text) => {
        if (!text) return "";
        const lines = String(text).split(/\r?\n/).map(s=>s.trim());
        const paras = lines.filter(Boolean).map(s=>`<p style="max-width:75%;text-align:left;font-size:14px;line-height:1.55;margin:6px auto;">${escapeHtml(s)}</p>`);
        return paras.join("");
      };

      // NEW: Fun facts list
      const renderFacts = (facts) => {
        if (!facts || !facts.length) return "";
        const items = facts.map(s=>`<li>${escapeHtml(s)}</li>`).join("");
        return `<ul style="max-width:75%;font-size:14px;line-height:1.55;">${items}</ul>`;
      };

      let html = styles;

      // Page counter
      let pageCounter = 1;

      // Optional cover
      if (opts.includeCover) {
        html += coverPage(pageCounter++);
      }

      // NEW: Optional Content page
      if (opts.includeContent) {
        html += pageOpen(escapeHtml(opts.contentTitle || "Contents")) +
                `<div style="width:100%;display:flex;justify-content:center;">${renderParagraphs(opts.contentBody)}</div>` +
                pageClose(pageCounter++);
      }

      // Puzzles (1 per page)
      for (let i=0;i<items.length;i++) {
        const it = items[i];
        const num = i+1;
        const diffLabel = cap(it.diff);
        html += pageOpen(`Sudoku Puzzle #${num} — ${diffLabel}`) + instructionsHTML + renderGrid(it.model, false, 60) + pageClose(pageCounter++);
      }

      // NEW: Optional Fun Facts page (after puzzles, before answers)
      if (opts.includeFun) {
        html += pageOpen(escapeHtml(opts.funTitle || "Fun Facts")) +
                renderFacts(opts.funLines) +
                pageClose(pageCounter++);
      }

      // Answers (auto-fit, N per page)
      if (includeAnswers) {
        const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
        const mmToPx = (mm)=> mm/25.4*96;
        const PAGE_W = mmToPx(210), PAGE_H = mmToPx(297);
        const MARGIN = mmToPx(12);
        const CONTENT_W = PAGE_W - 2*MARGIN;
        const CONTENT_H = PAGE_H - 2*MARGIN;
        const HEADER_H = 120, FOOTER_H = 48;
        const USABLE_H = CONTENT_H - HEADER_H - FOOTER_H;

        const per = clamp(parseInt(answersPerPage||'1',10), 1, 12);
        const colsFor = (n) => (n<=1?1 : n===2?1 : n===3?3 : n===4?2 : n===5?3 : n===6?3 : n<=8?4 : 3);
        const gapFor  = (n) => n<=4 ? mmToPx(10) : n<=8 ? mmToPx(8) : n<=12 ? mmToPx(6) : mmToPx(6);

        const pages = [];
        for (let i=0;i<items.length;i+=per) pages.push(items.slice(i, i+per));

        let base = 1;
        for (const group of pages) {
          const N = group.length;
          const COLS = colsFor(N);
          const ROWS = Math.ceil(N / COLS);
          const GAP = gapFor(N);

          const cellFromW = (CONTENT_W - (COLS-1)*GAP) / (COLS*9);
          const titleH = 24;
          const cellFromH = (USABLE_H - (ROWS-1)*GAP - ROWS*titleH) / (ROWS*9);
          let cellPx = Math.floor(Math.max(20, Math.min(60, Math.min(cellFromW, cellFromH))));

          const itemsHTML = group.map((it, i) => {
            const solved = engine.solveModel(it.model) || it.model;
            const num = base + i;
            const diffLabel = cap(it.diff);
            return `<div class="ans-item">
                      <div class="ans-title">Answer – #${num} (${diffLabel})</div>
                      ${renderGrid(solved, true, cellPx)}
                    </div>`;
          }).join("");

          html += pageOpen(`Answer Key`) +
                  `<div class="answers-wrap" style="grid-template-columns: repeat(${COLS}, auto); --gap:${GAP}px">${itemsHTML}</div>` +
                  pageClose(pageCounter++);

          base += group.length;
        }
      }

      // Progress overlay + scripts
      html += `</div>
<div id="pp-progress" aria-live="polite" role="status" style="display:none">
  <div class="card">
    <h3>Exporting PDF…</h3>
    <div class="bar"><div id="pp-bar"></div></div>
    <div class="meta"><span id="pp-count">0/0</span><span id="pp-tip">Rendering…</span></div>
    <div class="actions">
      <button id="pp-stop" class="stop">Stop export</button>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script>
(function(){
  const { jsPDF } = window.jspdf;
  const pages = Array.from(document.querySelectorAll('._a4'));
  const total = pages.length;

  if (total > 120 && !confirm('You are exporting ' + total + ' pages. This may take a while. Continue?')) {
    window.close(); return;
  }

  const ua = navigator.userAgent;
  const isFirefox = /Firefox\\//.test(ua);
  const SCALE = isFirefox ? 1.5 : 2;
  const QUALITY = 0.92;

  const overlay = document.getElementById('pp-progress');
  const bar = document.getElementById('pp-bar');
  const count = document.getElementById('pp-count');
  const tip = document.getElementById('pp-tip');
  const stopBtn = document.getElementById('pp-stop');
  overlay.style.display = 'flex';

  let cancel = false;
  stopBtn.onclick = () => { cancel = true; tip.textContent = 'Stopping… finishing current page'; };

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  function update(i){
    const pct = Math.round((i/total)*100);
    bar.style.width = pct + '%';
    count.textContent = i + '/' + total;
  }

  async function renderPage(el, index){
    tip.textContent = 'Rendering page ' + (index+1);
    await new Promise(r => setTimeout(r, 0));

    const canvas = await html2canvas(el, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      letterRendering: true
    });
    const imgData = canvas.toDataURL('image/jpeg', QUALITY);
    const w = 210, h = 297;
    if (index === 0) {
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
    } else {
      pdf.addPage('a4', 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
    }
  }

  (async function(){
    for (let i = 0; i < total; i++){
      if (cancel){ tip.textContent = 'Cancelled'; break; }
      await renderPage(pages[i], i);
      update(i+1);
    }
    if (!cancel){
      tip.textContent = 'Saving PDF…';
      await new Promise(r => setTimeout(r, 0));
      pdf.save('sudoku-printables.pdf');
    }
    setTimeout(() => window.close(), 400);
  })().catch(err => {
    console.error(err);
    alert('Failed to generate PDF. See console for details.');
  });
})();
</script>
</body></html>`;

      w.document.open(); w.document.write(html); w.document.close();

      function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      }
    }
  }, []);

  return (
    <div ref={rootRef} className="pp-theme container p-4">
      <div className="header flex justify-between items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">🧠 Sudoku</h1>
        <div className="flex gap-2 flex-wrap">
          <a href="/hub.html" className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 text-sm">← Hub</a>
          <button id="new-easy" className="btn">New (Easy)</button>
          <button id="new-med" className="btn secondary">New (Medium)</button>
          <button id="new-hard" className="btn secondary">New (Hard)</button>
          <button id="solve" className="btn ghost">Solve</button>
          <button id="clear" className="btn ghost">Clear</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_520px] gap-4">
        <div ref={mountRef}></div>

        <div className="rounded-xl p-3 border border-gray-200 bg-white text-gray-900">
          <h3 className="font-semibold mb-2">Controls</h3>

          <div className="mb-3 flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" ref={noteRef} /> Note mode
            </label>
            <button id="show-answers" className="btn ghost">Show Answers</button>
          </div>

          <div ref={digitsRef} id="digits" className="grid grid-cols-9 gap-1 mb-3"></div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button id="check" className="btn">Check</button>
            <button id="export" className="btn secondary">Export JSON</button>
            <input id="import" type="file" accept="application/json" />
          </div>

          <hr className="my-3"/>

          <h4 className="font-semibold mb-2">Batch Generator</h4>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              Difficulty
              <select id="batch-diff" className="border rounded px-2 py-1">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="all">All (Mixed)</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              Count
              <input id="batch-count" type="number" min="1" max="200" defaultValue="10" className="border rounded px-2 py-1 w-24" />
            </label>
            <button id="gen-batch" className="btn">Generate</button>
          </div>

          <h4 className="font-semibold mb-2">Export Options</h4>
          <div className="space-y-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="border rounded px-2 py-1 cursor-pointer">
                <input id="logo-file" type="file" accept="image/*" className="hidden" />
                Upload Logo
              </label>
              <span id="logo-name" className="text-xs text-gray-500">none</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="border rounded px-2 py-1 cursor-pointer">
                <input id="bg-file" type="file" accept="image/*" className="hidden" />
                Background Image
              </label>
              <span id="bg-name" className="text-xs text-gray-500">none</span>
            </div>
            <div className="flex items-center gap-2">
              Watermark
              <input id="wm-text" type="text" placeholder="e.g., HMQUIZ • © 2025" className="border rounded px-2 py-1 flex-1" />
            </div>

            {/* --- Cover / Front Page options --- */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input id="include-cover" type="checkbox" /> Include front (cover) page
              </label>
            </div>
            <div className="grid gap-2">
              <input id="cover-title" type="text" placeholder="Cover title (e.g., Sudoku Puzzle Pack)" className="border rounded px-2 py-1" />
              <input id="cover-subtitle" type="text" placeholder="Subtitle (e.g., Easy • Medium • Hard)" className="border rounded px-2 py-1" />
              <textarea id="cover-notes" rows="3" placeholder="Optional notes (appears on cover)" className="border rounded px-2 py-1"></textarea>
            </div>

            <div className="flex items-center gap-2">
              Footer
              <input id="footer-text" type="text" placeholder="Optional footer text" className="border rounded px-2 py-1 flex-1" />
              <label className="flex items-center gap-2 text-sm"><input id="footer-hide" type="checkbox" /> Hide footer</label>
            </div>
            <div className="flex items-center gap-2">
              Answers per page
              <select id="answers-per-page" className="border rounded px-2 py-1">
                <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                <option>6</option><option>7</option><option>8</option><option>9</option><option>10</option>
                <option>11</option><option>12</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input id="include-pagenum" type="checkbox" /> Show page numbers
              </label>
            </div>

            {/* === NEW: Optional Content page === */}
            <hr className="my-3"/>
            <h4 className="font-semibold">Optional: Content Page</h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input id="include-content" type="checkbox" /> Include content page
              </label>
            </div>
            <div className="grid gap-2">
              <input id="content-title" type="text" placeholder="Contents" className="border rounded px-2 py-1" />
              <textarea id="content-body" rows="4" placeholder="Add paragraphs for your contents page (one per line or free text)…" className="border rounded px-2 py-1"></textarea>
            </div>

            {/* === NEW: Optional Fun Facts page === */}
            <hr className="my-3"/>
            <h4 className="font-semibold">Optional: Fun Facts Page</h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input id="include-fun" type="checkbox" /> Include fun facts page
              </label>
            </div>
            <div className="grid gap-2">
              <input id="fun-title" type="text" placeholder="Fun Facts" className="border rounded px-2 py-1" />
              <textarea id="fun-lines" rows="4" placeholder="Enter one fun fact per line…" className="border rounded px-2 py-1"></textarea>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input id="include-answers" type="checkbox" /> Include answers (highlighted)
            </label>
            <button id="export-pdf" className="btn ghost">Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

