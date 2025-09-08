// src/utils/kakuroCore.js
// Hardened core: safe against missing across/down membership for some empties.
// Includes dynamic pattern resolve, generator, solver, validator.

const RNG = {
  _seed: Math.floor(Math.random()*2**31)|0,
  seed(s){ this._seed = (s|0) || 1; },
  next(){ let x=this._seed|0; x^=x<<13; x^=x>>17; x^=x<<5; this._seed=x|0; return (x>>>0)/0x100000000; },
  rand(n){ return Math.floor(this.next()*n); },
  shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=this.rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
};

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
  '7x7-C': [
    ['B','B','B','B','B','B','B'],
    ['B','E','E','E','E','B','B'],
    ['B','E','B','E','E','E','B'],
    ['B','E','E','E','B','E','B'],
    ['B','E','E','B','E','E','B'],
    ['B','B','E','E','E','E','B'],
    ['B','B','B','B','B','B','B'],
  ],
  '7x7-D': [
    ['B','B','B','B','B','B','B'],
    ['B','E','E','B','E','E','B'],
    ['B','E','E','B','E','E','B'],
    ['B','B','E','E','E','B','B'],
    ['B','E','E','B','E','E','B'],
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
  '9x9-B': [
    ['B','B','B','B','B','B','B','B','B'],
    ['B','E','E','E','B','E','E','E','B'],
    ['B','E','B','E','E','E','B','E','B'],
    ['B','E','E','E','B','E','E','E','B'],
    ['B','B','E','B','E','B','E','B','B'],
    ['B','E','E','E','B','E','E','E','B'],
    ['B','E','B','E','E','E','B','E','B'],
    ['B','E','E','E','B','E','E','E','B'],
    ['B','B','B','B','B','B','B','B','B'],
  ],
};

const pools = {
  'RANDOM-7': ['7x7-A','7x7-B','7x7-C','7x7-D'],
  'RANDOM-9': ['9x9-A','9x9-B'],
  'AUTO':     ['7x7-A','7x7-B','7x7-C','7x7-D','9x9-A','9x9-B'],
};

const now = () => (typeof performance!=='undefined' && performance.now) ? performance.now() : Date.now();
const key = (r,c)=> `${r},${c}`;

// ---------- transforms ----------
function rotate90(p){
  const R=p.length, C=p[0].length;
  const out=Array.from({length:C},()=>Array(R).fill('B'));
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) out[c][R-1-r]=p[r][c];
  return out;
}
function rotate180(p){ return rotate90(rotate90(p)); }
function rotate270(p){ return rotate90(rotate180(p)); }
function flipH(p){
  const R=p.length, C=p[0].length;
  const out=Array.from({length:R},()=>Array(C).fill('B'));
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) out[r][C-1-c]=p[r][c];
  return out;
}
function flipV(p){
  const R=p.length, C=p[0].length;
  const out=Array.from({length:R},()=>Array(C).fill('B'));
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) out[R-1-r][c]=p[r][c];
  return out;
}
function clone2D(p){ return p.map(row=>row.slice()); }
function randomTransform(pat){
  const ops=[(x)=>x, rotate90, rotate180, rotate270, flipH, flipV, (x)=>flipH(rotate90(x)), (x)=>flipV(rotate90(x))];
  const op = ops[Math.floor(Math.random()*ops.length)];
  return op(clone2D(pat));
}

export function resolvePattern({ patternName='7x7-A', randomizeOrientation=false, seed=null } = {}){
  if (seed!=null) RNG.seed(seed);
  let base;
  if (pools[patternName]){
    const names = pools[patternName];
    const pick = names[RNG.rand(names.length)];
    base = PATTERNS[pick];
  } else {
    base = PATTERNS[patternName] || PATTERNS['7x7-A'];
  }
  return randomizeOrientation ? randomTransform(base) : clone2D(base);
}

