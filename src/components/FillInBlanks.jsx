import React from 'react'

export default function FillInBlanks({ data, showAnswers }){
  const style = data.render?.style || 'boxes' // 'boxes' | 'underscores'
  function renderBlanks(item){
    const ans = item.answer?.[0] || ''
    if(showAnswers) return <span className="font-semibold underline underline-offset-4">{ans}</span>
    if(style==='underscores'){
      const len = item.blanks?.[0]?.len || Math.max(ans.length,5)
      return <span className="tracking-wider">{'_'.repeat(len)}</span>
    }
    const len = item.blanks?.[0]?.len || Math.max(ans.length,5)
    return (
      <span className="inline-flex gap-1 align-baseline">
        {Array.from({length:len}).map((_,i)=><span key={i} className="inline-block w-6 h-6 border-b-2 border-gray-800" />)}
      </span>
    )
  }
  return (
    <div className="space-y-3">
      {(data.items||[]).map((it,idx)=>{
        const parts = it.text.split('____')
        const out=[]
        parts.forEach((seg,i)=>{
          out.push(<span key={`seg-${idx}-${i}`}>{seg}</span>)
          if(i < parts.length-1) out.push(<span key={`blk-${idx}-${i}`}>{renderBlanks(it)}</span>)
        })
        return <p key={idx} className="text-lg">{out}</p>
      })}
    </div>
  )
}
