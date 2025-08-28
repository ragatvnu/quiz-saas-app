import React from 'react'

export default function SpotTheDifference({ data, showAnswers }){
  const W = data.render?.width || 320
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <figure className="relative border rounded-xl overflow-hidden bg-white mx-auto">
        <img src={data.images.left.src} alt={data.images.left.alt||'Left'} style={{ width: W, height:'auto' }} />
        <figcaption className="p-2 text-sm text-gray-600 text-center">Left</figcaption>
      </figure>
      <figure className="relative border rounded-xl overflow-hidden bg-white mx-auto">
        <img src={data.images.right.src} alt={data.images.right.alt||'Right'} style={{ width: W, height:'auto' }} />
        {showAnswers && (
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="none">
            {(data.answers?.regions||[]).map((r,i)=>{
              if(r.shape==='rect') return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#ef4444" strokeWidth="3"/>
              if(r.shape==='poly'){ const pts=r.points.map(([x,y])=>`${x},${y}`).join(' '); return <polyline key={i} points={pts} fill="none" stroke="#ef4444" strokeWidth="3"/> }
              return null
            })}
          </svg>
        )}
        <figcaption className="p-2 text-sm text-gray-600 text-center">
          Right — find {data.differences_required} differences
        </figcaption>
      </figure>
    </div>
  )
}
