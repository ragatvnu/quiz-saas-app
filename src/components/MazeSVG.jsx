// src/components/MazeSVG.jsx
import React, { useMemo } from "react";
import { generateMaze, makeSeed } from "../utils/mazeGenerator.js";

export default function MazeSVG({
  rows=15, cols=15, seed=makeSeed("maze"), cell=18, stroke=2, showSolution=false
}){
  const { walls, path } = useMemo(()=>generateMaze(rows, cols, seed), [rows, cols, seed]);
  const w = cols * cell, h = rows * cell;
  const half = stroke/2;
  const lines = [];
  // Draw outer border & cell walls
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const x=c*cell, y=r*cell;
      const wv = walls[r][c];
      if (wv[0]) lines.push(<line key={`n-${r}-${c}`} x1={x} y1={y} x2={x+cell} y2={y} stroke="black" strokeWidth={stroke} />);
      if (wv[1]) lines.push(<line key={`s-${r}-${c}`} x1={x} y1={y+cell} x2={x+cell} y2={y+cell} stroke="black" strokeWidth={stroke} />);
      if (wv[2]) lines.push(<line key={`e-${r}-${c}`} x1={x+cell} y1={y} x2={x+cell} y2={y+cell} stroke="black" strokeWidth={stroke} />);
      if (wv[3]) lines.push(<line key={`w-${r}-${c}`} x1={x} y1={y} x2={x} y2={y+cell} stroke="black" strokeWidth={stroke} />);
    }
  }
  // Solution path polyline (center of cells)
  const pathPts = path.map(([r,c]) => [c*cell + cell/2, r*cell + cell/2]);
  const d = pathPts.map((p,i)=> (i===0?`M ${p[0]} ${p[1]}`:`L ${p[0]} ${p[1]}`)).join(" ");
  return (
    <svg width={w+stroke} height={h+stroke} viewBox={`-${half} -${half} ${w+stroke} ${h+stroke}`} className="block mx-auto">
      <rect x="-1000" y="-1000" width="3000" height="3000" fill="white" />
      <g>{lines}</g>
      {showSolution && <path d={d} fill="none" stroke="red" strokeWidth={Math.max(2, stroke*0.9)} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
