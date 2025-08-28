import React from 'react'
export default function PuzzlePage({ meta, children }){
  const width = (meta.page_size === 'A4') ? '210mm' : '8.5in'
  return (
    <div className="page bg-white rounded-2xl shadow-sm border p-6 mx-auto" style={{ width }}>
      <header className="text-center mb-4">
        <h2 className="text-2xl font-extrabold">{meta.title}</h2>
        {meta.subtitle && <p className="text-sm text-gray-600">{meta.subtitle}</p>}
      </header>
      <main className="min-h-[200px] flex items-center justify-center">{children}</main>
      <footer className="mt-6 flex items-center justify-between text-xs text-gray-500">
        <span>{meta.license || 'HMQUIZ • Personal/Classroom use'}</span>
        {meta.difficulty && <span>Difficulty: {meta.difficulty}</span>}
      </footer>
    </div>
  )
}
