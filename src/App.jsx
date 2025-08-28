import React, { useState } from 'react'
import RenderPuzzle from './components/RenderPuzzle.jsx'
import AnswerKey from './components/AnswerKey.jsx'
import SAMPLE_DATA from './data/samplePuzzles.js'

export default function App(){
  const [showAnswers, setShowAnswers] = useState(false)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-bold">Puzzle Packs Studio</h1>
          <label className="ml-auto text-sm flex items-center gap-2">
            <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)}/> Show answers
          </label>
          <button onClick={()=>window.print()} className="px-3 py-1.5 rounded-xl bg-black text-white text-sm">Print / Save PDF</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {SAMPLE_DATA.map(p => <RenderPuzzle key={p.meta.id} puzzle={p} showAnswers={showAnswers} />)}
      </div>

      {/* Answer key section */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 print:break-before-page">
        <h2 className="text-xl font-bold">Answer Key</h2>
        {SAMPLE_DATA.map(p => <RenderPuzzle key={'ans-' + p.meta.id} puzzle={p} showAnswers={true} />)}
      </div>

      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .sticky { display: none !important } }
      `}</style>
    </div>
  )
}
