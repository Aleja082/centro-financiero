import fs from 'node:fs'
import path from 'node:path'
import portfolioData from '../src/data/portfolioData.ts'

const outPath = path.resolve('public/data/portfolio.example.json')
fs.writeFileSync(outPath, JSON.stringify(portfolioData, null, 2))
console.log('Escrito:', outPath, '-', fs.statSync(outPath).size, 'bytes')
