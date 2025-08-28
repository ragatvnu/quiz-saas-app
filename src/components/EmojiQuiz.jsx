import React from 'react'
import Tile from './Tile.jsx'
export default function EmojiQuiz({ data, showAnswers }){
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4 flex-wrap text-5xl">
        {data.prompt.tiles.map((t,i)=>(<div key={i} className="w-16 h-16 flex items-center justify-center"><Tile item={t}/></div>))}
      </div>
      {data.prompt.instruction && <p className="mt-3 italic">{data.prompt.instruction}</p>}
      {showAnswers && <p className="mt-4 font-semibold">Answer: {data.answer.text}</p>}
    </div>
  )
}