// ---------- helpers ----------
function makeMatrix(pattern){
  const rows=pattern.length, cols=pattern[0].length;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    m[r][c] = pattern[r][c]==='E'? {type:'empty', r, c} : {type:'block', r, c};
  }
  return m;
}
function findRuns(matrix){
  const rows=matrix.length, cols=matrix[0].length;
  const across=[], down=[];
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (matrix[r][c].type==='empty' && (c===0 || matrix[r][c-1].type!=='empty')){
        const cells=[]; let cc=c;
        while (cc<cols && matrix[r][cc].type==='empty'){ cells.push([r,cc]); cc++; }
        if (cells.length>=2) across.push({cells});
      }
    }
  }
  for (let c=0;c<cols;c++){
    for (let r=0;r<rows;r++){
      if (matrix[r][c].type==='empty' && (r===0 || matrix[r-1][c].type!=='empty')){
        const cells=[]; let rr=r;
        while (rr<rows && matrix[rr][c].type==='empty'){ cells.push([rr,c]); rr++; }
        if (cells.length>=2) down.push({cells});
      }
    }
  }
  return { across, down };
}

// ---------- generator (hardened) ----------
function generateSolutionDigitsResolved(pattern, seed, deadline){
  if (seed!=null) RNG.seed(seed);
  const M = makeMatrix(pattern);
  const { across, down } = findRuns(M);

  // map empty -> run memberships
  const map = new Map();
  across.forEach((run, ai)=> run.cells.forEach(([r,c],pos)=>{
    const k=key(r,c); if(!map.has(k)) map.set(k,{}); Object.assign(map.get(k), { A:ai, posA:pos });
  }));
  down.forEach((run, di)=> run.cells.forEach(([r,c],pos)=>{
    const k=key(r,c); if(!map.has(k)) map.set(k,{}); Object.assign(map.get(k), { D:di, posD:pos });
  }));

  // Reject patterns that produce singleton empties (no across and no down)
  for (let r=0;r<M.length;r++) for (let c=0;c<M[0].length;c++){
    if (M[r][c].type==='empty'){
      const info = map.get(key(r,c)) || {};
      if (info.A==null && info.D==null) return null;
    }
  }

  const usedA = across.map(()=> new Set());
  const usedD = down.map(()=> new Set());
  const cells=[];
  for (let r=0;r<M.length;r++) for (let c=0;c<M[0].length;c++) if (M[r][c].type==='empty') cells.push([r,c]);

  function cand(r,c){
    const info = map.get(key(r,c)) || {};
    const Aset = info.A!=null ? usedA[info.A] : null;
    const Dset = info.D!=null ? usedD[info.D] : null;
    const out=[];
    for (let d=1; d<=9; d++){
      if (Aset && Aset.has(d)) continue;
      if (Dset && Dset.has(d)) continue;
      out.push(d);
    }
    return out;
  }

  // Safe heuristic: prefer smaller runs; if missing one direction, treat as size 10
  cells.sort((p,q)=>{
    const ia = map.get(key(p[0],p[1])) || {};
    const ib = map.get(key(q[0],q[1])) || {};
    const la = ia.A!=null ? (across[ia.A]?.cells.length ?? 10) : 10;
    const ld = ia.D!=null ? (down[ia.D]?.cells.length ?? 10) : 10;
    const ra = ib.A!=null ? (across[ib.A]?.cells.length ?? 10) : 10;
    const rd = ib.D!=null ? (down[ib.D]?.cells.length ?? 10) : 10;
    return Math.min(la,ld) - Math.min(ra,rd);
  });

  const assign = new Map();
  function bt(idx){
    if (deadline && now()>deadline) return false;
    if (idx>=cells.length) return true;

    // MRV (based on current used sets)
    let best=idx, bestCount=10;
    for (let i=idx;i<cells.length;i++){
      const [r,c]=cells[i];
      const klen=cand(r,c).length;
      if (klen<bestCount){ best=i; bestCount=klen; if (klen<=1) break; }
    }
    if (best!==idx){ const t=cells[idx]; cells[idx]=cells[best]; cells[best]=t; }
    const [r,c]=cells[idx];
    const info=map.get(key(r,c)) || {};
    const options=cand(r,c);
    RNG.shuffle(options);
    for (const d of options){
      assign.set(key(r,c), d);
      if (info.A!=null) usedA[info.A].add(d);
      if (info.D!=null) usedD[info.D].add(d);
      if (bt(idx+1)) return true;
      if (info.A!=null) usedA[info.A].delete(d);
      if (info.D!=null) usedD[info.D].delete(d);
      assign.delete(key(r,c));
      if (deadline && now()>deadline) return false;
    }
    return false;
  }

  const ok = bt(0);
  if (!ok) return null;

  // Build puzzle from digits (derive clues)
  const rows=M.length, cols=M[0].length;
  const values=Object.fromEntries(assign);
  const out=[];
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    if (M[r][c].type==='block'){
      let right=null, downSum=null;
      if (c+1<cols && M[r][c+1].type==='empty'){ let s=0,cc=c+1; while (cc<cols && M[r][cc].type==='empty'){ s+=values[key(r,cc)]||0; cc++; } right=s; }
      if (r+1<rows && M[r+1][c].type==='empty'){ let s=0,rr=r+1; while (rr<rows && M[rr][c].type==='empty'){ s+=values[key(rr,c)]||0; rr++; } downSum=s; }
      if (right!=null || downSum!=null) out.push({ r,c,type:'clue', ...(right!=null?{right}:{}) , ...(downSum!=null?{down:downSum}:{}) });
      else out.push({ r,c,type:'block' });
    } else out.push({ r,c,type:'empty', value:'' });
  }
  return { rows, cols, cells: out, values };
}

