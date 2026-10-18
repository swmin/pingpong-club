import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function copySingleFileBundlePlugin() {
  return {
    name: 'copy-singlefile-bundle',
    closeBundle() {
      const distHtml = path.resolve(__dirname, 'dist/index.html')
      const targetHtml = path.resolve(__dirname, 'pingpong-club-scoreboard.html')
      if (fs.existsSync(distHtml)) {
        fs.copyFileSync(distHtml, targetHtml)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), copySingleFileBundlePlugin()],
})
