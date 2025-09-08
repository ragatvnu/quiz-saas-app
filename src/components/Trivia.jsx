export default function Trivia({ items = [], showHints = false, qGapPx = 20 }) {
  return (
    <div style={{ padding: "5mm" }}>
      {items.map((q, qIdx) => (
        <div key={qIdx} style={{ marginBottom: qGapPx }}>
          <div style={{ fontWeight: 600 }}>
            Q{qIdx + 1}: {q.question}
          </div>
          <ul>
            {q.choices.map((choice, cIdx) => (
              <li key={cIdx}>
                {String.fromCharCode(65 + cIdx)}) {choice}
              </li>
            ))}
          </ul>
          {showHints && q.hint && (
            <div style={{ marginTop: "2mm", fontStyle: "italic", fontSize: "10pt", color: "#444" }}>
              Hint: {q.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

