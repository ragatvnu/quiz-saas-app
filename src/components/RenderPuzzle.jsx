import React from 'react'
import PuzzlePage from './PuzzlePage.jsx'
import OddOneOut from './OddOneOut.jsx'
import EmojiQuiz from './EmojiQuiz.jsx'
import WordSearch from './WordSearch.jsx'

export default function RenderPuzzle({ puzzle, showAnswers }){
  const meta = puzzle.meta || {title:'Puzzle', page_size:'US-Letter'}
  let content = null
  if(puzzle.type==='odd_one_out') content=<OddOneOut data={puzzle} showAnswers={showAnswers}/>
  if(puzzle.type==='emoji_quiz') content=<EmojiQuiz data={puzzle} showAnswers={showAnswers}/>
  if(puzzle.type==='word_search') content=<WordSearch data={puzzle} showAnswers={showAnswers}/>
  if(!content) content=<div className="text-red-600">Unknown type: {puzzle.type}</div>
  return <PuzzlePage meta={meta}>{content}</PuzzlePage>
}
