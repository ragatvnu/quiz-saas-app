import React, { useMemo } from 'react'

/**
 * Auto-placing Word Search.
 * If grid.letters exists AND auto_layout !== true → renders as-is.
 * Else → auto-place words horizontally/vertically (optionally reversed),
 * fill remaining with random letters, and generate answers for highlighting.
 */
export default function WordSearch({ data, showAnswers }) {
  const { rows, cols, letters: providedLetters } = data.grid || {}
  const {
    allowReverse = true,
    directions = ['H','V'],           // 'H'→, 'V'↓; if allowReverse, adds ← and ↑
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    maxAttemptsPerWord = 500,
  } = data.options || {}

  const shouldAutoLayout =
    data.auto_layout === true || !providedLetters || providedLetters.length !== (rows * cols)

  const { letters, answers } = useMemo(() => {
    if (!shouldAutoLayout) {
      return { letters: providedLetters, answers: data.answers || [] }
    }
    if (!rows || !cols) throw new Error('WordSearch auto_layout requires grid.rows and grid.cols')
    if (!Array.isArray(data.word_list) || data.word_list.length === 0)
      throw new Error('WordSearch auto_layout requires a non-empty word_list')

    const words = data.word_list.map(w => String(w).replace(/\s+/g,'').toUpperCase())
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null))

    const dirList = []
    if (directions.includes('H')) { dirList.push({name:'H',dr:0,dc:1}); if (allowReverse) dirList.push({name:'H_rev',dr:0,dc:-1}) }
    if (directions.includes('V')) { dirList.push({name:'V',dr:1,dc:0}); if (allowReverse) dirList.push({name:'V_rev',dr:-1,dc:0}) }
    if (dirList.length === 0) dirList.push({ name: 'H', dr:0, dc:1 })

    const placed = []
    for (const word of words) {
      const L = word.length
      let placedOK = false
      for (let attempt=0; attempt<maxAttemptsPerWord && !placedOK; attempt++) {
        const d = dirList[Math.floor(Math.random()*dirList.length)]
        let rMin=0, rMax=rows-1, cMin=0, cMax=cols-1
        if (d.dc===1) cMax = cols - L
        if (d.dc===-1) cMin = L - 1
        if (d.dr===1) rMax = rows - L
        if (d.dr===-1) rMin = L - 1
        if (rMax<rMin || cMax<cMin) continue

        const r0 = randInt(rMin, rMax)
        const c0 = randInt(cMin, cMax)

        let fits = true
        for (let i=0;i<L;i++){
          const rr=r0+i*d.dr, cc=c0+i*d.dc, cur=grid[rr][cc], ch=word[i]
          if (cur!==null && cur!==ch){ fits=false; break }
        }
        if (!fits) continue

        const cells=[]
        for (let i=0;i<L;i++){
          const rr=r0+i*d.dr, cc=c0+i*d.dc
          grid[rr][cc]=word[i]
          cells.push([rr+1, cc+1])   // 1-based
        }
        placed.push({ word, cells, dirName:d.name })
        placedOK = true
      }
    }

    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        if (grid[r][c]===null){
          grid[r][c]=alphabet[Math.floor(Math.random()*alphabet.length)]||'X'
        }
      }
    }

    const flat=[]
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) flat.push(grid[r][c])
    return { letters: flat, answers: placed.map(p=>({ word:p.word, cells:p.cells })) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, JSON.stringify(data.word_list), shouldAutoLayout, allowReverse, JSON.stringify(directions), alphabet, maxAttemptsPerWord])

  const marked = useMemo(()=>{
    const m=new Set()
    if (showAnswers && answers) answers.forEach(a=>a.cells.forEach(([r,c])=>m.add(`${r-1}-${c-1}`)))
    return m
  }, [showAnswers, answers])

  const letterAt = (r,c)=> letters?.[r*cols + c] || ''

  return (
    <div className="text-center">
      <div className="inline-grid gap-[6px] mx-auto" style={{gridTemplateColumns:`repeat(${cols},42px)`}}>
        {Array.from({length:rows}).map((_,r)=>
          Array.from({length:cols}).map((_,c)=>{
            const k=`${r}-${c}`, ch=letterAt(r,c), hit=marked.has(k)
            return (
              <div key={k} className={`w-[42px] h-[42px] border rounded-md flex items-center justify-center font-semibold ${hit?'bg-yellow-200 border-yellow-400':'border-gray-300'}`}>
                {ch}
              </div>
            )
          })
        )}
      </div>
      <div className="mt-4">
        <p className="font-semibold">Find these words:</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {(data.word_list||[]).map(w=> <span key={w} className="px-2 py-1 rounded-full bg-gray-100 border text-sm">{w}</span>)}
        </div>
      </div>
    </div>
  )
}

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min }
