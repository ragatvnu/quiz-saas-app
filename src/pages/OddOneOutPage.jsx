import React, { useMemo, useRef, useState } from "react"
import OddOneOut from "../components/OddOneOut.jsx"
import { loadTheme } from "../data/loadTheme.js"
import { EMOJI_CATALOG } from "../data/emojiCatalog.js"

// Interactive Batch Builder (no JSON):
//  - Choose Theme -> pick Main & Odd emojis from that theme set
//  - Set Rows × Cols
//  - Set Odd Index (or randomize)
//  - Click "Add to batch" to queue a page
//  - Print Batch => one page per variant (controls hidden in print)

export default function OddOneOutPage(){
  const THEME = loadTheme("animals")
  const base = THEME.puzzles.find(x => x.type === "odd_one_out") || THEME.puzzles[0]

  const [mode, setMode] = useState("single") // 'single' | 'batch'

  // ---------- Builder state ----------
  const themeList = Object.keys(EMOJI_CATALOG)
  const [bTheme, setBTheme]   = useState(base?.options?.defaultTheme || "Animals")
  const currentSet = EMOJI_CATALOG[bTheme] || []
  const safeMain = currentSet[0] || "😀"
  const safeOdd  = currentSet[1] || currentSet[0] || "😎"

  const [bRows, setBRows]     = useState(base?.grid?.rows ?? 10)
  const [bCols, setBCols]     = useState(base?.grid?.cols ?? 10)
  const [bMain, setBMain]     = useState(safeMain)
  const [bOdd, setBOdd]       = useState(safeOdd === safeMain ? (currentSet[1] || "😎") : safeOdd)
  const [bOddIndex, setBOddIndex] = useState(base?.odd_index ?? 0)
  const totalCells = bRows * bCols

  const [batch, setBatch] = useState([])

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)) }
  function rand(n){ return Math.floor(Math.random()*n) }

  function onChangeTheme(t){
    setBTheme(t)
    const set = EMOJI_CATALOG[t] || []
    const m = set[0] || "😀"
    const o = set[1] || (set[0] || "😎")
    setBMain(m)
    setBOdd(o === m ? (set[2] || o) : o)
  }

  function swapPair(){ setBMain(bOdd); setBOdd(bMain) }
  function shufflePair(){
    const set = EMOJI_CATALOG[bTheme] || []
    if(set.length < 2) return
    const i = rand(set.length)
    let j = rand(set.length); if (j===i) j = (j+1)%set.length
    setBMain(set[i]); setBOdd(set[j])
  }
  function randomOddIndex(){ setBOddIndex(rand(totalCells)) }

  function addToBatch(){
    const idx = clamp(parseInt(bOddIndex||0,10), 0, Math.max(0, totalCells-1))
    const entry = {
      title: `Odd One Out – ${bTheme} (${bRows}×${bCols})`,
      theme: bTheme,
      rows: bRows,
      cols: bCols,
      mainEmoji: bMain,
      oddEmoji: bOdd,
      oddIndex: idx
    }
    setBatch(prev => [...prev, entry])
  }

  function updateBatch(idx, patch){
    setBatch(prev => prev.map((it,i)=> i===idx ? {...it, ...patch} : it))
  }
  function removeBatch(idx){ setBatch(prev => prev.filter((_,i)=> i!==idx)) }
  function moveBatch(idx, dir){
    setBatch(prev => {
      const arr = [...prev]
      const j = idx + dir
      if (j<0 || j>=arr.length) return arr
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return arr
    })
  }

  function printNow(){ window.print() }

  const Header = (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold">Odd One Out</h1>
    <a href="/hub.html" className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50 text-sm">← Hub</a>
        <div className="ml-auto flex gap-2">
          <select value={mode} onChange={e=>setMode(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
            <option value="single">Single</option>
            <option value="batch">Batch</option>
          </select>
          <button onClick={printNow} className="px-3 py-1.5 rounded-xl bg-black text-white">{mode==='batch'?'Print Batch':'Print'}</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {Header}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {mode === "single" && (
          <SectionPage titleOverride={null}>
            <OddOneOut data={base} showAnswers={false} />
          </SectionPage>
        )}

        {mode === "batch" && (
          <>
            {/* --------- Builder Panel (hidden when printing) --------- */}
            <div className="print:hidden border rounded-xl bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold mb-2">Batch Builder</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold">Theme</label>
                  <select value={bTheme} onChange={e=>onChangeTheme(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
                    {themeList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold">Rows</label>
                    <input type="number" min="2" max="20" value={bRows}
                      onChange={e=>setBRows(clamp(parseInt(e.target.value||'0',10),2,20))}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold">Cols</label>
                    <input type="number" min="2" max="20" value={bCols}
                      onChange={e=>setBCols(clamp(parseInt(e.target.value||'0',10),2,20))}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold">Main Emoji</label>
                    <select value={bMain} onChange={e=>setBMain(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
                      {currentSet.map(ch => <option key={'m'+ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold">Odd Emoji</label>
                    <select value={bOdd} onChange={e=>setBOdd(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
                      {currentSet.map(ch => <option key={'o'+ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <button onClick={shufflePair} className="px-2 py-1 border rounded text-sm">Shuffle Pair</button>
                  <button onClick={swapPair} className="px-2 py-1 border rounded text-sm">Swap</button>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold">Odd Index (0…{totalCells-1})</label>
                    <input type="number" min="0" max={Math.max(0,totalCells-1)} value={bOddIndex}
                      onChange={e=>setBOddIndex(clamp(parseInt(e.target.value||'0',10),0,Math.max(0,totalCells-1)))}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                  <button onClick={randomOddIndex} className="px-2 py-1 border rounded text-sm">Random Odd</button>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={addToBatch} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50">Add to batch</button>
                <span className="text-xs text-gray-500">Batch count: {batch.length}</span>
              </div>
            </div>

            {/* --------- Batch List (each prints on its own page) --------- */}
            {batch.length === 0 ? (
              <div className="text-sm text-gray-600">No batch items yet. Use the builder above and click <b>Add to batch</b>.</div>
            ) : (
              <div className="space-y-10">
                {batch.map((v, idx) => {
                  const variant = {
                    ...base,
                    title: v.title,
                    options: { ...(base.options||{}), configurable: true, defaultTheme: v.theme },
                    grid: { rows: v.rows, cols: v.cols, items: base.grid?.items || [] },
                    main_emoji: v.mainEmoji,
                    odd_emoji: v.oddEmoji,
                    odd_index: v.oddIndex
                  }
                  const set = EMOJI_CATALOG[v.theme] || []
                  return (
                    <div key={idx} className="print-page">
                      {/* Manage row (hidden in print) */}
                      <div className="print:hidden mb-2 flex flex-wrap items-end gap-2 text-sm">
                        <div className="font-semibold">{v.title}</div>
                        <div className="ml-auto flex gap-2">
                          <select className="border rounded px-2 py-1"
                            value={v.theme}
                            onChange={e=>{
                              const t = e.target.value
                              const s = EMOJI_CATALOG[t] || []
                              const m = s[0] || v.mainEmoji
                              const o = s[1] || (s[0] || v.oddEmoji)
                              updateBatch(idx,{ theme:t, mainEmoji:m, oddEmoji:o, title:`Odd One Out – ${t} (${v.rows}×${v.cols})` })
                            }}>
                            {themeList.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select className="border rounded px-2 py-1" value={v.mainEmoji}
                            onChange={e=>updateBatch(idx,{ mainEmoji: e.target.value })}>
                            {set.map(ch => <option key={'m'+ch} value={ch}>{ch}</option>)}
                          </select>
                          <select className="border rounded px-2 py-1" value={v.oddEmoji}
                            onChange={e=>updateBatch(idx,{ oddEmoji: e.target.value })}>
                            {set.map(ch => <option key={'o'+ch} value={ch}>{ch}</option>)}
                          </select>
                          <input className="border rounded px-2 py-1 w-24" type="number" min="0" max={v.rows*v.cols-1}
                            value={v.oddIndex}
                            onChange={e=>updateBatch(idx,{ oddIndex: clamp(parseInt(e.target.value||'0',10),0,v.rows*v.cols-1) })}/>
                          <button className="px-2 py-1 border rounded" onClick={()=>updateBatch(idx,{ oddIndex: rand(v.rows*v.cols) })}>Random Odd</button>
                          <button className="px-2 py-1 border rounded" onClick={()=>moveBatch(idx,-1)}>↑</button>
                          <button className="px-2 py-1 border rounded" onClick={()=>moveBatch(idx, 1)}>↓</button>
                          <button className="px-2 py-1 border rounded text-red-600 border-red-300" onClick={()=>removeBatch(idx)}>Remove</button>
                        </div>
                      </div>

                      {/* Print title */}
                      
                      <OddOneOut data={variant} showAnswers={false} />
                    </div>
                  )
                })}
              </div>
            )}
          </>
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

function SectionPage({ children, titleOverride }){
  return (
    <div className="print-page">
      {titleOverride ? (
        <h2 className="text-xl font-bold mb-4 text-center">{titleOverride}</h2>
      ) : null}
      {children}
    </div>
  )
}
