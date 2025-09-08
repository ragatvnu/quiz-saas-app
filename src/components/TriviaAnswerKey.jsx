export default function TriviaAnswerKey({ title, answerKey = [], groupedByCategory = false, groupedAnswerKey = {} }) {
  return (
    <div>
      <h2 style={{ fontSize: "16pt", fontWeight: 700, marginBottom: "8mm" }}>{title}</h2>
      {groupedByCategory ? (
        Object.keys(groupedAnswerKey).sort().map(cat => (
          <div key={cat} style={{ marginBottom: "6mm" }}>
            <div style={{ fontWeight: 700, marginBottom: "3mm" }}>{cat}</div>
            <div style={{ columns: 2, columnGap: "12mm" }}>
              {groupedAnswerKey[cat].map(a => (
                <div key={a.n}>
                  <strong>Q{a.n}:</strong> {a.answer}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ columns: 4, columnGap: "12mm" }}>
          {answerKey.map((a, idx) => (
            <div key={idx}>
              <strong>Q{a.n}:</strong> {a.answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

