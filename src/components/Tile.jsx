import React from 'react'

export default function Tile({ item, size='text-4xl' }){
  if(!item) return null

  // If it's just a string (emoji or word), wrap it into an object
  const obj = (typeof item === 'string') ? { ch: item } : item

  if(obj.src){
    return (
      <img
        src={obj.src}
        alt={obj.alt||''}
        className="mx-auto block select-none"
        style={{width:'100%',height:'100%',objectFit:'contain'}}
      />
    )
  }

  const content = obj.ch || obj.text || obj.alt || '?'
  return <span className={['leading-none select-none', size].join(' ')}>{content}</span>
}
