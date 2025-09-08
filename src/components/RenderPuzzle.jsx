import React, { useState, useMemo } from 'react'
import PuzzlePage from './PuzzlePage.jsx'
import OddOneOut from './OddOneOut.jsx'
import WordSearch from './WordSearch.jsx'
import FillInBlanks from './FillInBlanks.jsx'
import Crossword from './Crossword.jsx'
import Sudoku from './Sudoku.jsx'
import SpotDifference from './SpotDifference.jsx'
import EmojiQuiz from './EmojiQuiz.jsx'

export default function RenderPuzzle({ puzzle, showAnswers }) {
  const baseMeta = puzzle.meta || { title: puzzle.title || 'Puzzle', page_size: 'A4' }
  const [childTitle, setChildTitle] = useState(null)

  const meta = useMemo(()=>({
    ...baseMeta,
    title: childTitle || baseMeta.title
  }), [baseMeta, childTitle])

  let content = null
  switch (puzzle.type) {
    case 'odd_one_out':
      content = <OddOneOut data={puzzle} showAnswers={showAnswers} onTitleChange={setChildTitle} />
      break
    case 'word_search':
      content = <WordSearch data={puzzle} showAnswers={showAnswers} onTitleChange={setChildTitle} />
      break
    case 'emoji_quiz':
      content = <EmojiQuiz data={puzzle} showAnswers={showAnswers} onTitleChange={setChildTitle} />
      break
    case 'fill_in_blanks':
      content = <FillInBlanks data={puzzle} showAnswers={showAnswers} />
      break
    case 'crossword':
      content = <Crossword data={puzzle} showAnswers={showAnswers} />
      break
    case 'sudoku':
      content = <Sudoku data={puzzle} showAnswers={showAnswers} />
      break
    case 'spot_the_difference':
      content = <SpotDifference data={puzzle} showAnswers={showAnswers} />
      break
    default:
      content = <div className="text-sm text-gray-500">Unknown puzzle type: {String(puzzle.type)}</div>
  }
  return <PuzzlePage meta={meta}>{content}</PuzzlePage>
}
