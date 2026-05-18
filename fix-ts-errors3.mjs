import { writeFileSync, readFileSync } from 'fs'

const api = readFileSync('src/lib/api.ts', 'utf8')
const fixed = api.replace(
  `export interface GradePayload {
  audioBase64: string
  frames: string  // JSON.stringify(string[])
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  email: string
}`,
  `export interface GradePayload {
  audio: string
  audioType: string
  frames: string
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  email: string
}`
)
writeFileSync('src/lib/api.ts', fixed)
console.log('✓ Fixed GradePayload in api.ts')
console.log('\nRun: npm run build')
