// PuzzlePacks_Studio.jsx — minimal safeguarded build
import React, { useState } from "react"

const cls = (...cn) => cn.filter(Boolean).join(" ")

// --- Tile (emoji or image) ---
function Tile({ item, size = "text-4xl" }) {
  if (!item) return null
  if (item.src) {
    return (
      <img
        src={item.src}
        alt={item.alt || ""}
        className="mx-auto block select-none"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    )
  }
  const content = item.ch || item.text || "?"
  return <span className={cls("leading-none select-none", size)}>{content}</span>
}

// --- Odd One Out puzzle ---
function OddOneOut({ data, showAnswers }) {
  const { rows, cols, items } = data.grid
  return (
    <div
      className="grid gap-2 mx-auto"
      style={{
        gridTemplateColumns: `repeat(${cols}, 80px)`,
        gridTemplateRows: `repeat(${rows}, 80px)`,
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={cls(
            "bg-white border border-gray-300 rounded-xl flex items-center justify-center p-2",
            showAnswers && i === data.odd_index && "ring-4 ring-red-500"
          )}
        >
          <Tile item={it} />
        </div>
      ))}
    </div>
  )
}

// --- Emoji Quiz puzzle ---
function EmojiQuiz({ data, showAnswers }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4 flex-wrap text-5xl">
        {data.prompt.tiles.map((t, i) => (
          <div key={i} className="w-16 h-16 flex items-center justify-center">
            <Tile item={t} />
          </div>
        ))}
      </div>
      {data.prompt.instruction && (
        <p className="text-center mt-3 text-gray-700 italic">
          {data.prompt.instruction}
        </p>
      )}
      {showAnswers ? (
        <p className="text-center mt-4 font-semibold text-xl">
          Answer: {data.answer.text}
        </p>
      ) : null}
    </div>
  )
}
// --- Word Search puzzle ---
function WordSearch({ data, showAnswers }) {
  const { rows, cols, letters } = data.grid
  const letterAt = (r, c) => letters[r * cols + c] || ""
  const hit = new Set()
  if (showAnswers && data.answers) {
    for (const a of data.answers) {
      for (const [r, c] of a.cells) hit.add(`${r-1}-${c-1}`)
    }
  }
  return (
    <div className="text-center">
      <div
        className="inline-grid gap-[6px] mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 42px)` }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const k = `${r}-${c}`
            const ch = letterAt(r, c)
            const isHit = hit.has(k)
            return (
              <div
                key={k}
                className={`w-[42px] h-[42px] border rounded-md flex items-center justify-center font-semibold ${
                  isHit ? "bg-yellow-200 border-yellow-400" : "border-gray-300"
                }`}
              >
                {ch}
              </div>
            )
          })
        )}
      </div>
      <div className="mt-4">
        <p className="font-semibold">Find these words:</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.word_list.map((w) => (
            <span key={w} className="px-2 py-1 rounded-full bg-gray-100 border text-sm">{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Page wrapper ---
function PuzzlePage({ meta, children }) {
  const width = meta.page_size === "A4" ? "210mm" : "8.5in"
  return (
    <div
      className="page bg-white rounded-2xl shadow-sm border p-6 mx-auto my-6"
      style={{ width }}
    >
      <h2 className="text-2xl font-extrabold text-center">{meta.title}</h2>
      <div className="mt-4 flex items-center justify-center min-h-[200px]">
        {children}
      </div>
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>{meta.license || "HMQUIZ • Personal/Classroom use"}</span>
        {meta.difficulty && <span>Difficulty: {meta.difficulty}</span>}
      </div>
    </div>
  )
}

// --- Master renderer ---
function RenderPuzzle({ puzzle, showAnswers }) {
  const meta = puzzle.meta || { title: "Puzzle", page_size: "US-Letter" }
  let content = null
  if (puzzle.type === "odd_one_out")
    content = <OddOneOut data={puzzle} showAnswers={showAnswers} />
  if (puzzle.type === "emoji_quiz")
    content = <EmojiQuiz data={puzzle} showAnswers={showAnswers} />
  if (puzzle.type === "word_search")
    content = <WordSearch data={puzzle} showAnswers={showAnswers} />   // ✅ added here
  return <PuzzlePage meta={meta}>{content}</PuzzlePage>
}


// --- Sample data ---
const SAMPLE_DATA = [
  {
    meta: {
      id: "p1",
      title: "Odd One Out – Sample",
      subtitle: "Find the one that doesn’t match",
      difficulty: "easy",
      page_size: "US-Letter",
    },
    type: "odd_one_out",
    grid: {
      rows: 3,
      cols: 3,
      items: Array.from({ length: 9 }).map((_, i) =>
        i === 4 ? { ch: "😎" } : { ch: "😀" }
      ),
    },
    odd_index: 4,
    rule_hint: "One face has sunglasses",
  },
  {
    meta: {
      id: "p2",
      title: "Emoji Quiz – Sample",
      subtitle: "Guess the phrase",
      difficulty: "medium",
      page_size: "US-Letter",
    },
    type: "emoji_quiz",
    prompt: {
      tiles: [{ ch: "🎥", alt: "movie" }, { ch: "⭐", alt: "star" }],
      instruction: "Guess the phrase",
    },
    answer: { text: "Movie Star" },
  },
]
{
  meta: {
    id: "p3",
    title: "Word Search – Fruits",
    subtitle: "Find all the fruits",
    difficulty: "medium",
    page_size: "US-Letter",
  },
  type: "word_search",
  grid: {
    rows: 8,
    cols: 8,
    letters: [
      "A","P","P","L","E","Q","R","S",
      "B","A","N","A","N","A","T","U",
      "G","R","A","P","E","L","M","O",
      "M","A","N","G","O","E","E","E",
      "P","E","A","R","X","Y","Z","Z",
      "L","E","M","O","N","A","A","A",
      "K","I","W","I","B","B","B","B",
      "O","R","A","N","G","E","C","C",
    ],
  },
  word_list: ["APPLE","BANANA","GRAPE","MANGO","PEAR","LEMON","KIWI","ORANGE"],
  answers: [
    { word: "APPLE",  cells: [[1,1],[1,2],[1,3],[1,4],[1,5]] },
    { word: "BANANA", cells: [[2,1],[2,2],[2,3],[2,4],[2,5],[2,6]] },
    { word: "GRAPE",  cells: [[3,1],[3,2],[3,3],[3,4],[3,5]] },
    { word: "MANGO",  cells: [[4,1],[4,2],[4,3],[4,4],[4,5]] },
    { word: "PEAR",   cells: [[5,1],[5,2],[5,3],[5,4]] },
    { word: "LEMON",  cells: [[6,1],[6,2],[6,3],[6,4],[6,5]] },
    { word: "KIWI",   cells: [[7,1],[7,2],[7,3],[7,4]] },
    { word: "ORANGE", cells: [[8,1],[8,2],[8,3],[8,4],[8,5],[8,6]] },
  ],
}

// --- Root component ---
export default function PuzzlePacksStudio() {
  const [showAnswers, setShowAnswers] = useState(false)
  console.log("[PuzzlePacks] App running. showAnswers =", showAnswers)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-bold">Puzzle Packs Studio</h1>
          <label className="ml-auto text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
            />
            Show answers
          </label>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {SAMPLE_DATA.map((p) => (
          <RenderPuzzle key={p.meta.id} puzzle={p} showAnswers={showAnswers} />
        ))}
      </div>

      <style>{`
        @page { size: 8.5in 11in; margin: 12mm; }
        @media print { .sticky { display: none !important; } }
      `}</style>
    </div>
  )
}

