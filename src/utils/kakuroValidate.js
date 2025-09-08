// src/utils/kakuroValidate.js
// Structural and logical validator for a Kakuro puzzle object.

const key = (r,c)=> r+','+c;

export function validateKakuro(p){
  const issues = [];
  if (!p || !Array.isArray(p.cells) || !p.rows || !p.cols){
    return { ok:false, issues:['Malformed puzzle object'] };
  }
  const { rows, cols, cells } = p;
  const m = Array.from({length:rows},()=>Array(cols).fill(null));
  for (const cell of cells) m[cell.r][cell.c] = { ...cell };

  const isEmpty = (r,c) => r>=0 && r<rows && c>=0 && c<cols && m[r][c].type==='empty';
  const isClue  = (r,c) => r>=0 && r<rows && c>=0 && c<cols && m[r][c].type==='clue';

  // 1) Clue cells must start runs of length >= 2 if they have right/down values
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
    const cell = m[r][c];
    if (cell.type==='clue'){
      if (cell.right!=null){
        if (!(isEmpty(r,c+1) && isEmpty(r,c+2))) issues.push(`Clue at (${r},${c}) has right=${cell.right} but run < 2`);
      }
      if (cell.down!=null){
        if (!(isEmpty(r+1,c) && isEmpty(r+2,c))) issues.push(`Clue at (${r},${c}) has down=${cell.down} but run < 2`);
      }
      if (cell.right==null && cell.down==null){
        issues.push(`Clue at (${r},${c}) has no sums`);
      }
    }
  }

  // 2) Recompute sums from solution values and compare
  if (p.values){
    function sumRight(rr,cc){
      let s=0, c=cc+1; while (c<cols && m[rr][c].type==='empty'){ const v=p.values[key(rr,c)]; s += (v|0); c++; }
      return s;
    }
    function sumDown(rr,cc){
      let s=0, r=rr+1; while (r<rows && m[r][cc].type==='empty'){ const v=p.values[key(r,cc)]; s += (v|0); r++; }
      return s;
    }
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const cell=m[r][c];
      if (cell.type==='clue'){
        if (cell.right!=null){
          const s = sumRight(r,c);
          if (s !== cell.right) issues.push(`Right sum mismatch at (${r},${c}): expected ${cell.right}, got ${s}`);
        }
        if (cell.down!=null){
          const s = sumDown(r,c);
          if (s !== cell.down) issues.push(`Down sum mismatch at (${r},${c}): expected ${cell.down}, got ${s}`);
        }
      }
    }
  }

  // 3) No repeats within a run (check solution values if present)
  if (p.values){
    function checkRun(list){
      const seen=new Set();
      for (const [r,c] of list){
        const v = p.values[key(r,c)];
        if (seen.has(v)) return false;
        seen.add(v);
      }
      return true;
    }
    // across
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const cell=m[r][c];
      if (cell.type!=='empty' && c+1<cols && m[r][c+1].type==='empty'){
        const list=[]; let cc=c+1; while (cc<cols && m[r][cc].type==='empty'){ list.push([r,cc]); cc++; }
        if (!checkRun(list)) issues.push(`Across duplicate digit in run starting at (${r},${c})`);
      }
    }
    // down
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const cell=m[r][c];
      if (cell.type!=='empty' && r+1<rows && m[r+1][c].type==='empty'){
        const list=[]; let rr=r+1; while (rr<rows && m[rr][c].type==='empty'){ list.push([rr,c]); rr++; }
        if (!checkRun(list)) issues.push(`Down duplicate digit in run starting at (${r},${c})`);
      }
    }
  }

  return { ok: issues.length===0, issues };
}
