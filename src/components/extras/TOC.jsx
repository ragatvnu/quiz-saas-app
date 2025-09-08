export default function TOC({ entries=[], title="Contents" }) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <ol className="space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="flex justify-between">
            <span>{e.label}</span><span>{e.page}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

