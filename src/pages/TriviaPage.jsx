// src/pages/TriviaPage.jsx
import { useEffect, useMemo, useState } from "react";

import Trivia from "../components/Trivia.jsx";
import TriviaAnswerKey from "../components/TriviaAnswerKey.jsx";
import PageFrame from "../components/extras/PageFrame.jsx";
import ScoreSheet from "../components/extras/ScoreSheet.jsx";
import FooterPage from "../components/extras/FooterPage.jsx";

import { parseTriviaCSV, parseTriviaJSON } from "../utils/ingestTrivia.js";
import { normalize, shuffleQuestions, chunk } from "../utils/triviaGen.js";

export default function TriviaPage() {
  // ---------------- Data ----------------
  const [rawItems, setRawItems] = useState([]);
  const [title, setTitle] = useState("Christmas Trivia");
  const [subtitle, setSubtitle] = useState("Family Edition");
  const [perPage, setPerPage] = useState(10);
  const [choicesCount, setChoicesCount] = useState(4);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleC, setShuffleC] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // -------------- Layout / Branding --------------
  const [fontFamily, setFontFamily] = useState("Arial, Helvetica, sans-serif");
  const [fontSizePt, setFontSizePt] = useState(12);
  const [bwPreview, setBwPreview] = useState(false);
  const [bwExport, setBwExport] = useState(false);
  const [bgDataURL, setBgDataURL] = useState("");
  const [bgOpacity, setBgOpacity] = useState(0.1);
  const [logoDataURL, setLogoDataURL] = useState("");
  const [footerText, setFooterText] = useState("© HMQUIZ — Personal use only");

  // ---------------- Export / Preview ----------------
  const [exportCount, setExportCount] = useState(0); // 0 = all trivia pages
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [backgroundExport, setBackgroundExport] = useState(true);
  const [renderScaleCtl, setRenderScaleCtl] = useState(1.6);
  const [jpegQualityCtl, setJpegQualityCtl] = useState(0.9);
  const [marginMM, setMarginMM] = useState(10);
  const [imageFit, setImageFit] = useState("cover"); // "cover" or "contain"

  // ---------------- Theme selection ----------------
  const [selectedThemes, setSelectedThemes] = useState([]); // array of category strings

  // ---------------- Toggles ----------------
  const [showTOC, setShowTOC] = useState(true);
  const [tocTitle, setTocTitle] = useState("Contents");
  const [showInPageLabel, setShowInPageLabel] = useState(false);
  const [showHints, setShowHints] = useState(true); // show hint text under each question

  // ---------------- Category grouping ----------------
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [showCategoryInHeader, setShowCategoryInHeader] = useState(true);
  const [categoryOrderText, setCategoryOrderText] = useState("");

  // ---------------- Loaders ----------------
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg("");
      const name = file.name.toLowerCase();
      let parsed = [];

      if (name.endsWith(".csv")) {
        // Expect ingest to return array of {question, correct, choices?, distractors?, category?, hint?}
        parsed = await parseTriviaCSV(file);
      } else if (name.endsWith(".json")) {
        // Accept either raw array or { pages: [...] }
        const txt = await file.text();
        let data;
        try { data = JSON.parse(txt); }
        catch (err) { throw new Error("Invalid JSON: " + (err?.message || err)); }

        const rows = Array.isArray(data?.pages) ? data.pages.flat()
                    : Array.isArray(data) ? data
                    : [];
        if (!rows.length) throw new Error("JSON must be an array or have a non-empty 'pages' array.");

        parsed = rows.map((q) => {
          const correct = q?.correct ?? "";
          const choices = Array.isArray(q?.choices) && q.choices.length
            ? q.choices
            : [correct, ...(q?.distractors || [])].filter(Boolean);
          const distractors = Array.isArray(q?.distractors)
            ? q.distractors
            : choices.filter((c) => c !== correct).slice(0, 3);
          return {
            category: q?.category || "General",
            question: q?.question || "",
            correct,
            hint: q?.hint || "",
            choices,
            distractors, // ✅ ensure present
          };
        });
      } else {
        throw new Error("Unsupported file type. Please upload CSV or JSON.");
      }

      if (!parsed.length) throw new Error("No questions found after parsing.");

      // Final guarantee even for CSV path
      parsed = parsed.map((q) => {
        const correct = q?.correct ?? "";
        const choices = Array.isArray(q?.choices) && q.choices.length
          ? q.choices
          : [correct, ...(q?.distractors || [])].filter(Boolean);
        const distractors = Array.isArray(q?.distractors)
          ? q.distractors
          : choices.filter((c) => c !== correct).slice(0, 3);
        return { category: q?.category || "General", question: q?.question || "", correct, hint: q?.hint || "", choices, distractors };
      });

      setRawItems(parsed);
      setSelectedThemes([]); // reset any filters
    } catch (err) {
      console.error(err);
      setRawItems([]);
      setSelectedThemes([]);
      setErrorMsg(String(err?.message || err));
    } finally {
      try { e.target.value = ""; } catch {}
    }
  }

  async function loadThemePack(name) {
    // Try src/ (bundled) first
    try {
      const mod = await import(/* @vite-ignore */ `../data/themes/${name}.json`);
      return mod?.default ?? mod;
    } catch (_) {}
    // Then public/
    const resp = await fetch(`/data/themes/${name}.json`, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for /data/themes/${name}.json`);
    return await resp.json();
  }

  async function loadPackByName(name) {
    try {
      setErrorMsg("");
      const pack = await loadThemePack(name);
      const flat = Array.isArray(pack?.pages) ? pack.pages.flat() : [];
      const raw = flat.map((q) => {
        const correct = q?.correct ?? "";
        const choices = Array.isArray(q?.choices) && q.choices.length
          ? q.choices
          : [correct, ...(q?.distractors || [])].filter(Boolean);
        const distractors = Array.isArray(q?.distractors)
          ? q.distractors
          : choices.filter((c) => c !== correct).slice(0, 3);
        return {
          category: q?.category || "General",
          question: q?.question || "",
          correct,
          hint: q?.hint || "",
          choices,
          distractors, // ✅ ensure present
        };
      });
      setRawItems(raw);
      setTitle(pack?.meta?.title || "Custom Trivia");
      setSubtitle(pack?.meta?.subtitle || "Pack");
      setPerPage(Number.isFinite(pack?.meta?.perPage) ? pack.meta.perPage : 10);
      setChoicesCount(4);
      setShuffleQ(false);
      setShuffleC(false);
      setSelectedThemes([]);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not load pack: " + name);
    }
  }

  // Quick button: original Christmas pack
  async function loadChristmasPack() {
    await loadPackByName("trivia_christmas_pack");
  }

  // Deep-link via ?pack=slug
  useEffect(() => {
    try {
      const slug = new URLSearchParams(window.location.search).get("pack");
      if (slug) loadPackByName(slug);
    } catch (e) { /* ignore */ }
  }, []);

  // If selectedThemes excludes everything after loading, auto-clear
  useEffect(() => {
    if (selectedThemes.length && rawItems.length) {
      const hasAny = rawItems.some(q => selectedThemes.includes(q.category));
      if (!hasAny) setSelectedThemes([]);
    }
  }, [rawItems, selectedThemes]);

  // ---------------- Derived data ----------------
  const availableThemes = useMemo(() => {
    const s = new Set();
    rawItems.forEach(q => q?.category && s.add(q.category));
    return [...s].sort();
  }, [rawItems]);

  const filteredRaw = useMemo(() => {
    if (!selectedThemes.length) return rawItems;
    return rawItems.filter(q => selectedThemes.includes(q.category));
  }, [rawItems, selectedThemes]);

  useEffect(() => {
    if (!Number.isFinite(perPage) || perPage < 1) setPerPage(10);
  }, [perPage]);

  const items = useMemo(() => {
    // ✅ Final sanitize before normalize()
    const prepped = filteredRaw.map((q) => {
      const correct = q?.correct ?? "";
      const choices = Array.isArray(q?.choices) && q.choices.length
        ? q.choices
        : [correct, ...(q?.distractors || [])].filter(Boolean);
      const distractors = Array.isArray(q?.distractors)
        ? q.distractors
        : choices.filter((c) => c !== correct).slice(0, 3);
      return { ...q, choices, distractors };
    });

    let n = normalize(prepped, choicesCount, shuffleC);
    if (shuffleQ) n = shuffleQuestions(n);
    return n;
  }, [filteredRaw, choicesCount, shuffleQ, shuffleC]);

  // Build category order (manual or alphabetical)
  const manualOrder = useMemo(
    () => categoryOrderText.split(",").map(s => s.trim()).filter(Boolean),
    [categoryOrderText]
  );

  const orderedCategories = useMemo(() => {
    if (!groupByCategory) return [];
    if (!manualOrder.length) return availableThemes;
    const seen = new Set(manualOrder);
    const rest = availableThemes.filter(c => !seen.has(c));
    return [...manualOrder, ...rest];
  }, [groupByCategory, manualOrder, availableThemes]);

  // Pages: group by category or linear
  const triviaPagesAll = useMemo(() => {
    const per = Math.max(1, perPage | 0);
    if (!groupByCategory) {
      return chunk(items, per);
    }
    const pages = [];
    orderedCategories.forEach((cat) => {
      const bucket = items.filter((it) => (it.category || "General") === cat);
      const bucketPages = chunk(bucket, per);
      pages.push(...bucketPages);
    });
    return pages;
  }, [groupByCategory, items, perPage, orderedCategories]);

  // First N pages for preview/export (0 = all)
  const effectiveCount = (Number.isFinite(exportCount) && exportCount > 0)
    ? Math.min(exportCount, triviaPagesAll.length)
    : triviaPagesAll.length;

  const triviaPages = useMemo(() => {
    return triviaPagesAll.slice(0, effectiveCount);
  }, [triviaPagesAll, effectiveCount]);

  // Category label for each page (for header & TOC)
  const pageCategories = useMemo(
    () => triviaPages.map((pg) => pg?.[0]?.category || "General"),
    [triviaPages]
  );

  // Answer keys (grouped and linear)
  const groupedAnswerKey = useMemo(() => {
    const acc = {};
    let qn = 1;
    triviaPages.forEach((pg) => {
      (pg || []).forEach((q) => {
        const cat = q?.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ n: qn, answer: q ? q.correct : "" });
        qn += 1;
      });
    });
    return acc;
  }, [triviaPages]);

  const linearAnswerKey = useMemo(() => {
    const out = [];
    let qn = 1;
    triviaPages.forEach((pg) => {
      (pg || []).forEach((q) => {
        out.push({ n: qn, answer: q ? q.correct : "", category: q ? q.category : "General" });
        qn += 1;
      });
    });
    return out;
  }, [triviaPages]);

  useEffect(() => {
    if (!rawItems.length) setErrorMsg("No trivia loaded yet. Upload a CSV/JSON or load a pack by name.");
    else setErrorMsg("");
  }, [rawItems.length]);

  function fileToDataURL(file, cb) {
    if (!file) return cb("");
    const r = new FileReader();
    r.onload = () => cb(r.result);
    r.onerror = () => cb("");
    r.readAsDataURL(file);
  }

  // ---------------- Export ----------------
  async function onExportPDF() {
    try {
      setExporting(true);
      setExportMsg(backgroundExport ? "Starting background export..." : "Preparing export...");
      const mod = await import("../utils/exportPDF.js");
      const opts = {
        size: "A4",
        bw: bwExport,
        bgSrc: bgDataURL,
        bgOpacity: bgOpacity,
        logoSrc: logoDataURL,
        footerText: footerText,
        renderScale: renderScaleCtl,
        jpegQuality: jpegQualityCtl,
        imageFit: imageFit,   // "cover" | "contain"
        marginMM: marginMM    // inner margins (mm)
      };
      const onProgress = (type, data) => {
        const d = data || {};
        if (type === "init") setExportMsg("Initializing…");
        else if (type === "ready") setExportMsg("Styling & images ready…");
        else if (type === "start") setExportMsg("Starting render…");
        else if (type === "render") setExportMsg(`Rendering page ${d.page}/${d.total}…`);
        else if (type === "save") setExportMsg("Saving PDF…");
        else if (type === "done") { setExportMsg("Export complete."); setTimeout(() => setExporting(false), 600); }
        else if (type === "error") { setExportMsg("Export failed."); setTimeout(() => setExporting(false), 1200); }
      };
      if (backgroundExport && mod.exportTriviaPDFInIframe) await mod.exportTriviaPDFInIframe(opts, onProgress);
      else if (mod.exportTriviaPDF) await mod.exportTriviaPDF(opts, onProgress);
      else setExportMsg("Exporter not found.");
    } catch (e) {
      console.error(e);
      setExportMsg("Export failed to start.");
      setTimeout(() => setExporting(false), 1000);
    }
  }

  // ---------------- TOC (category-aware) ----------------
  const tocEntries = [];
  let pageNum = 1; // cover
  if (showTOC) pageNum += 1; // contents

  if (groupByCategory) {
    const perCatCounters = new Map();
    for (let i = 0; i < triviaPages.length; i++) {
      const cat = pageCategories[i];
      const idx = (perCatCounters.get(cat) || 0) + 1;
      perCatCounters.set(cat, idx);
      tocEntries.push({ label: `${cat} ${idx}`, page: pageNum });
      pageNum += 1;
    }
  } else {
    for (let i = 0; i < triviaPages.length; i++) {
      tocEntries.push({ label: `Page ${i + 1}`, page: pageNum });
      pageNum += 1;
    }
  }

  tocEntries.push({ label: "Answer Key", page: pageNum }); pageNum += 1;
  tocEntries.push({ label: "Score Sheet", page: pageNum }); pageNum += 1;
  tocEntries.push({ label: "Credits", page: pageNum }); pageNum += 1;

  // ---------------- Render sequence ----------------
  let renderPageNum = 1;
  const renderSequence = [];

  // Cover (centered)
  renderSequence.push(
    <PageFrame key="cover" hideHeader={true} pageNum={renderPageNum++}>
      <div style={{ height: "240mm", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
        <div style={{ fontSize: "30pt", fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: "6mm", fontSize: "16pt", fontWeight: 700 }}>{subtitle}</div>
      </div>
    </PageFrame>
  );

  // Contents
  if (showTOC) {
    renderSequence.push(
      <PageFrame key="toc" headerLeft={title} headerRight="Contents" compact={true} pageNum={renderPageNum++}>
        <div style={{ paddingTop: "6mm" }}>
          <div style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "6mm" }}>{tocTitle}</div>
          <div style={{ maxWidth: "150mm" }}>
            {tocEntries.map((e, idx) => (
              <div key={`toc-${idx}`} style={{ display: "flex", alignItems: "baseline", gap: "6mm" }}>
                <div style={{ flex: "1 1 auto", borderBottom: "1px dotted rgba(0,0,0,0.4)", marginRight: "6mm" }}>{e.label}</div>
                <div style={{ width: "10mm", textAlign: "right" }}>{e.page}</div>
              </div>
            ))}
          </div>
        </div>
      </PageFrame>
    );
  }

  // Trivia pages
  for (let i = 0; i < triviaPages.length; i++) {
    const hdrRight = groupByCategory && showCategoryInHeader ? (pageCategories[i] || subtitle) : subtitle;
    renderSequence.push(
      <PageFrame
        key={`trivia-${i}`}
        headerLeft={title}
        headerRight={hdrRight}
        compact={true}
        pageNum={renderPageNum++}
      >
        <div className={bwPreview ? "filter grayscale" : ""}>
          <Trivia
            items={triviaPages[i]}
            showPageLabel={showInPageLabel}
            showHints={showHints}
            qGapPx={20}
          />
        </div>
      </PageFrame>
    );
  }

  // Answer / Score / Credits
  renderSequence.push(
    <PageFrame key="answers" headerLeft={title} headerRight="Answer Key" compact={true} pageNum={renderPageNum++}>
      <TriviaAnswerKey
        title={title + " - Answer Key"}
        answerKey={linearAnswerKey}
        groupedByCategory={groupByCategory}
        groupedAnswerKey={groupedAnswerKey}
      />
    </PageFrame>
  );
  renderSequence.push(
    <PageFrame key="scores" headerLeft={title} headerRight="Score Sheet" compact={true} pageNum={renderPageNum++}>
      <ScoreSheet rounds={10} />
    </PageFrame>
  );
  renderSequence.push(
    <PageFrame key="footer" headerLeft={title} headerRight="Credits" compact={true} pageNum={renderPageNum++}>
      <FooterPage brand="HMQUIZ" url="https://example.com" />
    </PageFrame>
  );

  // ---------------- UI ----------------
  return (
    <div className="p-6 space-y-4" style={{ fontFamily, fontSize: `${fontSizePt}pt` }}>
      <header className="mb-2">
        <h1 className="text-2xl font-bold">Trivia Builder</h1>
        <p className="opacity-70 text-sm">Upload CSV/JSON or load a pack by name. Filter by theme. Export matches preview.</p>
      </header>

      {/* STATUS BAR */}
      <div className="text-sm flex flex-wrap gap-3 items-center p-2 bg-gray-50 rounded">
        <span>Items loaded: <b>{rawItems.length}</b></span>
        <span>Themes detected: <b>{availableThemes.length}</b> ({availableThemes.join(", ") || "—"})</span>
        <span>Selected themes: <b>{selectedThemes.length || "All"}</b></span>
        <span>Per page: <b>{perPage}</b></span>
        <span>Trivia pages: <b>{triviaPages.length}</b></span>
        {!!errorMsg && <span className="text-red-600">Error: {errorMsg}</span>}
      </div>

      {errorMsg && <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-3 py-2 rounded">{errorMsg}</div>}

      {/* Loaders */}
      <div className="flex flex-wrap items-end gap-3">
        <button onClick={loadChristmasPack} className="bg-green-600 text-white px-3 py-2 rounded hover:opacity-95">
          Load 30-Page Christmas Pack
        </button>
        <input type="file" accept=".csv,.json" onChange={handleFile} />
        <LoadByName onLoad={loadPackByName} />
      </div>

      {/* Theme (category) picker */}
      {availableThemes.length > 0 && (
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-semibold mb-2">Select themes to include (leave empty to include all):</div>
          <div className="flex flex-wrap gap-2">
            {availableThemes.map((cat) => {
              const checked = selectedThemes.includes(cat);
              return (
                <label key={`theme-${cat}`} className={`px-2 py-1 border rounded cursor-pointer ${checked ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedThemes((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
                      else setSelectedThemes((prev) => prev.filter((x) => x !== cat));
                    }}
                  />
                  {cat}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Layout & Branding */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded">
        <div className="flex flex-col">
          <label className="text-xs mb-1">Font family</label>
          <select className="border rounded px-2 py-1" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option>Arial, Helvetica, sans-serif</option>
            <option>"Times New Roman", Times, serif</option>
            <option>"Courier New", Courier, monospace</option>
          </select>
        </div>
        <div className="flex flex-col w-24">
          <label className="text-xs mb-1">Font size (pt)</label>
          <input className="border rounded px-2 py-1" type="number" min={9} max={16} value={fontSizePt} onChange={(e) => setFontSizePt(parseInt(e.target.value, 10) || 12)} />
        </div>
        <div className="flex items-center gap-2"><label className="text-xs">Preview B/W</label><input type="checkbox" checked={bwPreview} onChange={(e) => setBwPreview(e.target.checked)} /></div>
        <div className="flex items-center gap-2"><label className="text-xs">PDF B/W</label><input type="checkbox" checked={bwExport} onChange={(e) => setBwExport(e.target.checked)} /></div>
        <div className="flex flex-col"><label className="text-xs mb-1">Background image</label><input type="file" accept="image/*" onChange={(e) => fileToDataURL(e.target.files ? e.target.files[0] : null, setBgDataURL)} /></div>
        <div className="flex flex-col w-28"><label className="text-xs mb-1">BG opacity (0–1)</label><input className="border rounded px-2 py-1" type="number" min="0" max="1" step="0.01" value={bgOpacity} onChange={(e) => { const v = parseFloat(e.target.value); setBgOpacity(isNaN(v) ? 0 : Math.max(0, Math.min(1, v))); }} /></div>
        <div className="flex flex-col"><label className="text-xs mb-1">Logo</label><input type="file" accept="image/*" onChange={(e) => fileToDataURL(e.target.files ? e.target.files[0] : null, setLogoDataURL)} /></div>
        <div className="flex-1 flex flex-col"><label className="text-xs mb-1">Footer text</label><input className="border rounded px-2 py-1" value={footerText} onChange={(e) => setFooterText(e.target.value)} /></div>
      </div>

      {/* Grouping & TOC */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded">
        <div className="flex items-center gap-2">
          <label className="text-xs">Group by category</label>
          <input type="checkbox" checked={groupByCategory} onChange={(e) => setGroupByCategory(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Show category in header</label>
          <input type="checkbox" checked={showCategoryInHeader} onChange={(e) => setShowCategoryInHeader(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Show TOC</label>
          <input type="checkbox" checked={showTOC} onChange={(e) => setShowTOC(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Show hints in quiz</label>
          <input type="checkbox" checked={showHints} onChange={(e) => setShowHints(e.target.checked)} />
        </div>
        <div className="flex flex-col w-[380px]">
          <label className="text-xs mb-1">Category order (optional, comma-separated)</label>
          <input className="border rounded px-2 py-1" placeholder="Food, Movie, Music" value={categoryOrderText} onChange={(e) => setCategoryOrderText(e.target.value)} />
          <div className="text-[11px] opacity-70 mt-1">Leave blank to use alphabetical: {availableThemes.join(", ") || "—"}</div>
        </div>
      </div>

      {/* Export controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:opacity-95">Print / Save PDF</button>
        <button onClick={onExportPDF} className="bg-purple-600 text-white px-4 py-2 rounded hover:opacity-95">Export to PDF</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={backgroundExport} onChange={(e) => setBackgroundExport(e.target.checked)} />
          Background export
        </label>
        <div className="flex items-center gap-2">
          <label className="text-xs">First N trivia pages (0=all)</label>
          <input className="border rounded px-2 py-1 w-28" type="number" min={0} value={exportCount} onChange={(e) => setExportCount(parseInt(e.target.value, 10) || 0)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Render scale</label>
          <input className="border rounded px-2 py-1 w-24" type="number" min={1.0} step={0.1} value={renderScaleCtl} onChange={(e) => { const v = parseFloat(e.target.value); setRenderScaleCtl(isNaN(v) ? 1.6 : v); }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">JPEG quality</label>
          <input className="border rounded px-2 py-1 w-24" type="number" min={0.5} max={0.95} step={0.01} value={jpegQualityCtl} onChange={(e) => { const v = parseFloat(e.target.value); setJpegQualityCtl(isNaN(v) ? 0.9 : Math.max(0.5, Math.min(0.95, v))); }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Image fit</label>
          <select className="border rounded px-2 py-1" value={imageFit} onChange={(e) => setImageFit(e.target.value)}>
            <option value="cover">Cover (fill page)</option>
            <option value="contain">Contain (no crop)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Margins (mm)</label>
          <input className="border rounded px-2 py-1 w-20" type="number" min={0} max={20} step={1} value={marginMM} onChange={(e) => { const v = parseFloat(e.target.value); setMarginMM(isNaN(v) ? 10 : Math.max(0, Math.min(20, v))); }} />
        </div>
      </div>

      {/* Book render */}
      <div className={bwPreview ? "filter grayscale" : ""}>
        {renderSequence}
      </div>

      {exporting && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl px-6 py-5 w-[min(90vw,420px)]">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <div className="font-medium">Exporting PDF...</div>
            </div>
            <div className="text-sm mt-2 opacity-80">{exportMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small inline component for "Load by name" control
function LoadByName({ onLoad }) {
  const [name, setName] = useState("trivia_christmas_pack");
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col">
        <label className="text-xs mb-1">Pack (without .json)</label>
        <input
          className="border rounded px-2 py-1 w-64"
          value={name}
          onChange={(e) => setName(e.target.value.trim())}
          placeholder="my_holiday_pack"
        />
      </div>
      <button
        onClick={() => onLoad && onLoad(name)}
        className="bg-amber-600 text-white px-3 py-2 rounded hover:opacity-95"
      >
        Load Pack by Name
      </button>
    </div>
  );
}

