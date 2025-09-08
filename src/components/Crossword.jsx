import React, { useMemo } from 'react'

export default function Crossword({ data, showAnswers }){
  const { rows, cols, blocks=[] } = data.grid || {}

  const blockSet = useMemo(() => new Set((blocks||[]).map(([r,c]) => key(r-1,c-1))), [blocks])

  const numberMap = useMemo(() => {
    const m = new Map()
    for (const n of (data.numbers || [])) m.set(key(n.row-1, n.col-1), n.num)
    return m
  }, [data.numbers])

  const filledMap = useMemo(() => {
    const m = new Map()
    if (data.answers?.filled) {
      for (const f of data.answers.filled) {
        m.set(key(f.row-1, f.col-1), String(f.ch || '').toUpperCase().slice(0,1))
      }
    }
    return m
  }, [data.answers])

  function inBounds(r,c){ return r>=0 && c>=0 && r<rows && c<cols }
  function isBlocked(r,c){ return blockSet.has(key(r,c)) }

  function collectPathFromStart(startR, startC, dir){
    const dr = dir==='across' ? 0 : 1
    const dc = dir==='across' ? 1 : 0
    const cells = []
    let r = startR, c = startC
    while (inBounds(r,c) && !isBlocked(r,c)) {
      cells.push([r,c])
      r += dr; c += dc
    }
    return cells
  }

  const acrossClueByNum = useMemo(() => {
    const m = new Map()
    for (const a of (data.clues?.across || [])) m.set(a.num, a)
    return m
  }, [data.clues])
  const downClueByNum = useMemo(() => {
    const m = new Map()
    for (const d of (data.clues?.down || [])) m.set(d.num, d)
    return m
  }, [data.clues])

  // Only consider a start if the corresponding clue exists
  const starts = useMemo(() => {
    const s = { across: [], down: [] }
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        if (isBlocked(r,c)) continue
        const num = numberMap.get(key(r,c))
        if (!num) continue
        // ACROSS start?
        if ((c===0 || isBlocked(r, c-1)) && acrossClueByNum.has(num)) {
          s.across.push({num, r, c})
        }
        // DOWN start?
        if ((r===0 || isBlocked(r-1, c)) && downClueByNum.has(num)) {
          s.down.push({num, r, c})
        }
      }
    }
    return s
  }, [rows, cols, numberMap, blockSet, acrossClueByNum, downClueByNum])

  const issues = useMemo(() => {
    const errs = []

    for (const st of starts.across) {
      const clue = acrossClueByNum.get(st.num)
      const path = collectPathFromStart(st.r, st.c, 'across')
      if (clue.len !== path.length) {
        errs.push(`Across ${st.num}: clue length ${clue.len} ≠ path length ${path.length}.`)
      }
      const letters = path.map(([r,c]) => filledMap.get(key(r,c)) || '')
      const filledCount = letters.filter(Boolean).length
      if (filledCount && filledCount !== path.length) {
        errs.push(`Across ${st.num}: provided filled letters (${filledCount}) do not cover the full entry (${path.length}).`)
      }
    }

    for (const st of starts.down) {
      const clue = downClueByNum.get(st.num)
      const path = collectPathFromStart(st.r, st.c, 'down')
      if (clue.len !== path.length) {
        errs.push(`Down ${st.num}: clue length ${clue.len} ≠ path length ${path.length}.`)
      }
      const letters = path.map(([r,c]) => filledMap.get(key(r,c)) || '')
      const filledCount = letters.filter(Boolean).length
      if (filledCount && filledCount !== path.length) {
        errs.push(`Down ${st.num}: provided filled letters (${filledCount}) do not cover the full entry (${path.length}).`)
      }
    }

    return errs
  }, [starts, acrossClueByNum, downClueByNum, filledMap])

  const cellPx = 42

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="mx-auto">
        <div className="grid gap-[2px] bg-gray-300 p-[2px]"
             style={{gridTemplateColumns:`repeat(${cols},${cellPx}px)`, gridTemplateRows:`repeat(${rows},${cellPx}px)`}}>
          {Array.from({length:rows}).map((_,r)=>
            Array.from({length:cols}).map((_,c)=>{
              const k = key(r,c)
              const blocked = blockSet.has(k)
              const num = numberMap.get(k)
              const ch  = filledMap.get(k)
              return (
                <div key={k} className={blocked ? 'bg-black' : 'bg-white relative'} style={{width:cellPx, height:cellPx}}>
                  {!blocked && (
                    <>
                      {num && <span className="absolute top-0 left-0 text-[10px] text-gray-600 ml-0.5 mt-0.5">{num}</span>}
                      <div className="w-full h-full flex items-center justify-center font-semibold select-none">
                        {showAnswers ? (ch || '') : ''}
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="text-sm">
        {issues.length > 0 && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
            <div className="font-semibold mb-1">Crossword validation found issues:</div>
            <ul className="list-disc ml-5 space-y-1">
              {issues.map((e,i)=><li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Across</h4>
          <ul className="list-disc ml-6 space-y-1">
            {(data.clues?.across||[]).map(c=>(
              <li key={`ac-${c.num}`}>
                <span className="font-semibold">{c.num}.</span> {c.clue} <span className="text-gray-500">({c.len})</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Down</h4>
          <ul className="list-disc ml-6 space-y-1">
            {(data.clues?.down||[]).map(c=>(
              <li key={`dn-${c.num}`}>
                <span className="font-semibold">{c.num}.</span> {c.clue} <span className="text-gray-500">({c.len})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function key(r,c){ return `${r}-${c}` }
