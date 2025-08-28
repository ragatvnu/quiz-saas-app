import React from 'react'

export default function PuzzlePage({ meta, children }){
  const page = meta.page_size || 'A4'                 // default A4
  const width = page === 'A4' ? '210mm' : '8.5in'     // A4 or US Letter

  return (
    <div className="page bg-white rounded-2xl shadow-sm border p-6 mx-auto my-6" style={{ width }}>
      <header className="text-center mb-4">
        {meta.logo && <img src={meta.logo} alt="Logo" className="h-6 mx-auto mb-2" />}
        <h2 className="text-2xl font-extrabold tracking-tight">{meta.title}</h2>
        {meta.subtitle && <p className="text-sm text-gray-600">{meta.subtitle}</p>}
      </header>

      <main className="min-h-[200px] flex items-center justify-center">
        {children}
      </main>

      <footer className="mt-6 flex items-center justify-between text-xs text-gray-500">
        <span>{meta.branding || '© 2025 HMQUIZ • hmquiz.example'}</span>
        <span>Difficulty: {meta.difficulty ?? '—'}</span>
      </footer>
    </div>
  )
}
