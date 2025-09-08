// src/components/KakuroGrid.jsx
import React from "react";

/**
 * Props:
 *  - grid: 2D array of cells:
 *      block: { type:'block', right?:number, down?:number }
 *      empty: { type:'empty', user?:string, answer?:number }
 *  - cell: size (px)
 *  - showAnswers: boolean
 *  - incorrect: Set<string> of "r,c"
 *  - onEdit: (r,c,val)=>void
 */
export default function KakuroGrid({
  grid,
  cell = 46,
  showAnswers = false,
  incorrect = new Set(),
  onEdit,
}){
  if (!grid?.length) return null;
  const key = (r,c)=> `${r},${c}`;

  return (
    <div className="inline-block border border-gray-300 rounded-lg overflow-hidden bg-white">
      {grid.map((row,r)=>(
        <div key={r} className="flex">
          {row.map((obj,c)=>{
            if (obj?.type === 'block'){
              const hasClue = obj?.right != null || obj?.down != null;
              return (
                <div
                  key={c}
                  style={{
                    width: cell, height: cell,
                    background: "#111827", color: "#fff",
                    position: "relative",
                    borderRight: "1px solid #1f2937",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  {hasClue && (
                    <svg width={cell} height={cell} style={{ position:'absolute', inset:0 }}>
                      <line x1="0" y1="0" x2={cell} y2={cell} stroke="#374151" strokeWidth="2" />
                    </svg>
                  )}
                  {obj?.right != null && (
                    <div style={{
                      position:'absolute', top:4, right:6,
                      fontSize: Math.max(9, Math.floor(cell*0.28)),
                      color: "#e5e7eb", fontWeight: 700,
                    }}>{obj.right}</div>
                  )}
                  {obj?.down != null && (
                    <div style={{
                      position:'absolute', bottom:4, left:6,
                      fontSize: Math.max(9, Math.floor(cell*0.28)),
                      color: "#e5e7eb", fontWeight: 700,
                    }}>{obj.down}</div>
                  )}
                </div>
              );
            }

            // empty cell
            const isBad = incorrect.has(key(r,c));
            const view = showAnswers ? (obj?.answer ?? "") : (obj?.user ?? "");
            const border = isBad ? "#ef4444" : "#e5e7eb";
            const ring = isBad ? "0 0 0 2px rgba(239,68,68,0.25)" : "none";
            const textColor = isBad ? "#b91c1c" : "#111827";

            return (
              <div key={c} style={{
                width: cell, height: cell, background: "#fff",
                borderRight: `1px solid ${border}`,
                borderBottom:`1px solid ${border}`, display:'grid', placeItems:'center'
              }}>
                {showAnswers ? (
                  <div style={{
                    fontWeight:800, fontSize: Math.floor(cell*0.42), color: "#111827", lineHeight:1
                  }}>{view}</div>
                ) : (
                  <input
                    inputMode="numeric" pattern="[1-9]" maxLength={1}
                    value={view}
                    onChange={(e)=>{
                      const raw = (e.target.value||"").replace(/[^1-9]/g,'');
                      onEdit && onEdit(r,c, raw.slice(0,1));
                    }}
                    onKeyDown={(e)=>{
                      if (["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) return;
                      if (!/^[1-9]$/.test(e.key)) e.preventDefault();
                    }}
                    style={{
                      width:'100%', height:'100%', textAlign:'center', border:'none', outline:'none',
                      fontWeight:800, fontSize: Math.floor(cell*0.42), color:textColor, boxShadow:ring
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
