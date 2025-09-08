import React from 'react'

function s(v, fallback=''){
  if (v == null) return fallback
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v && typeof v === 'object') {
    if (typeof v.text === 'string') return v.text
    if (typeof v.name === 'string') return v.name
    try { return JSON.stringify(v) } catch {}
  }
  return fallback
}

export default function PuzzlePage({ meta = {}, children }){
  const title = s(meta.title, 'Puzzle')
  const subtitle = s(meta.subtitle, '')
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm print:shadow-none">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </header>
      <div>{children}</div>
    </section>
  )
}
