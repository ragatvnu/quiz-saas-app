export default function CoverPage({ title, subtitle, tagline="" }) {
  return (
    <div className="w-full h-full grid place-items-center text-center">
      <div>
        <h1 className="text-5xl font-extrabold mb-2">{title}</h1>
        <p className="text-xl mb-6">{subtitle}</p>
        {tagline && <p className="opacity-70">{tagline}</p>}
      </div>
    </div>
  );
}

