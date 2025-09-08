// src/components/CrosswordGrid.jsx
import React from "react";

/**
 * Props:
 *  - grid: 2D array of cells: { type: "block" | "letter", ch?: string }
 *  - numbers: 2D array of numbering (or null) for clue numbers
 *  - onCellClick?: (r,c) => void
 */
export default function CrosswordGrid({ grid, numbers, onCellClick }) {
  const size = 34;
  return (
    <div style={{ width: size * grid[0].length, margin: "0 auto" }}>
      <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                const isBlock = cell.type === "block";
                const num = numbers?.[r]?.[c] || null;
                return (
                  <td
                    key={c}
                    onClick={() => onCellClick && onCellClick(r, c)}
                    style={{
                      width: size,
                      height: size,
                      border: "1px solid #9ca3af",
                      background: isBlock ? "#111827" : "#fff",
                      color: isBlock ? "#fff" : "#111827",
                      position: "relative",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
                      fontWeight: 800,
                      fontSize: 18,
                      userSelect: "none",
                    }}
                  >
                    {!isBlock && num != null && (
                      <div
                        style={{
                          position: "absolute",
                          left: 2,
                          top: 0,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#374151",
                        }}
                      >
                        {num}
                      </div>
                    )}
                    {!isBlock ? (cell.ch || "") : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
