export class Sudoku {
  constructor(opts) {
    this.opts = opts;
    this.grid = this.emptyGrid();
    this.fixed = this.emptyGrid(false);
    this.notes = Array.from({length:9}, ()=> Array.from({length:9}, ()=> new Set()));
    this.noteMode = false;
    this.onCellClick = null;
  }

  emptyGrid(fillZero=true) {
    return Array.from({length:9}, ()=> Array.from({length:9}, ()=> fillZero?0:false));
  }

  /* ---------- Rendering ---------- */
  render() {
    const host = this.opts.mount;
    host.innerHTML = "";
    const gridEl = document.createElement("div");
    gridEl.className = "pp-grid pp-sudoku";
    gridEl.style.gridTemplateColumns = "repeat(9, 44px)";
    gridEl.style.gridTemplateRows = "repeat(9, 44px)";
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        const cell = document.createElement("div");
        cell.className = "pp-cell";
        cell.onclick = ()=>{ if (this.onCellClick) this.onCellClick(r,c); };
        gridEl.appendChild(cell);
      }
    }
    host.appendChild(gridEl);
    this.refresh();
  }
  cellEl(r,c) { return this.opts.mount.querySelectorAll('.pp-cell')[r*9 + c]; }

  refresh() {
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        const el = this.cellEl(r,c);
        if (!el) continue;
        el.classList.remove('wrong','correct','fixed','answer');
        el.innerHTML = "";
        const v = this.grid[r][c];
        if (this.fixed[r][c]) el.classList.add('fixed');
        if (v) {
          el.textContent = v;
        } else {
          const notes = Array.from(this.notes[r][c]).sort((a,b)=>a-b);
          if (notes.length) {
            const small = document.createElement('div');
            small.style.fontSize = '10px';
            small.style.opacity = '.8';
            small.textContent = notes.join(' ');
            el.appendChild(small);
          }
        }
      }
    }
  }

  /* ---------- Editing / IO ---------- */
  place(r,c,d) {
    if (this.fixed[r][c]) return;
    if (this.noteMode) {
      if (this.notes[r][c].has(d)) this.notes[r][c].delete(d);
      else this.notes[r][c].add(d);
    } else {
      this.grid[r][c] = d; this.notes[r][c].clear();
    }
    this.refresh();
  }

  clear() {
    this.grid = this.emptyGrid();
    this.fixed = this.emptyGrid(false);
    this.notes = Array.from({length:9}, ()=> Array.from({length:9}, ()=> new Set()));
    this.refresh();
  }

  exportJSON() {
    const data = { grid: this.grid, fixed: this.fixed };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sudoku_export.json'; a.click();
    URL.revokeObjectURL(url);
  }

  loadJSON(obj) {
    if (obj.grid && obj.grid.length===9) this.grid = obj.grid.map(row=> row.slice());
    if (obj.fixed) this.fixed = obj.fixed.map(row=> row.slice());
    else {
      this.fixed = this.emptyGrid(false);
      for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (this.grid[r][c]!==0) this.fixed[r][c]=true;
    }
    this.notes = Array.from({length:9}, ()=> Array.from({length:9}, ()=> new Set()));
    this.refresh();
  }

  /* ---------- Solver / Generator ---------- */
  validPlacement(grid, r, c, d) {
    for (let i=0;i<9;i++) if (grid[r][i]===d || grid[i][c]===d) return false;
    const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
    for (let rr=br; rr<br+3; rr++) for (let cc=bc; cc<bc+3; cc++)
      if (grid[rr][cc]===d) return false;
    return true;
  }

  solveGrid(grid) {
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        if (grid[r][c]===0) {
          for (let d=1; d<=9; d++) {
            if (this.validPlacement(grid, r, c, d)) {
              grid[r][c] = d;
              if (this.solveGrid(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  /** NEW: pure (DOM-free) solver that returns a solved copy or null */
  solveModel(model) {
    const solved = model.grid.map(row=> row.slice());
    const ok = this.solveGrid(solved);
    return ok ? { grid: solved, fixed: model.fixed.map(row=> row.slice()) } : null;
  }

  solve() {
    const clone = this.grid.map(row=> row.slice());
    if (this.solveGrid(clone)) { this.grid = clone; this.refresh(); }
    else alert("No solution found.");
  }

  /** Generate a full solved base then punch holes by level. Returns {grid,fixed} model */
  newPuzzleModel(level='easy') {
    let grid = this.emptyGrid();
    const fillBox = (r0,c0)=>{
      let d = [1,2,3,4,5,6,7,8,9];
      for (let r=0;r<3;r++) for (let c=0;c<3;c++) {
        const pick = d.splice(Math.floor(Math.random()*d.length),1)[0];
        grid[r0+r][c0+c] = pick;
      }
    };
    fillBox(0,0); fillBox(3,3); fillBox(6,6);
    this.solveGrid(grid);

    const swapRows = (a,b)=>{ [grid[a], grid[b]] = [grid[b], grid[a]]; };
    const swapCols = (a,b)=>{ for(let r=0;r<9;r++){ const t=grid[r][a]; grid[r][a]=grid[r][b]; grid[r][b]=t; } };
    for (let k=0;k<20;k++) {
      const g = Math.floor(Math.random()*3)*3;
      swapRows(g + Math.floor(Math.random()*3), g + Math.floor(Math.random()*3));
      const s = Math.floor(Math.random()*3)*3;
      swapCols(s + Math.floor(Math.random()*3), s + Math.floor(Math.random()*3));
    }

    let holes = level==='easy'?40:level==='medium'?50:58;
    const puzzle = grid.map(row=> row.slice());
    while (holes>0) {
      const r = Math.floor(Math.random()*9), c = Math.floor(Math.random()*9);
      if (puzzle[r][c]!==0) { puzzle[r][c]=0; holes--; }
    }
    const fixed = this.emptyGrid(false);
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (puzzle[r][c]!==0) fixed[r][c]=true;
    return { grid: puzzle, fixed };
  }

  /** Render a specific model onto the existing DOM grid */
  renderModel(model) {
    this.grid  = model.grid.map(row=> row.slice());
    this.fixed = model.fixed.map(row=> row.slice());
    this.notes = Array.from({length:9}, ()=> Array.from({length:9}, ()=> new Set()));
    this.refresh();
  }

  /** Old API: mutate current instance */
  newPuzzle(level='easy') {
    this.renderModel(this.newPuzzleModel(level));
  }

  /** Batch of N puzzles at difficulty */
  newBatch(level='easy', count=10) {
    const out = [];
    for (let i=0;i<count;i++) out.push(this.newPuzzleModel(level));
    return out;
  }

  check() {
    const solved = this.grid.map(row=> row.slice()); this.solveGrid(solved);
    let correct=0, filled=0;
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        const el = this.cellEl(r,c);
        if (!el) continue;
        el.classList.remove('wrong','correct');
        if (this.grid[r][c]!==0) {
          filled++;
          if (this.grid[r][c]===solved[r][c]) { el.classList.add('correct'); correct++; }
          else { el.classList.add('wrong'); }
        }
      }
    }
    alert(`Filled correctly: ${correct}/${filled}`);
  }

  revealAnswers() {
    const solved = this.grid.map(row => row.slice());
    if (!this.solveGrid(solved)) { alert("No solution found."); return; }
    this.grid = solved;
    this.refresh();
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (!this.fixed[r][c]) this.cellEl(r,c)?.classList.add('answer');
  }
}
