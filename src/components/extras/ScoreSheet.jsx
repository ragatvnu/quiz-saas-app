export default function ScoreSheet({ rounds=10 }) {
  const rows = Array.from({length: rounds}, (_,i)=>i+1);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Score Sheet</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr><th className="border p-2">Round</th><th className="border p-2">Team</th><th className="border p-2">Score</th></tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r}><td className="border p-2">{r}</td><td className="border p-2"></td><td className="border p-2"></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

