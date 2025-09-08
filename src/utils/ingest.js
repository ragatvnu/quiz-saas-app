/**
 * parseDataFile(text, filename)
 * Supports:
 *  - JSON: object with optional { title, subtitle, items, options, meta, ... }
 *  - CSV:  infers columns; common shapes by component (documented in samples)
 *  - TXT:  simple line formats per component (documented in samples)
 */
export function parseDataFile(text, filename) {
  const lower = (filename || '').toLowerCase()
  if (lower.endsWith('.json')) {
    const data = JSON.parse(text)
    return normalizeAny(data)
  }
  if (lower.endsWith('.csv')) {
    return normalizeAny(parseCSV(text))
  }
  // default TXT
  return normalizeAny(parseTXT(text))
}

// ------- helpers -------
function normalizeAny(data){
  // If data is an array -> wrap as { items: [...] }
  if (Array.isArray(data)) return { items: data }
  // Otherwise pass through
  return data || {}
}

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length)
  if (!lines.length) return {}
  const header = splitCSVLine(lines[0]).map(h=>h.trim())
  const rows = lines.slice(1).map(line => {
    const cells = splitCSVLine(line)
    const obj = {}
    header.forEach((h,i)=> obj[h] = (cells[i] ?? '').trim())
    return obj
  })
  return { items: rows }
}

function splitCSVLine(line){
  const out=[]; let cur=''; let q=null
  for (let i=0;i<line.length;i++){
    const ch=line[i]
    if (q){
      if (ch===q){
        if (line[i+1]===q){ cur+=q; i++ } else { q=null }
      } else { cur+=ch }
    } else {
      if (ch==='"' || ch==="'"){ q=ch }
      else if (ch===','){ out.push(cur); cur='' }
      else { cur+=ch }
    }
  }
  out.push(cur)
  return out
}

function parseTXT(text){
  // Return { items: [ { line: '...' } ] } as generic fallback
  return { items: text.split(/\r?\n/).map(line=>({ line })).filter(x=>x.line.trim()) }
}
