import React, { useMemo } from 'react'

export default function Sudoku({ data, showAnswers }){
  const size = data.grid?.size || 9
  const subR = data.options?.subgrid?.rows || 3
  const subC = data.options?.subgrid?.cols || 3

  const givens = useMemo(()=>{
    const m=new Map()
    for(const g of (data.grid?.givens||[])) m.set(`${g.row-1}-${g.col-1}`, g.val)
    return m
  },[data.grid?.givens])

  const solution = data.solution?.rows || []
  const cellPx = 42

  return (
    <div className="inline-block mx-auto">
      {Array.from({length:size}).map((_,r)=>(
        <div key={`r-${r}`} className="flex">
          {Array.from({length:size}).map((_,c)=>{
            const k=`${r}-${c}`
            const givenVal = givens.get(k)
            const val = givenVal ?? (showAnswers ? solution[r]?.[c] : '')
            const thickTop = r % subR === 0
            const thickLeft = c % subC === 0
            const thickBottom = r === size-1
            const thickRight = c === size-1
            return (
              <div key={k} className="flex items-center justify-center"
                   style={{
                     width:cellPx, height:cellPx,
                     borderTop:`${thickTop?2:1}px solid #111`,
                     borderLeft:`${thickLeft?2:1}px solid #111`,
                     borderBottom:`${thickBottom?2:1}px solid #111`,
                     borderRight:`${thickRight?2:1}px solid #111`,
                     background: givenVal ? '#f3f4f6' : 'white',
                     fontWeight: givenVal ? 700 : 600
                   }}>
                {val}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
