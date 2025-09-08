import ANIMALS from './themes/animals.json'
import FRUITS from './themes/fruits.json'
import CHRISTMAS from './themes/christmas.json'

function makeOddGrid(rows, cols, mainEmoji, oddEmoji, oddIndex){
  const total = rows * cols
  const safeOdd = Math.max(0, Math.min(oddIndex ?? 0, total - 1))
  return Array.from({length: total}, (_,i) => i === safeOdd ? oddEmoji : mainEmoji)
}

function hydrateTheme(raw){
  // Deep clone (avoid mutating import objects)
  const theme = JSON.parse(JSON.stringify(raw))
  theme.puzzles = (theme.puzzles || []).map(p => {
    if (p.type === 'odd_one_out') {
      const rows = p.grid?.rows ?? 10
      const cols = p.grid?.cols ?? 10
      // If items missing/short, auto-generate from main/odd emoji + odd_index
      const provided = Array.isArray(p.grid?.items) ? p.grid.items : null
      const complete = provided && provided.length === rows * cols
      if (!complete) {
        const mainE = p.main_emoji || '😀'
        const oddE  = p.odd_emoji  || '😎'
        const items = makeOddGrid(rows, cols, mainE, oddE, p.odd_index ?? 0)
        p.grid = { rows, cols, items }
      }
    }
    return p
  })
  return theme
}

export function loadTheme(name){
  const n = String(name).toLowerCase()
  const base =
    n === 'animals'   ? ANIMALS :
    n === 'fruits'    ? FRUITS :
    n === 'christmas' ? CHRISTMAS :
    null
  if (!base) throw new Error('Unknown theme: ' + name)
  return hydrateTheme(base)
}
