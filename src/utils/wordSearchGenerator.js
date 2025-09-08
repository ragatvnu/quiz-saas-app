// src/utils/wordSearchGenerator.js
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

export function generateWordSearch(words, rows = 12, cols = 12, seed = undefined) {
  const upperWords = (words || []).map(w => (w || '').trim().toUpperCase()).filter(Boolean);
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  const placements = [];
  const rng = (seed===undefined || seed===null) ? Math.random : mulberry32(Number(seed)>>>0);
  const randInt = (n)=> Math.floor(rng()*n);

  function canPlaceH(r, c, word) {
    if (c + word.length > cols) return false;
    for (let i=0;i<word.length;i++){ const ch=grid[r][c+i]; if (ch && ch !== word[i]) return false; }
    return true;
  }
  function canPlaceV(r, c, word) {
    if (r + word.length > rows) return false;
    for (let i=0;i<word.length;i++){ const ch=grid[r+i][c]; if (ch && ch !== word[i]) return false; }
    return true;
  }
  function placeH(r, c, word) {
    const cells=[]; for (let i=0;i<word.length;i++){ grid[r][c+i]=word[i]; cells.push({r, c:c+i}); }
    placements.push({ word, cells, dir:'H' });
  }
  function placeV(r, c, word) {
    const cells=[]; for (let i=0;i<word.length;i++){ grid[r+i][c]=word[i]; cells.push({r:r+i, c}); }
    placements.push({ word, cells, dir:'V' });
  }

  upperWords.sort((a,b)=> b.length - a.length);
  for (const w of upperWords) {
    let placed = false;
    for (let attempts=0; attempts<500 && !placed; attempts++) {
      const dir = rng() < 0.5 ? 'H' : 'V';
      const r = dir==='H' ? randInt(rows) : randInt(rows - w.length + 1);
      const c = dir==='H' ? randInt(cols - w.length + 1) : randInt(cols);
      if (dir==='H') { if (canPlaceH(r,c,w)) { placeH(r,c,w); placed=true; } }
      else { if (canPlaceV(r,c,w)) { placeV(r,c,w); placed=true; } }
    }
    if (!placed) {
      outer: for (let rr=0; rr<rows; rr++) for (let cc=0; cc<=cols-w.length; cc++) if (canPlaceH(rr,cc,w)) { placeH(rr,cc,w); placed=true; break outer; }
      if (!placed) outer2: for (let cc=0; cc<cols; cc++) for (let rr=0; rr<=rows-w.length; rr++) if (canPlaceV(rr,cc,w)) { placeV(rr,cc,w); placed=true; break outer2; }
    }
  }
  const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r=0;r<rows;r++){ for (let c=0;c<cols;c++){ if (!grid[r][c]) grid[r][c]=ABC[randInt(ABC.length)]; } }
  return { grid, placements };
}
