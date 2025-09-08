import React, { useEffect, useMemo, useState } from 'react'
import RenderPuzzle from './components/RenderPuzzle.jsx'
import { loadTheme } from './data/loadTheme.js'

const DATA_THEMES = ['animals','fruits','christmas']

function titleCase(s){
  if(!s) return 'Puzzles'
  return String(s).replace(/[-_]+/g,' ').replace(/\b\w/g, ch => ch.toUpperCase())
}

export default function App(){
  // read stored data theme safely
  const storedTheme = (() => {
    try {
      const t = (localStorage.getItem('puzzleTheme') || 'animals').toLowerCase()
      return DATA_THEMES.includes(t) ? t : 'animals'
    } catch { return 'animals' }
  })()

  const storedHeading = (() => {
    try {
      return localStorage.getItem('puzzleHeading') || titleCase(storedTheme)
    } catch { return titleCase(storedTheme) }
  })()

  const [themeName, setThemeName] = useState(storedTheme)         // which data pack to load
  const [headingLabel, setHeadingLabel] = useState(storedHeading) // top heading only
  const [showAnswers, setShowAnswers] = useState(false)

  // Listen to Odd-One-Out broadcasts
  useEffect(()=>{
    const handler = (e)=>{
      const raw = e?.detail ?? ''
      const key = String(raw).toLowerCase()
      const label = titleCase(raw || 'Puzzles')

      // Heading always follows the panel (any catalog like Vehicles/Sports/etc.)
      setHeadingLabel(label)
      try { localStorage.setItem('puzzleHeading', label) } catch {}

      // Only change the actual data pack if it's a known theme
      if (['animals','fruits','christmas'].includes(key)) {
        setThemeName(key)
        try { localStorage.setItem('puzzleTheme', key) } catch {}
      }
    }
    window.addEventListener('ooo:theme', handler)
    return ()=> window.removeEventListener('ooo:theme', handler)
  },[])

  // Load theme data defensively
  const THEME = useMemo(()=>{
    try { return loadTheme(themeName) } 
    catch (err) {
      console.error('loadTheme failed for', themeName, err)
      try { return loadTheme('animals') } catch { return { theme:'Animals', puzzles: [], branding:{} } }
    }
  }, [themeName])

  const puzzles = (THEME.puzzles || []).map(p => ({
    ...p,
    meta: { id: p.id, title: p.title, branding: THEME.branding, page_size: 'A4', difficulty: p.difficulty }
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Top toolbar (not printed) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-bold">Puzzle Book – {headingLabel}</h1>
          <label className="ml-auto text-sm flex items-center gap-2">
            <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)}/> Show answers
          </label>
          <button onClick={()=>window.print()} className="px-3 py-1.5 rounded-xl bg-black text-white text-sm">Print / Save PDF</button>
        </div>
      </div>

      {/* Pages */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {puzzles.map(p => <RenderPuzzle key={p.meta.id || p.id} puzzle={p} showAnswers={showAnswers} />)}
      </div>

      {/* Print CSS */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .sticky { display:none !important } }
      `}</style>
    </div>
  )
}
