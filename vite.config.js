import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    open: '/hub.html',
    host: 'localhost',
  },
  build: {
    rollupOptions: {
      input: {
        index:    resolve(__dirname, 'index.html'),
        hub:      resolve(__dirname, 'hub.html'),
        sudoku:   resolve(__dirname, 'sudoku.html'),
        word:     resolve(__dirname, 'word.html'),
        odd:      resolve(__dirname, 'odd.html'),
        emoji:    resolve(__dirname, 'emoji.html'),
        trivia:   resolve(__dirname, 'trivia.html'),
        crossword:resolve(__dirname, 'crossword.html'),
        kakuro:   resolve(__dirname, 'kakuro.html'),
      },
    },
  },
})