// ---------- solver & validator (unchanged except minor guards) ----------
const combosLen = new Map();
const combosLenSum = new Map();
function buildCombos(len){
  if (combosLen.has(len)) return;
  const digits=[1,2,3,4,5,6,7,8,9];
  const sets=[]; const bySum=new Map();
  (function rec(start, choose, acc){
    if (acc.length===choose){
      const copy=acc.slice(); sets.push(copy);
      const s=copy.reduce((a,b)=>a+b,0);
      if (!bySum.has(s)) bySum.set(s, []);
      bySum.get(s).push(copy);
      return;
    }
    for (let i=start;i<digits.length;i++){ acc.push(digits[i]); rec(i+1, choose, acc); acc.pop(); }
  })(0, len, []);
  combosLen.set(len, sets); combosLenSum.set(len, bySum);
}
function getCombosLenSum(len,sum){ buildCombos(len); const m=combosLenSum.get(len); return m?.get(sum)||[]; }

function buildRunsFromPuzzle(p){
  const { rows, cols, cells } = p;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of cells) m[cell.r][cell.c]=cell;
  const runs={ across:[], down:[] };
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell=m[r][c];
    if (cell.type!=='empty' && c+1<cols && m[r][c+1]?.type==='empty'){
      const list=[]; let cc=c+1; while (cc<cols && m[r][cc]?.type==='empty'){ list.push([r,cc]); cc++; }
      const sum=cell.right; if (sum!=null && list.length>=2) runs.across.push({sum, cells:list});
    }
  }
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell=m[r][c];
    if (cell.type!=='empty' && r+1<rows && m[r+1][c]?.type==='empty'){
      const list=[]; let rr=r+1; while (rr<rows && m[rr][c]?.type==='empty'){ list.push([rr,c]); rr++; }
      const sum=cell.down; if (sum!=null && list.length>=2) runs.down.push({sum, cells:list});
    }
  }
  return runs;
}

