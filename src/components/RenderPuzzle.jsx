import React from 'react'
import PuzzlePage from './PuzzlePage.jsx'
import OddOneOut from './OddOneOut.jsx'
import EmojiQuiz from './EmojiQuiz.jsx'
import WordSearch from './WordSearch.jsx'
import Crossword from './Crossword.jsx'
import Sudoku from './Sudoku.jsx'
import FillInBlanks from './FillInBlanks.jsx'
import SpotTheDifference from './SpotTheDifference.jsx'

export default function RenderPuzzle({ puzzle, showAnswers }){
  const meta = puzzle.meta || { title:'Puzzle', page_size:'US-Letter' }
  let content = null
  switch(puzzle.type){
    case 'odd_one_out':        content = <OddOneOut data={puzzle} showAnswers={showAnswers}/>; break
    case 'emoji_quiz':         content = <EmojiQuiz data={puzzle} showAnswers={showAnswers}/>; break
    case 'word_search':        content = <WordSearch data={puzzle} showAnswers={showAnswers}/>; break
    case 'crossword':          content = <Crossword data={puzzle} showAnswers={showAnswers}/>; break
    case 'sudoku':             content = <Sudoku data={puzzle} showAnswers={showAnswers}/>; break
    case 'fill_in_blanks':     content = <FillInBlanks data={puzzle} showAnswers={showAnswers}/>; break
    case 'spot_the_difference':content = <SpotTheDifference data={puzzle} showAnswers={showAnswers}/>; break
    default:                   content = <div className="text-red-600">Unknown puzzle type: {String(puzzle.type)}</div>
  }
  return <PuzzlePage meta={meta}>{content}</PuzzlePage>
}
