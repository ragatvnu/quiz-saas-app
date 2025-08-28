import React from 'react'
import Tile from './Tile.jsx'
export default function OddOneOut({ data, showAnswers }){
  const { rows, cols, items } = data.grid
  return (
    <div className="grid gap-2 mx-auto" style={{gridTemplateColumns:`repeat(${cols},80px)`, gridTemplateRows:`repeat(${rows},80px)`}}>
      {items.map((it, i) => (
        <div key={i} className={`bg-white border rounded-xl flex items-center justify-center p-2 ${showAnswers && i===data.odd_index ? 'ring-4 ring-red-500':''}`}>
          <Tile item={it}/>
        </div>
      ))}
    </div>
  )
}
