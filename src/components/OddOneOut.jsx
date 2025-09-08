import React, { useMemo, useState, useEffect } from 'react'
import Tile from './Tile.jsx'
import { EMOJI_CATALOG } from '../data/emojiCatalog.js'

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }
function makeItems(rows, cols, mainEmoji, oddEmoji, oddIndex) {
  const total = rows * cols
  const idx = clamp(oddIndex ?? 0, 0, total - 1)
  const arr = Array.from({ length: total }, (_, i) => (i === idx ? oddEmoji : mainEmoji))
  return { items: arr, idx }
}

export default function OddOneOut({ data, showAnswers, onTitleChange }) {
  const cfgEnabled = data.options?.configurable === true

  // initial values (from JSON / loader)
  const initRows = data.grid?.rows ?? 10
  const initCols = data.grid?.cols ?? 10
  const initOdd = data.odd_index ?? 0
  const initMainEmoji = data.main_emoji || (data.grid?.items?.[0] || '😀')
  const initOddEmoji = data.odd_emoji || (data.grid?.items?.[0] || '😎')
  const initTheme = data.options?.defaultTheme || 'Animals'

  const [theme, setTheme] = useState(initTheme)
  const [rows, setRows] = useState(initRows)
  const [cols, setCols] = useState(initCols)
  const [mainEmoji, setMainEmoji] = useState(initMainEmoji)
  const [oddEmoji, setOddEmoji] = useState(initOddEmoji)
  const [oddIndex, setOddIndex] = useState(initOdd)

  // notify parent title on mount & when theme changes
  useEffect(() => { if (cfgEnabled && onTitleChange) onTitleChange(theme) }, [cfgEnabled, theme, onTitleChange])

  // keep odd index in bounds when size changes
  useEffect(() => {
    const total = rows * cols
    if (oddIndex >= total) setOddIndex(total - 1)
  }, [rows, cols]) // eslint-disable-line

  // layout metrics
  const { cellPx, gapPx, maxW } = useMemo(() => {
    const maxGridWidth = 620
    const gap = 6
    const cell = Math.floor((maxGridWidth - (cols - 1) * gap) / cols)
    const bounded = Math.max(24, Math.min(80, cell))
    return { cellPx: bounded, gapPx: gap, maxW: maxGridWidth }
  }, [cols])

  // emoji catalogs
  const themeList = Object.keys(EMOJI_CATALOG)
  const currentSet = EMOJI_CATALOG[theme] || []
  const ensureDifferent = (a, b) => (a === b && currentSet.length > 1)
    ? currentSet.find(e => e !== a) : b

  // actions
  function randomizeOdd() { setOddIndex(Math.floor(Math.random() * (rows * cols))) }
  function randomPair() {
    if (currentSet.length < 2) return
    const i = Math.floor(Math.random() * currentSet.length)
    let j = Math.floor(Math.random() * currentSet.length)
    if (j === i) j = (j + 1) % currentSet.length
    setMainEmoji(currentSet[i]); setOddEmoji(currentSet[j])
  }
  function swapPair() { const m = mainEmoji; const o = oddEmoji; setMainEmoji(o); setOddEmoji(m) }
  function resetDefaults() {
    const def = String(data.options?.defaultTheme || 'Animals')
    setTheme(def)
    setRows(initRows); setCols(initCols)
    setMainEmoji(initMainEmoji); setOddEmoji(initOddEmoji)
    setOddIndex(initOdd)
    // broadcast heading only; App decides if data pack changes
    window.dispatchEvent(new CustomEvent('ooo:theme', { detail: def.toLowerCase() }))
    try { localStorage.setItem('puzzleHeading', def) } catch {}
    if (onTitleChange) onTitleChange(def)
  }
  function onThemeChange(next) {
    setTheme(next)
    randomPair()
    const key = String(next).toLowerCase()
    // App listens; it switches data only for animals/fruits/christmas
    window.dispatchEvent(new CustomEvent('ooo:theme', { detail: key }))
    try { localStorage.setItem('puzzleHeading', next) } catch {}
    if (onTitleChange) onTitleChange(next)
  }

  // computed grid items — SINGLE declaration (do not duplicate!)
  const computed = useMemo(() => {
    if (!cfgEnabled) return { items: data.grid.items, idx: data.odd_index }
    return makeItems(rows, cols, mainEmoji, oddEmoji, oddIndex)
  }, [cfgEnabled, data.grid.items, data.odd_index, rows, cols, mainEmoji, oddEmoji, oddIndex])

  // floating controls (hidden when printing)
  const ConfigUI = cfgEnabled ? (
    <div className="fixed right-4 top-24 z-40 shadow-lg bg-white/95 backdrop-blur border rounded-xl p-3 space-y-2 print:hidden">
      <div className="text-xs font-semibold text-gray-600">Odd One Out Controls</div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-[11px] font-semibold">Theme</label>
          <select value={theme} onChange={e => onThemeChange(e.target.value)}
                  className="border rounded px-2 py-1 text-sm">
            {themeList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold">Main</label>
          <select value={mainEmoji} onChange={e => setMainEmoji(e.target.value)}
                  className="border rounded px-2 py-1 text-sm">
            {currentSet.map(ch => <option key={'m'+ch} value={ch}>{ch}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold">Odd</label>
          <select value={oddEmoji} onChange={e => setOddEmoji(ensureDifferent(mainEmoji, e.target.value))}
                  className="border rounded px-2 py-1 text-sm">
            {currentSet.map(ch => <option key={'o'+ch} value={ch}>{ch}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold">Rows</label>
          <input type="number" min="2" max="20" value={rows}
                 onChange={e => setRows(clamp(parseInt(e.target.value||'0',10),2,20))}
                 className="w-20 border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold">Cols</label>
          <input type="number" min="2" max="20" value={cols}
                 onChange={e => setCols(clamp(parseInt(e.target.value||'0',10),2,20))}
                 className="w-20 border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold">Odd idx</label>
          <input type="number" min="0" max={rows*cols-1} value={oddIndex}
                 onChange={e => setOddIndex(clamp(parseInt(e.target.value||'0',10),0,rows*cols-1))}
                 className="w-24 border rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={randomPair} className="px-2 py-1 border rounded text-sm">Shuffle Pair</button>
        <button onClick={swapPair} className="px-2 py-1 border rounded text-sm">Swap</button>
        <button onClick={randomizeOdd} className="px-2 py-1 border rounded text-sm">Random Odd</button>
        <button onClick={resetDefaults} className="px-2 py-1 border rounded text-sm">Reset</button>
      </div>
    </div>
  ) : null

  const items = computed.items
  const highlightIndex = cfgEnabled ? computed.idx : data.odd_index
  const puzzleTitle = cfgEnabled ? `Odd One Out – ${theme}` : data.title

  return (
    <div className="mx-auto" style={{ maxWidth: `${maxW}px` }}>
      {ConfigUI}
      <h2 className="text-xl font-bold mb-4 text-center">{puzzleTitle}</h2>
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
          gap: `${gapPx}px`,
        }}
      >
        {items.map((it, i) => (
          <div
            key={i}
            className={`bg-white border border-gray-300 rounded-xl flex items-center justify-center p-1 ${
              showAnswers && i === highlightIndex ? 'ring-4 ring-red-500' : ''
            }`}
            style={{ width: `${cellPx}px`, height: `${cellPx}px` }}
          >
            <Tile item={it} size={cellPx >= 60 ? 'text-4xl' : cellPx >= 40 ? 'text-3xl' : 'text-2xl'} />
          </div>
        ))}
      </div>
    </div>
  )
}
