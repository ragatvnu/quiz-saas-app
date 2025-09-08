import { promises as fs } from 'fs'
import path from 'path'
const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'public')
const OUT_FILE = path.join(OUT_DIR, 'pages.json')

async function readTitle(file){
  const html = await fs.readFile(file, 'utf8')
  const m = html.match(/<title>(.*?)<\/title>/i)
  return (m && m[1]) ? m[1].trim() : path.basename(file)
}

async function main(){
  const files = await fs.readdir(ROOT)
  const html = files
    .filter(f => f.endsWith('.html'))
    .filter(f => !['index.html','hub.html'].includes(f))

  const entries = await Promise.all(html.map(async f => ({
    href: f,                                // <-- relative link (no leading "/")
    title: await readTitle(path.join(ROOT, f)),
    file: f
  })))

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(OUT_FILE, JSON.stringify({ pages: entries }, null, 2))
  console.log(`Wrote ${OUT_FILE} with ${entries.length} page(s).`)
}
main().catch(e=>{ console.error(e); process.exit(1) })
