import React, { useMemo } from 'react'

export default function Crossword({ data, showAnswers }){
  const { rows, cols, blocks=[] } = data.grid || {}
  const blockSet = useMemo(()=> new Set(blocks.map(([r,c])=>`${r-1}-${c-1}`)), [blocks])

  const numMap = useMemo(()=>{
    const m=new Map()
    for(const n of (data.numbers||[])) m.set(`${n.row-1}-${n.col-1}`, n.num)
    return m
  },[data.numbers])

  const fillMap = useMemo(()=>{
    const m=new Map()
    if(showAnswers && data.answers?.filled){
      for(const f of data.answers.filled) m.set(`${f.row-1}-${f.col-1}`, f.ch)
    }
    return m
  },[showAnswers, data.answers])

  const cellPx = 42
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="mx-auto">
        <div className="grid gap-[2px] bg-gray-300 p-[2px]"
             style={{gridTemplateColumns:`repeat(${cols},${cellPx}px)`, gridTemplateRows:`repeat(${rows},${cellPx}px)`}}>
          {Array.from({length:rows}).map((_,r)=>
            Array.from({length:cols}).map((_,c)=>{
              const k=`${r}-${c}`, blocked = blockSet.has(k)
              const num = numMap.get(k)
              const ch = fillMap.get(k)
              return (
                <div key={k} className={blocked?'bg-black':'bg-white relative'} style={{width:cellPx, height:cellPx}}>
                  {!blocked && <>
                    {num && <span className="absolute top-0 left-0 text-[10px] text-gray-600 ml-0.5 mt-0.5">{num}</span>}
                    <div className="w-full h-full flex items-center justify-center font-semibold">{ch||''}</div>
                  </>}
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="text-sm">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Across</h4>
          <ul className="list-disc ml-6 space-y-1">
            {(data.clues?.across||[]).map(c=><li key={`ac-${c.num}`}><span className="font-semibold">{c.num}.</span> {c.clue} <span className="text-gray-500">({c.len})</span></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Down</h4>
          <ul className="list-disc ml-6 space-y-1">
            {(data.clues?.down||[]).map(c=><li key={`dn-${c.num}`}><span className="font-semibold">{c.num}.</span> {c.clue} <span className="text-gray-500">({c.len})</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
