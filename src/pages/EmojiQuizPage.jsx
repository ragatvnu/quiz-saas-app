// src/pages/EmojiQuizPage.jsx
import React, { useMemo, useRef, useState } from "react"

/* ---------- CSV helpers ---------- */
function parseCSV(text){
  const lines = text.replace(/\r/g,'').trim().split('\n').filter(Boolean)
  if (!lines.length) return []
  const header = lines[0].split(',').map(h=>h.trim().toLowerCase())
  const idx = {
    theme: header.indexOf('theme'),
    emojis: header.indexOf('emojis'),
    answer: header.indexOf('answer'),
    title:  header.indexOf('title')
  }
  const out = []
  for(let i=1;i<lines.length;i++){
    const cols = splitCSVLine(lines[i])
    out.push({
      theme: grab(cols, idx.theme) || 'General',
      emojis: grab(cols, idx.emojis) || '',
      answer: grab(cols, idx.answer) || '',
      title:  grab(cols, idx.title)  || ''
    })
  }
  return out
}
function splitCSVLine(line){
  const out=[]; let cur='',inQ=false
  for(let i=0;i<line.length;i++){
    const ch=line[i]
    if(ch==='"'){
      if(inQ && line[i+1]==='"'){ cur+='"'; i++ } else inQ=!inQ
    }else if(ch===',' && !inQ){ out.push(cur); cur='' }
    else cur+=ch
  }
  out.push(cur)
  return out.map(s=>s.trim())
}
function grab(cols,i){ return (i>=0 && i<cols.length)? cols[i] : '' }
function toCSV(rows){
  const esc=v=> /[",\n]/.test(v)? `"${String(v).replace(/"/g,'""')}"` : String(v)
  const head='theme,emojis,answer,title'
  const body=rows.map(r=>[esc(r.theme||''),esc(r.emojis||''),esc(r.answer||''),esc(r.title||'')].join(',')).join('\n')
  return head+'\n'+body+'\n'
}
function download(filename, text){
  const blob=new Blob([text],{type:'text/csv'})
  const a=document.createElement('a')
  a.href=URL.createObjectURL(blob); a.download=filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(()=>URL.revokeObjectURL(a.href),0)
}

/* ---------- Page ---------- */
export default function EmojiQuizPage(){
  const [rows, setRows] = useState([])      // full dataset
  const [theme, setTheme] = useState('')    // selected theme ('' until file load)
  const [perRow, setPerRow] = useState(2)   // cards per row: 1..4
  const [rowsPerPage, setRowsPerPage] = useState(3) // rows per page
  const [showAnswers, setShowAnswers] = useState(false)
  const [emojiScale, setEmojiScale] = useState(100)  // 50–150 (%)

  const fileRef = useRef(null)

  // themes
  const themes = useMemo(()=>{
    const t = Array.from(new Set(rows.map(r=>r.theme||'General')))
    t.sort((a,b)=>a.localeCompare(b))
    return t
  }, [rows])

  // filtered rows by theme (or all)
  const filtered = useMemo(()=>{
    if (!rows.length) return []
    if (!theme || theme === '__ALL__') return rows
    return rows.filter(r => (r.theme||'General') === theme)
  }, [rows, theme])

  // pagination: perPage = perRow * rowsPerPage
  const perPage = Math.max(1, (parseInt(perRow,10)||1) * (parseInt(rowsPerPage,10)||1))
  const pages = useMemo(()=>{
    const out=[]
    for(let i=0;i<filtered.length;i+=perPage){
      out.push(filtered.slice(i,i+perPage))
    }
    return out
  }, [filtered, perPage])

  function onImportClick(){ fileRef.current?.click() }
  async function onFilePicked(e){
    const f = e.target.files?.[0]; if(!f) return
    try{
      const text = await f.text()
      let parsed = []
      if (/\.(json)$/i.test(f.name)){
        const json = JSON.parse(text)
        parsed = Array.isArray(json) ? json.map(x=>({
          theme:x.theme||'General', emojis:x.emojis||'', answer:x.answer||'', title:x.title||''
        })) : []
      } else {
        parsed = parseCSV(text)
      }
      setRows(parsed)
      const ts = Array.from(new Set(parsed.map(r=>r.theme||'General')))
      setTheme(ts[0] || 'General')
    }catch(err){
      alert('Failed to read file: ' + (err?.message||err))
    }finally{
      e.target.value=''
    }
  }
  function onExport(){
    if(!rows.length) return alert('Nothing to export. Import a file first.')
    download(`emoji_quiz_${(theme||'all').toLowerCase().replace(/\s+/g,'_')}.csv`, toCSV(rows))
  }

  const heading = theme === '__ALL__' || !theme ? 'Emoji Quiz – All Themes' : `Emoji Quiz – ${theme}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Sticky header (two rows; both hidden on print) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
        {/* Row 1: title + main controls */}
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold">{heading}</h1>
          <a href="/hub.html" className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 text-sm">← Hub</a>

          <div className="ml-auto flex flex-wrap gap-3 items-center w-full md:w-auto">
            <button onClick={onImportClick} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50">Import (CSV/JSON)</button>
            <button onClick={onExport} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50">Export (CSV)</button>
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={onFilePicked} />

            {/* Theme selector */}
            <select
              value={theme || ''}
              onChange={e=>setTheme(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
              disabled={!themes.length}
            >
              <option value="__ALL__">All themes</option>
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Layout controls */}
            <label className="text-sm">Cards/row</label>
            <select value={perRow} onChange={e=>setPerRow(parseInt(e.target.value||'2',10))}
                    className="border rounded-lg px-2 py-1 text-sm">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label className="text-sm">Rows/page</label>
            <select value={rowsPerPage} onChange={e=>setRowsPerPage(parseInt(e.target.value||'3',10))}
                    className="border rounded-lg px-2 py-1 text-sm">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)} />
              Answers
            </label>

            <button onClick={()=>window.print()} className="px-3 py-1.5 rounded-xl bg-black text-white">Print</button>
          </div>
        </div>

        {/* Row 2: BIG emoji size slider */}
        <div className="max-w-5xl mx-auto px-4 pb-3 -mt-2">
          <div className="w-full flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[320px]">
              <label className="text-sm whitespace-nowrap">Emoji size</label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={emojiScale}
                onChange={e=>setEmojiScale(parseInt(e.target.value||"100",10))}
                className="w-56 align-middle"
              />
              <span className="text-xs text-gray-600 w-12 text-right tabular-nums">{emojiScale}%</span>
              <button type="button" className="px-2 py-1 border rounded text-xs"
                onClick={()=>setEmojiScale(s=>Math.max(50, s-5))}>−</button>
              <button type="button" className="px-2 py-1 border rounded text-xs"
                onClick={()=>setEmojiScale(s=>Math.min(150, s+5))}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Format hint when no data */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {!rows.length && (
          <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="font-semibold mb-2">📄 Input Format</p>
            <p>Use <b>CSV</b> or <b>JSON</b>.</p>
            <ul className="list-disc pl-5 mt-2">
              <li><b>CSV header:</b> <code>theme, emojis, answer[, title]</code></li>
              <li><b>Example row:</b> <code>Fruits,"🍎🍌🍇","Apple Banana Grapes","Name the fruits"</code></li>
              <li><b>JSON:</b> <code>[{"{"}"theme":"Fruits","emojis":"🍎🍌","answer":"Apple Banana","title":"..."{"}"}]</code></li>
              <li><b>Optional:</b> <code>title</code> shows a small subtitle under the emojis.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">Tip: after importing, use Export (CSV) anytime to get the exact format again.</p>
          </div>
        )}
      </div>

      {/* Pages */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {pages.map((pageRows, pageIdx)=>(
          <div key={pageIdx} className="print-page">
            <h2 className="text-xl font-bold mb-4 text-center">{heading}</h2>
            <QuizGrid
              rows={pageRows}
              showAnswers={showAnswers}
              perRow={perRow}
              emojiScale={emojiScale}
            />
          </div>
        ))}
        {rows.length>0 && pages.length===0 && (
          <div className="text-sm text-gray-600">No rows for selected theme.</div>
        )}
      </div>

      <style>{`
        @page { size: A4; margin: 12mm; }
        .print-page { page-break-after: always; }
        @media print { .sticky { display:none !important } }
      `}</style>
    </div>
  )
}

function QuizGrid({ rows, showAnswers, perRow, emojiScale }){
  const gridStyle = {
    display:'grid',
    gap:'1rem',
    gridTemplateColumns:`repeat(${Math.max(1,Math.min(4,perRow))}, minmax(0, 1fr))`
  }

  // Base size in px by cards per row (approx Tailwind sizes)
  const basePx =
    perRow === 1 ? 96 :   // ~ text-8xl
    perRow === 2 ? 72 :   // ~ text-6xl
    perRow === 3 ? 60 :   // ~ text-5xl
    48                    // ~ text-4xl

  const fontSizePx = Math.round(basePx * (emojiScale/100))

  return (
    <div style={gridStyle}>
      {rows.map((q, i)=>(
        <div key={i} className="border rounded-xl bg-white p-4 flex flex-col items-center justify-center">
          <div style={{ fontSize: fontSizePx + 'px', lineHeight: 1.05, textAlign:'center' }}>
            {q.emojis}
          </div>
          {q.title ? <div className="text-xs text-gray-500 mt-1 text-center">{q.title}</div> : null}
          {!showAnswers ? (
            <div className="mt-3 h-8 w-full border-b border-dashed"></div>
          ) : (
            <div className="mt-3 text-center text-sm font-semibold text-emerald-700">{q.answer}</div>
          )}
        </div>
      ))}
    </div>
  )
}
