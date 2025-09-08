// src/utils/kakuroGenerator.js
// Correctness-first Kakuro generator + solver.
// - Generator fills digits per cell with MRV and enforces "no repeat within a run".
//   Sums are derived from the filled digits so clues are always consistent.
// - Solver uses run-combination filtering + MRV backtracking to count solutions (for uniqueness).

const RNG = {
  _seed: Math.floor(Math.random()*2**31) | 0,
  seed(s){ this._seed = (s|0) || 1; },
  next(){ // xorshift32
    let x = this._seed | 0;
    x ^= x << 13; x ^= x >> 17; x ^= x << 5;
    this._seed = x | 0; return (x >>> 0) / 0x100000000;
  },
  rand(n){ return Math.floor(this.next() * n); },
  shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=this.rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
};

// ======= Patterns (B=block, E=empty) =======
export const PATTERNS = {
  '7x7-A': [
    ['B','B','B','B','B','B','B'],
    ['B','E','E','B','E','E','B'],
    ['B','E','E','E','E','E','B'],
    ['B','B','E','E','E','B','B'],
    ['B','E','E','E','E','E','B'],
    ['B','E','E','B','E','E','B'],
    ['B','B','B','B','B','B','B'],
  ],
  '7x7-B': [
    ['B','B','B','B','B','B','B'],
    ['B','E','E','E','B','E','B'],
    ['B','E','B','E','E','E','B'],
    ['B','E','E','E','B','E','B'],
    ['B','B','E','E','E','B','B'],
    ['B','E','E','B','E','E','B'],
    ['B','B','B','B','B','B','B'],
  ],
  '9x9-A': [
    ['B','B','B','B','B','B','B','B','B'],
    ['B','E','E','B','E','E','B','E','B'],
    ['B','E','E','E','E','E','B','E','B'],
    ['B','B','E','E','E','B','E','E','B'],
    ['B','E','E','B','E','E','E','B','B'],
    ['B','E','B','E','E','E','B','E','B'],
    ['B','E','E','B','E','E','B','E','B'],
    ['B','E','E','E','E','B','E','E','B'],
    ['B','B','B','B','B','B','B','B','B'],
  ],
};

const key = (r,c)=> r+','+c;

function makeMatrix(pattern){
  const rows = pattern.length, cols = pattern[0].length;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    m[r][c] = pattern[r][c]==='E'? {type:'empty', r, c} : {type:'block', r, c};
  }
  return m;
}

function findRuns(matrix){
  const rows = matrix.length, cols = matrix[0].length;
  const across=[], down=[];
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (matrix[r][c].type==='empty' && (c===0 || matrix[r][c-1].type!=='empty')){
        const cells=[]; let cc=c;
        while (cc<cols && matrix[r][cc].type==='empty'){ cells.push([r,cc]); cc++; }
        if (cells.length >= 2) across.push({ cells });
      }
    }
  }
  for (let c=0;c<cols;c++){
    for (let r=0;r<rows;r++){
      if (matrix[r][c].type==='empty' && (r===0 || matrix[r-1][c].type!=='empty')){
        const cells=[]; let rr=r;
        while (rr<rows && matrix[rr][c].type==='empty'){ cells.push([rr,c]); rr++; }
        if (cells.length >= 2) down.push({ cells });
      }
    }
  }
  return { across, down };
}

