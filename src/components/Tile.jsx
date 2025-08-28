import React from 'react'
export default function Tile({ item, size='text-4xl' }){
  if(!item) return null
  if(item.src){
    return <img src={item.src} alt={item.alt||''} className="mx-auto block select-none" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
  }
  const content = item.ch || item.text || item.alt || '?'
  return <span className={['leading-none select-none', size].join(' ')}>{content}</span>
}