export function solveCount(puzzle, cap=2, deadline){
  const { rows, cols } = puzzle;
  const runs = buildRunsFromPuzzle(puzzle);
  const C = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of puzzle.cells) if (cell.type==='empty') C[cell.r][cell.c]= new Set([1,2,3,4,5,6,7,8,9]);

  function reduce(){
    let changed=true;
    while (changed){
      if (deadline && now()>deadline) return;
      changed=false;
      function reduceRun(run){
        const len = run.cells.length;
        const combos = getCombosLenSum(len, run.sum);
        if (!combos.length) return;
        const pos = run.cells.map(([r,c])=> new Set(C[r][c]));
        const viable=[];
        outer: for (const set of combos){
          for (let i=0;i<len;i++){ if (![...pos[i]].some(v=>set.includes(v))) continue outer; }
          viable.push(set);
        }
        if (!viable.length) return;
        for (let i=0;i<len;i++){
          const [r,c]=run.cells[i];
          const before=new Set(C[r][c]);
          for (const d of before){
            let keep=false; for (const set of viable) if (set.includes(d)){ keep=true; break; }
            if (!keep){ C[r][c].delete(d); changed=true; }
          }
        }
      }
      for (const run of runs.across) reduceRun(run);
      for (const run of runs.down)   reduceRun(run);
    }
  }

  reduce();

  let solutions=0;
  const assign=new Map();
  function pickCell(){
    let best=null, cnt=10;
    for (const cell of puzzle.cells){
      if (cell.type!=='empty') continue;
      const k=key(cell.r,cell.c);
      if (assign.has(k)) continue;
      const n=C[cell.r][cell.c].size;
      if (n<cnt){ cnt=n; best=[cell.r,cell.c]; if (n<=1) break; }
    }
    return best;
  }
  function dfs(){
    if (deadline && now()>deadline) return true;
    if (solutions>=cap) return true;
    const pick=pickCell();
    if (!pick){ solutions++; return solutions>=cap; }
    const [r,c]=pick;
    const choices=[...C[r][c]];
    for (const v of choices){
      const saved=new Set(C[r][c]);
      assign.set(key(r,c), v);
      C[r][c]=new Set([v]);
      reduce();
      let dead=false;
      for (const cell of puzzle.cells){
        if (cell.type!=='empty') continue;
        const k2=key(cell.r,cell.c);
        if (!assign.has(k2) && C[cell.r][cell.c].size===0){ dead=true; break; }
      }
      if (!dead) if (dfs()) return true;
      assign.delete(key(r,c));
      C[r][c]=saved;
      if (deadline && now()>deadline) return true;
    }
    return false;
  }
  dfs();
  return solutions;
}

export function validateKakuro(p){
  const issues=[];
  if (!p || !Array.isArray(p.cells)) return {ok:false, issues:['Malformed']};
  const { rows, cols, cells } = p;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of cells) m[cell.r][cell.c]={...cell};
  const isEmpty=(r,c)=> r>=0&&r<rows&&c>=0&&c<cols&&m[r][c]?.type==='empty';

  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell=m[r][c];
    if (cell.type==='clue'){
      if (cell.right!=null){ if (!(isEmpty(r,c+1)&&isEmpty(r,c+2))) issues.push(`short across at (${r},${c})`); }
      if (cell.down!=null){ if (!(isEmpty(r+1,c)&&isEmpty(r+2,c))) issues.push(`short down at (${r},${c})`); }
      if (cell.right==null && cell.down==null) issues.push(`empty clue at (${r},${c})`);
    }
  }
  if (p.values){
    const sumRight=(rr,cc)=>{ let s=0,c=cc+1; while(c<cols && m[rr][c]?.type==='empty'){ s+=p.values[key(rr,c)]|0; c++; } return s; };
    const sumDown =(rr,cc)=>{ let s=0,r=rr+1; while(r<rows && m[r][cc]?.type==='empty'){ s+=p.values[key(r,cc)]|0; r++; } return s; };
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const cell=m[r][c];
      if (cell.type==='clue'){
        if (cell.right!=null){ const s=sumRight(r,c); if (s!==cell.right) issues.push(`right sum mismatch at (${r},${c})`); }
        if (cell.down !=null){ const s=sumDown (r,c); if (s!==cell.down ) issues.push(`down sum mismatch at (${r},${c})`); }
      }
    }
  }
  return { ok: issues.length===0, issues };
}

// Public API
export function generateKakuro({
  patternName='7x7-A',
  randomizeOrientation=false,
  requireUnique=true,
  maxAttempts=60,
  timeBudgetMs=700,
  seed=null
} = {}){
  const deadline = now() + Math.max(200, timeBudgetMs|0);
  let last=null;
  for (let t=0; t<maxAttempts; t++){
    if (deadline && now()>deadline) break;
    const pattern = resolvePattern({ patternName, randomizeOrientation, seed: seed==null? null : (seed+t) });
    const sol = generateSolutionDigitsResolved(pattern, seed==null? null : (seed+t), deadline);
    if (!sol) continue;
    last = sol;
    if (!requireUnique) return sol;
    const u = solveCount(sol, 2, deadline);
    if (u===1) return sol;
  }
  return last;
}