// ====== Generator (digits first, sums afterwards) ======
function generateSolutionDigits(patternName, seed){
  if (seed != null) RNG.seed(seed);
  const pattern = PATTERNS[patternName] || PATTERNS['7x7-A'];
  const M = makeMatrix(pattern);
  const { across, down } = findRuns(M);

  // map cell -> {A: index, posA, D: index, posD}
  const map = new Map();
  across.forEach((run, ai)=> run.cells.forEach(([r,c], pos)=>{
    const k=key(r,c); if(!map.has(k)) map.set(k,{}); map.get(k).A = ai; map.get(k).posA = pos;
  }));
  down.forEach((run, di)=> run.cells.forEach(([r,c], pos)=>{
    const k=key(r,c); if(!map.has(k)) map.set(k,{}); map.get(k).D = di; map.get(k).posD = pos;
  }));

  // per-run used digits
  const usedA = across.map(run=> new Set());
  const usedD = down.map(run=> new Set());

  // list of all variable cells
  const cells = [];
  for (let r=0;r<M.length;r++) for (let c=0;c<M[0].length;c++){
    if (M[r][c].type==='empty') cells.push([r,c]);
  }

  // MRV: candidate digits = 1..9 minus used in its across+down runs
  function candidates(r,c){
    const info = map.get(key(r,c));
    const Aset = usedA[info.A], Dset = usedD[info.D];
    const out=[];
    for (let d=1; d<=9; d++) if (!Aset.has(d) && !Dset.has(d)) out.push(d);
    return out;
  }

  // order cells by increasing min(#run lengths) then dynamic MRV
  cells.sort((p,q)=>{
    const ia = map.get(key(p[0],p[1]));
    const ib = map.get(key(q[0],q[1]));
    const la = Math.min(across[ia.A].cells.length, down[ia.D].cells.length);
    const lb = Math.min(across[ib.A].cells.length, down[ib.D].cells.length);
    return la - lb;
  });

  const assign = new Map();

  function backtrack(idx){
    if (idx >= cells.length) return true;
    // pick next cell with smallest domain (MRV)
    let best = idx, bestCount = 10;
    for (let i=idx; i<cells.length; i++){
      const [r,c] = cells[i];
      const cand = candidates(r,c);
      if (cand.length < bestCount){ best=i; bestCount=cand.length; if (bestCount<=1) break; }
    }
    if (best !== idx){ const t=cells[idx]; cells[idx]=cells[best]; cells[best]=t; }

    const [r,c] = cells[idx];
    const info = map.get(key(r,c));
    const cand = candidates(r,c);
    if (cand.length === 0) return false;
    RNG.shuffle(cand);
    for (const d of cand){
      assign.set(key(r,c), d);
      usedA[info.A].add(d);
      usedD[info.D].add(d);
      if (backtrack(idx+1)) return true;
      usedA[info.A].delete(d);
      usedD[info.D].delete(d);
      assign.delete(key(r,c));
    }
    return false;
  }

  const ok = backtrack(0);
  if (!ok) return null;

  // Build final puzzle with sums derived
  const rows = M.length, cols = M[0].length;
  const values = Object.fromEntries([...assign.entries()]);
  const cellsOut = [];
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    if (M[r][c].type==='block'){
      // compute across/down sums if runs start here
      let right=null, downSum=null;
      if (c+1<cols && M[r][c+1].type==='empty'){
        let s=0, cc=c+1; while (cc<cols && M[r][cc].type==='empty'){ s += values[key(r,cc)]; cc++; }
        right=s;
      }
      if (r+1<rows && M[r+1][c].type==='empty'){
        let s=0, rr=r+1; while (rr<rows && M[rr][c].type==='empty'){ s += values[key(rr,c)]; rr++; }
        downSum=s;
      }
      if (right!=null || downSum!=null) cellsOut.push({ r, c, type:'clue', ...(right!=null?{right}:{}) , ...(downSum!=null?{down:downSum}:{}) });
      else cellsOut.push({ r, c, type:'block' });
    } else {
      cellsOut.push({ r, c, type:'empty', value:'' });
    }
  }

  return { rows, cols, cells: cellsOut, values };
}

// ======= Combos by length & sum (no-repeat) =======
const combosLen = new Map();          // len -> [digits[]]
const combosLenSum = new Map();       // len -> Map(sum -> [digits[]])

function buildCombos(len){
  if (combosLen.has(len)) return;
  const digits=[1,2,3,4,5,6,7,8,9];
  const sets=[];
  const bySum=new Map();
  function rec(start, choose, acc){
    if (acc.length===choose){
      const copy=acc.slice();
      sets.push(copy);
      const s=copy.reduce((a,b)=>a+b,0);
      if (!bySum.has(s)) bySum.set(s, []);
      bySum.get(s).push(copy);
      return;
    }
    for (let i=start;i<digits.length;i++){
      acc.push(digits[i]); rec(i+1, choose, acc); acc.pop();
    }
  }
  rec(0,len,[]);
  combosLen.set(len, sets);
  combosLenSum.set(len, bySum);
}
function getCombosLen(len){ buildCombos(len); return combosLen.get(len); }
function getCombosLenSum(len,sum){ buildCombos(len); const m=combosLenSum.get(len); return m.get(sum)||[]; }

