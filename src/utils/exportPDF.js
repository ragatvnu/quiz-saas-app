// src/utils/exportPDF.js
// A4 exporter for all pages using <div class="_a4">…</div>
// Provides both a named and default export for compatibility.
export async function exportPagesToPDF(opts = {}) {
  const {
    filename = "puzzles.pdf",
    marginMM = 0,
    scale = Math.min(3, Math.max(2, (window.devicePixelRatio || 1) * 2)),
  } = opts;

  const pages = Array.from(document.querySelectorAll("._a4"));
  if (!pages.length) {
    throw new Error("No ._a4 pages found to export");
  }

  // Ensure libraries
  async function ensureLibs() {
    if (!("html2canvas" in window)) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      });
    }
    if (!("jspdf" in window)) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      });
    }
  }
  await ensureLibs();
  const { jsPDF } = window.jspdf;

  // Progress UI
  const overlay = document.createElement("div");
  overlay.id = "pp-progress";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Inter,system-ui,sans-serif;";
  overlay.innerHTML = '<div style="width:420px;max-width:90vw;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:16px;"><h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827">Exporting PDF…</h3><div style="width:100%;height:10px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin:10px 0"><div id="pp-bar" style="height:100%;width:0%;background:#2563eb;transition:width .2s"></div></div><div style="font-size:12px;color:#4b5563;display:flex;justify-content:space-between"><span id="pp-count">0/0</span><span id="pp-tip">Rendering…</span></div></div>';
  document.body.appendChild(overlay);
  const bar = overlay.querySelector("#pp-bar");
  const count = overlay.querySelector("#pp-count");
  const tip = overlay.querySelector("#pp-tip");
  function update(i){ bar.style.width = Math.round((i/pages.length)*100) + "%"; count.textContent = i + "/" + pages.length; }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  async function renderPage(el, index) {
    tip.textContent = "Rendering page " + (index + 1);
    await new Promise(r => setTimeout(r, 0));
    const canvas = await window.html2canvas(el, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: el.offsetWidth,
      windowHeight: el.offsetHeight,
    });
    const img = canvas.toDataURL("image/png");
    if (index === 0) {
      pdf.addImage(img, "PNG", marginMM, marginMM, 210 - marginMM*2, 297 - marginMM*2);
    } else {
      pdf.addPage("a4", "portrait");
      pdf.addImage(img, "PNG", marginMM, marginMM, 210 - marginMM*2, 297 - marginMM*2);
    }
  }

  for (let i = 0; i < pages.length; i++) {
    await renderPage(pages[i], i);
    update(i + 1);
  }
  tip.textContent = "Saving PDF…";
  await new Promise(r => setTimeout(r, 0));
  pdf.save(filename);
  requestAnimationFrame(() => overlay.remove());
}

export default exportPagesToPDF;
