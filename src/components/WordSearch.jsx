import React, { useMemo } from 'react'
export default function WordSearch({ data, showAnswers }){
  const { rows, cols, letters } = data.grid
  const letterAt = (r,c)=> letters[r*cols+c]||''
  const marked = useMemo(()=>{
    const m=new Set()
    if(showAnswers && data.answers){
      data.answers.forEach(a=>a.cells.forEach(([r,c])=>m.add(`${r-1}-${c-1}`)))
    }
    return m
  },[showAnswers,data.answers])
  return (
    <div className="text-center">
      <div className="inline-grid gap-[6px] mx-auto" style={{gridTemplateColumns:`repeat(${cols},42px)`}}>
        {Array.from({length:rows}).map((_,r)=>
          Array.from({length:cols}).map((_,c)=>{
            const k=`${r}-${c}`,ch=letterAt(r,c),hit=marked.has(k)
            return <div key={k} className={`w-[42px] h-[42px] border flex items-center justify-center font-semibold ${hit?'bg-yellow-200 border-yellow-400':'border-gray-300'}`}>{ch}</div>
          })
        )}
      </div>
      <div className="mt-4">
        <p className="font-semibold">Find these words:</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.word_list.map(w=><span key={w} className="px-2 py-1 bg-gray-100 border rounded-full text-sm">{w}</span>)}
        </div>
      </div>
    </div>
  )
}
