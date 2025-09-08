import React, { useMemo, useRef, useState, useEffect } from 'react'
import { parseDataFile } from '../utils/ingest.js'

function toTitleString(v, fallback='Emoji Quiz – Fruit Phrase'){
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    if (typeof v.text === 'string') return v.text
    if (typeof v.name === 'string') return v.name
    try { return JSON.stringify(v) } catch {}
  }
  return fallback
}

export default function EmojiQuiz({ data, showAnswers, onTitleChange }) {
  const [title, setTitle] = useState(toTitleString(data.title, 'Emoji Quiz – Fruit Phrase'))
  const [subtitle, setSubtitle] = useState(typeof data.subtitle === 'string' ? data.subtitle : '')
  const [rows, setRows] = useState(Number(data.options?.rows) || 2)
  const [cols, setCols] = useState(Number(data.options?.cols) || 2)
  const [items, setItems] = useState(()=> normalizeItems(data.items || []))
  const fileRef = useRef(null)

  useEffect(()=>{ onTitleChange?.(title) }, [title, onTitleChange])

  // compute once, outside any loops
  const cellWidth = useMemo(()=>{
    const maxW = 680, gap=12
    const w = Math.floor((maxW - gap*(cols-1)) / cols)
    return Math.max(180, Math.min(320, w))
  }, [cols])

  function normalizeItems(arr){
    return arr.map(x => ({
      prompt: String(x.prompt ?? x.emojis ?? x.q ?? x.line ?? ''),
      answer: String(x.answer ?? x.a ?? ''),
      hint: x.hint != null ? String(x.hint) : ''
    })).filter(x=>x.prompt)
  }

  async function onPick(e){
    const f = e.target.files?.[0]; if(!f) return
    try{
      const text = await f.text()
      const parsed = parseDataFile(text, f.name) || {}

      // IMPORTANT: Only ever set the string title
      if (parsed.title !== undefined) setTitle(toTitleString(parsed.title, title))
      if (parsed.subtitle !== undefined) setSubtitle(typeof parsed.subtitle === 'string' ? parsed.subtitle : '')

      if (parsed.options?.rows) setRows(Number(parsed.options.rows))
      if (parsed.options?.cols) setCols(Number(parsed.options.cols))
      if (parsed.items) setItems(normalizeItems(parsed.items))
    }catch(err){
      alert('Failed to read file: '+err.message)
    }finally{
      e.target.value=''
    }
  }

  return (
    <div className="mx-auto">
      {/* Controls */}
      <div className="print:hidden mb-3 flex flex-wrap gap-3 items-end">
        <label className="px-3 py-1.5 border rounded-lg cursor-pointer">
          Load data…
          <input ref={fileRef} type="file" accept=".csv,.json,.txt" onChange={onPick} className="hidden" />
        </label>
        <label className="text-sm">Rows&nbsp;
          <input type="number" min="1" max="5" value={rows}
            onChange={e=>setRows(Math.max(1,Math.min(5,parseInt(e.target.value||'1',10))))}
            className="w-16 border rounded px-2 py-1" />
        </label>
        <label className="text-sm">Cols&nbsp;
          <input type="number" min="1" max="4" value={cols}
            onChange={e=>setCols(Math.max(1,Math.min(4,parseInt(e.target.value||'1',10))))}
            className="w-16 border rounded px-2 py-1" />
        </label>
      </div>

      {/* String-safe heading */}
      <h2 className="text-xl font-bold text-center">{String(title)}</h2>
      {subtitle && <p className="text-center text-sm text-gray-600 mb-3">{String(subtitle)}</p>}

      {/* Cards */}
      <div className="flex flex-wrap gap-3 justify-center">
        {items.map((q, i)=>(
          <Card key={i} q={q} showAnswers={showAnswers} width={cellWidth}/>
        ))}
      </div>
    </div>
  )
}

function Card({ q, showAnswers, width }){
  return (
    <div className="border rounded-xl bg-white p-3" style={{ width }}>
      <div className="text-3xl text-center leading-snug break-words">{q.prompt}</div>
      {q.hint && !showAnswers && (
        <div className="mt-2 text-xs text-gray-500 text-center">Hint: {q.hint}</div>
      )}
      <div className="mt-3 min-h-[28px] text-center">
        {showAnswers ? <span className="inline-block font-semibold tracking-wide">{q.answer}</span>
                     : <span className="inline-block text-gray-400">__________</span>}
      </div>
    </div>
  )
}