// ======= Solver (counts solutions) =======
function buildRunsFromPuzzle(p){
  const { rows, cols, cells } = p;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of cells) m[cell.r][cell.c] = cell;

  const runs={ across:[], down:[] };
  // across
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell = m[r][c];
    const start = (cell.type!=='empty') && c+1<cols && m[r][c+1].type==='empty';
    if (start){
      const list=[]; let cc=c+1;
      while (cc<cols && m[r][cc].type==='empty'){ list.push([r,cc]); cc++; }
      const sum = cell.right;
      if (sum!=null && list.length>=2) runs.across.push({ sum, cells:list });
    }
  }
  // down
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell = m[r][c];
    const start = (cell.type!=='empty') && r+1<rows && m[r+1][c].type==='empty';
    if (start){
      const list=[]; let rr=r+1;
      while (rr<rows && m[rr][c].type==='empty'){ list.push([rr,c]); rr++; }
      const sum = cell.down;
      if (sum!=null && list.length>=2) runs.down.push({ sum, cells:list });
    }
  }
  return runs;
}

export function solveCount(puzzle, cap=2){
  const { rows, cols } = puzzle;
  const runs = buildRunsFromPuzzle(puzzle);

  // Per-run viable combos (start as all combos by sum)
  const A = runs.across.map(run => getCombosLenSum(run.cells.length, run.sum).map(set=>new Set(set)));
  const D = runs.down.map(run => getCombosLenSum(run.cells.length, run.sum).map(set=>new Set(set)));

  // Cell indices
  const cellInfo = new Map(); // "r,c" -> { A: ai, posA, D: di, posD }
  runs.across.forEach((run, ai)=> run.cells.forEach(([r,c], pos)=>{
    const k=key(r,c); if (!cellInfo.has(k)) cellInfo.set(k,{});
    Object.assign(cellInfo.get(k), { A: ai, posA: pos });
  }));
  runs.down.forEach((run, di)=> run.cells.forEach(([r,c], pos)=>{
    const k=key(r,c); if (!cellInfo.has(k)) cellInfo.set(k,{});
    Object.assign(cellInfo.get(k), { D: di, posD: pos });
  }));

  // Candidate digits per cell (dynamic)
  const C = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of puzzle.cells) if (cell.type==='empty') C[cell.r][cell.c] = new Set([1,2,3,4,5,6,7,8,9]);

  // Assigned digits per run (to enforce "no repeat within run")
  const usedA = runs.across.map(_=> new Set());
  const usedD = runs.down.map(_=> new Set());

  function recomputeCellCandidatesFromRuns(){
    let changed=false;
    // For each run, compute which digits are possible at any position given viable sets and used digits
    function digitsFromViableSets(sets, used){
      const union=new Set();
      for (const s of sets){
        // Filter out sets that violate used digits (i.e., contain a digit that is already used more than allowed).
        let ok=true;
        for (const d of used) if (!s.has(d)) { ok=false; break; } // if a digit is already fixed in run, all sets must include it
        if (!ok) continue;
        for (const d of s) union.add(d);
      }
      // Remove digits already used? We allow them for the positions that carry them.
      return union;
    }

    // Propagate across
    for (let ai=0; ai<runs.across.length; ai++){
      const run = runs.across[ai];
      const possibleDigits = digitsFromViableSets(A[ai], usedA[ai]);
      for (let pos=0; pos<run.cells.length; pos++){
        const [r,c] = run.cells[pos];
        const before= new Set(C[r][c]);
        for (const d of before) if (!possibleDigits.has(d)) C[r][c].delete(d);
        if (C[r][c].size !== before.size) changed=true;
      }
    }
    // Propagate down
    for (let di=0; di<runs.down.length; di++){
      const run = runs.down[di];
      const possibleDigits = digitsFromViableSets(D[di], usedD[di]);
      for (let pos=0; pos<run.cells.length; pos++){
        const [r,c] = run.cells[pos];
        const before= new Set(C[r][c]);
        for (const d of before) if (!possibleDigits.has(d)) C[r][c].delete(d);
        if (C[r][c].size !== before.size) changed=true;
      }
    }
    return changed;
  }

  function pruneRunCombos(){
    let changed=false;
    // remove run sets that contain digits not present in candidate cells OR conflict with used digits
    function prune(sets, runCells, used){
      let i=0;
      while (i<sets.length){
        const s = sets[i];
        // must include all used digits
        let ok=true;
        for (const d of used) if (!s.has(d)) { ok=false; break; }
        if (ok){
          // every element of set must be placeable in at least one position (Hall-like check light)
          for (const d of s){
            let canPlace=false;
            for (const [r,c] of runCells) if (C[r][c].has(d)) { canPlace=true; break; }
            if (!canPlace){ ok=false; break; }
          }
        }
        if (!ok){ sets.splice(i,1); changed=true; }
        else i++;
      }
    }

    for (let ai=0; ai<runs.across.length; ai++) prune(A[ai], runs.across[ai].cells, usedA[ai]);
    for (let di=0; di<runs.down.length; di++) prune(D[di], runs.down[di].cells, usedD[di]);
    return changed;
  }

  function reduce(){
    let progress=true;
    while (progress){
      progress=false;
      if (recomputeCellCandidatesFromRuns()) progress=true;
      if (pruneRunCombos()) progress=true;
      // Singleton cells => fix into used sets logically (lightweight)
      for (const cell of puzzle.cells){
        if (cell.type!=='empty') continue;
        const {r,c}=cell;
        if (C[r][c].size===1){
          const v=[...C[r][c]][0];
          const info = cellInfo.get(key(r,c));
          if (!usedA[info.A].has(v)){ usedA[info.A].add(v); progress=true; }
          if (!usedD[info.D].has(v)){ usedD[info.D].add(v); progress=true; }
        }
      }
    }
  }

  reduce();

  let solutions=0;
  const assign = new Map();

  function pickCell(){
    let best=null, bestCount=10;
    for (const cell of puzzle.cells){
      if (cell.type!=='empty') continue;
      const k = key(cell.r,cell.c);
      if (assign.has(k)) continue;
      const n = C[cell.r][cell.c].size;
      if (n < bestCount){ best=[cell.r,cell.c]; bestCount=n; if (n<=1) break; }
    }
    return best;
  }

  function dfs(){
    if (solutions>=cap) return true;
    const pick = pickCell();
    if (!pick){ solutions++; return solutions>=cap; }
    const [r,c] = pick;
    const info = cellInfo.get(key(r,c));
    const choices = [...C[r][c]];
    // try smallest-first to find a solution quickly
    choices.sort((a,b)=>a-b);
    for (const v of choices){
      // Save snapshots
      const snapC = C.map(row=> row.map(s=> s? new Set(s) : s));
      const snapA = usedA.map(s=> new Set(s));
      const snapD = usedD.map(s=> new Set(s));
      const snapCombA = A.map(arr=> arr.slice());
      const snapCombD = D.map(arr=> arr.slice());

      // Place value
      assign.set(key(r,c), v);
      C[r][c] = new Set([v]);
      usedA[info.A].add(v);
      usedD[info.D].add(v);

      reduce();

      // Dead check
      let dead=false;
      for (const cell of puzzle.cells){
        if (cell.type!=='empty') continue;
        const k2 = key(cell.r,cell.c);
        if (!assign.has(k2) && C[cell.r][cell.c].size===0){ dead=true; break; }
      }

      if (!dead){
        if (dfs()) return true;
      }

      // Restore
      assign.delete(key(r,c));
      for (let i=0;i<rows;i++) for (let j=0;j<cols;j++) C[i][j] = snapC[i][j];
      for (let i=0;i<usedA.length;i++){ usedA[i] = snapA[i]; }
      for (let i=0;i<usedD.length;i++){ usedD[i] = snapD[i]; }
      for (let i=0;i<A.length;i++){ A[i] = snapCombA[i]; }
      for (let i=0;i<D.length;i++){ D[i] = snapCombD[i]; }
    }
    return false;
  }

  dfs();
  return solutions;
}

// ======= Public API =======
export function generateKakuro({ patternName='7x7-A', maxAttempts=50, requireUnique=true, seed=null } = {}){
  for (let t=0; t<maxAttempts; t++){
    const sol = generateSolutionDigits(patternName, seed==null? null : (seed + t));
    if (!sol) continue;
    if (!requireUnique) return sol;
    const n = solveCount(sol, 2);
    if (n === 1) return sol;
  }
  // fallback: return last valid (may not be unique)
  const last = generateSolutionDigits(patternName, seed);
  return last;
}

export function generateKakuroBatch(n=3, opts={}){
  const out=[];
  for (let i=0;i<n;i++) out.push(generateKakuro(opts));
  return out;
}

export function fillKakuroAnswers(puzzle, valuesMap){
  for (const cell of puzzle.cells){
    if (cell.type === 'empty'){
      const k = key(cell.r, cell.c);
      if (valuesMap && valuesMap[k]!=null) cell.value = valuesMap[k];
    }
  }
}
