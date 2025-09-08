// src/components/Maze.jsx
import React, { useMemo } from "react";
import { generateMaze } from "../utils/mazeGenerator.js";

function MazeSVG({ maze, cell=22, stroke=2, showSolution=false, startColor="#10b981", endColor="#ef4444", pathColor="#f59e0b" }){
  const { rows, cols, cells, start, end, path } = maze;
  const W = cols*cell, H = rows*cell;

  const walls = [];
  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      const x = c*cell, y = r*cell;
      const cellObj = cells[r][c];
      if (cellObj.N) walls.push({ x1:x, y1:y, x2:x+cell, y2:y });
      if (cellObj.W) walls.push({ x1:x, y1:y, x2:x, y2:y+cell });
      if (r===rows-1 && cellObj.S) walls.push({ x1:x, y1:y+cell, x2:x+cell, y2:y+cell });
      if (c===cols-1 && cellObj.E) walls.push({ x1:x+cell, y1:y, x2:x+cell, y2:y+cell });
    }
  }

  const pathPts = (showSolution && Array.isArray(path) ? path : []).map(([r,c]) => [c*cell + cell/2, r*cell + cell/2]);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
      <g stroke="#111827" strokeWidth={stroke} strokeLinecap="square">
        {walls.map((w,i)=>(<line key={i} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} />))}
      </g>
      <g>
        <circle cx={start[1]*cell + cell/2} cy={start[0]*cell + cell/2} r={Math.max(2, cell*0.18)} fill={startColor} />
        <circle cx={end[1]*cell + cell/2} cy={end[0]*cell + cell/2} r={Math.max(2, cell*0.18)} fill={endColor} />
      </g>
      {showSolution && pathPts.length>1 && (
        <polyline
          points={pathPts.map(p=>p.join(',')).join(' ')}
          fill="none"
          stroke={pathColor}
          strokeWidth={Math.max(2, stroke)}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function Maze({ rows=20, cols=20, seed=123, cell=22, stroke=2, showSolution=false }){
  const maze = useMemo(()=> generateMaze(rows, cols, seed), [rows, cols, seed]);
  return (
    <div className="w-full flex justify-center">
      <MazeSVG maze={maze} cell={cell} stroke={stroke} showSolution={showSolution} />
    </div>
  );
}

export { MazeSVG };
