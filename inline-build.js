import fs from 'fs'
import path from 'path'

const distDir = './dist'
const outFile = './看拼音写词语.html'

let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')

// Inline CSS
const cssMatch = html.match(/<link[^>]+href="\.\/assets\/([^"]+\.css)"[^>]*>/)
if (cssMatch) {
  const cssPath = path.join(distDir, 'assets', cssMatch[1])
  const css = fs.readFileSync(cssPath, 'utf-8')
  html = html.replace(cssMatch[0], `<style>${css}</style>`)
}

// Inline dynamic imports as data URLs
const jsDir = path.join(distDir, 'assets')
const jsFiles = fs.readdirSync(jsDir)

// Find the main JS file referenced in the HTML
const mainJsMatch = html.match(/<script[^>]+src="\.\/assets\/([^"]+\.js)"[^>]*><\/script>/)
if (mainJsMatch) {
  let mainJs = fs.readFileSync(path.join(jsDir, mainJsMatch[1]), 'utf-8')

  // Replace dynamic imports with data URL imports
  for (const file of jsFiles) {
    if (file === mainJsMatch[1]) continue
    if (!file.endsWith('.js')) continue

    const importPattern = new RegExp(`import\\("\\./${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\)`, 'g')
    if (importPattern.test(mainJs)) {
      const modCode = fs.readFileSync(path.join(jsDir, file), 'utf-8')
      const dataUrl = 'data:text/javascript;base64,' + Buffer.from(modCode).toString('base64')
      mainJs = mainJs.replace(importPattern, `import("${dataUrl}")`)
    }
  }

  // Inline the main JS
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(mainJs).toString('base64')
  html = html.replace(mainJsMatch[0], `<script type="module" src="${dataUrl}"></script>`)
}

fs.writeFileSync(outFile, html)
console.log(`Single-file build written to: ${outFile}`)
console.log(`Size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`)
