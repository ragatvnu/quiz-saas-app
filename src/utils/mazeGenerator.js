// src/utils/mazeGenerator.js
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
export function makeSeed(str = "") {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function neighbors(r, c, rows, cols){
  const out = [];
  if (r>0) out.push([r-1,c,'N']);
  if (c<cols-1) out.push([r,c+1,'E']);
  if (r<rows-1) out.push([r+1,c,'S']);
  if (c>0) out.push([r,c-1,'W']);
  return out;
}
function carve(maze, r1, c1, r2, c2){
  if (r2===r1-1 && c2===c1){ maze[r1][c1].N = false; maze[r2][c2].S = false; }
  if (r2===r1+1 && c2===c1){ maze[r1][c1].S = false; maze[r2][c2].N = false; }
  if (c2===c1+1 && r2===r1){ maze[r1][c1].E = false; maze[r2][c2].W = false; }
  if (c2===c1-1 && r2===r1){ maze[r1][c1].W = false; maze[r2][c2].E = false; }
}
export function generateMaze(rows=16, cols=16, seed=12345){
  const rng = mulberry32(Number(seed)>>>0);
  const maze = Array.from({length:rows}, (_,r)=>Array.from({length:cols},(_,c)=>({r,c,N:true,S:true,E:true,W:true})));
  const visited = Array.from({length:rows}, ()=>Array.from({length:cols}, ()=>false));
  const stack = [[0,0]]; visited[0][0] = true;
  while (stack.length){
    const [r,c] = stack[stack.length-1];
    const neigh = neighbors(r,c,rows,cols).filter(([nr,nc])=>!visited[nr][nc]);
    if (!neigh.length){ stack.pop(); continue; }
    const [nr,nc] = neigh[(rng()*neigh.length)|0];
    carve(maze, r,c, nr,nc); visited[nr][nc] = true; stack.push([nr,nc]);
  }
  const start=[0,0], end=[rows-1, cols-1];
  const q=[start]; const prev=new Map(); const seen=new Set(["0,0"]);
  const key=(r,c)=>r+','+c;
  while(q.length){
    const [r,c]=q.shift(); if (r===end[0]&&c===end[1]) break;
    const o=maze[r][c]; const nb=[];
    if(!o.N)nb.push([r-1,c]); if(!o.S)nb.push([r+1,c]); if(!o.E)nb.push([r,c+1]); if(!o.W)nb.push([r,c-1]);
    for(const [nr,nc] of nb){ const k=key(nr,nc); if(!seen.has(k)){seen.add(k); prev.set(k,[r,c]); q.push([nr,nc]);} }
  }
  let path=[]; let cur=end;
  while(cur){ path.push(cur); cur=prev.get(key(...cur))||null; }
  path.reverse();
  return { rows, cols, cells: maze, start, end, path };
}
