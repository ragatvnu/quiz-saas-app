import React,{useState} from 'react'
import RenderPuzzle from './components/RenderPuzzle.jsx'
import SAMPLE_DATA from './data/samplePuzzles.js'

export default function App(){
  const [showAnswers,setShowAnswers]=useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white/80 border-b p-3 flex items-center gap-3">
        <h1 className="font-bold">Puzzle Packs Studio</h1>
        <label className="ml-auto text-sm flex gap-1 items-center">
          <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)}/> Show answers
        </label>
        <button onClick={()=>window.print()} className="px-3 py-1 bg-black text-white rounded">Print / Save PDF</button>
      </div>
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {SAMPLE_DATA.map(p => <RenderPuzzle key={p.meta.id} puzzle={p} showAnswers={showAnswers}/>)}
      </div>
    </div>
  )
}
