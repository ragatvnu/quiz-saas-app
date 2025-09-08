export default function FooterPage({ brand="HMQUIZ", url="https://example.com" }) {
  return (
    <div className="w-full h-full grid place-items-center text-center">
      <div>
        <h3 className="text-2xl font-bold mb-2">Thanks for playing!</h3>
        <p className="mb-2">Find more packs & updates:</p>
        <p className="font-semibold">{brand}</p>
        <p className="opacity-70">{url}</p>
        <p className="mt-6 text-xs opacity-60">Personal use license. Not for resale. © {new Date().getFullYear()} {brand}</p>
      </div>
    </div>
  );
}

