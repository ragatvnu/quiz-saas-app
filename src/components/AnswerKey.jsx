import React from 'react'
import RenderPuzzle from './RenderPuzzle.jsx'

export default function AnswerKey({ puzzles }){
  return (
    <div className="page bg-white rounded-2xl shadow-sm border p-6 mx-auto my-6" style={{ width:'210mm' }}>
      <h2 className="text-2xl font-extrabold text-center">Answer Key</h2>
      <div className="mt-4 space-y-8">
        {puzzles.map(p => <RenderPuzzle key={'akey-'+p.meta.id} puzzle={p} showAnswers={true} />)}
      </div>
    </div>
  )
}
